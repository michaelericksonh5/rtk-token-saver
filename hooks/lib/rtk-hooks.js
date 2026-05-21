'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const NOISY_COMMAND_PREFIXES = [
  /^npm\s+(?:ci|install|test|run\s+(?:build|lint|test))\b/i,
  /^pnpm\s+(?:install|test|run\s+(?:build|lint|test))\b/i,
  /^yarn\s+(?:install|test|run\s+(?:build|lint|test))\b/i,
  /^npx\s+(?:eslint|jest|tsc|vitest)\b/i,
  /^cargo\s+(?:build|check|clippy|test)\b/i,
  /^go\s+test\b/i,
  /^pytest\b/i,
  /^python3?\s+-m\s+pytest\b/i,
  /^git\s+(?:diff|grep|log|show|status)\b/i,
  /^docker\s+(?:build|compose|logs)\b/i,
  /^kubectl\s+(?:describe|diff|get|logs)\b/i
];

function pluginRoot() {
  return process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..', '..');
}

function loadInstaller(root = pluginRoot()) {
  return require(path.join(root, 'scripts', 'lib', 'install-rtk.js'));
}

function commandResult(command, args = ['--version']) {
  return spawnSync(command, args, { encoding: 'utf8', windowsHide: true });
}

function parseRtkVersion(text) {
  const match = String(text || '').match(/\b(?:rtk\s+)?v?(\d+\.\d+\.\d+)\b/i);
  return match ? match[1] : '';
}

function binaryName() {
  return process.platform === 'win32' ? 'rtk.exe' : 'rtk';
}

function candidateBinary(defaultInstallDir) {
  return path.join(defaultInstallDir, binaryName());
}

function checkCommand(command, expectedVersion, runner = commandResult) {
  const result = runner(command, ['--version']);
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
  const version = parseRtkVersion(output);
  return {
    ok: result.status === 0 && version === expectedVersion,
    command,
    version,
    output
  };
}

function writeState(dataDir, state) {
  if (!dataDir) return;
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'rtk-token-saver-state.json'), `${JSON.stringify(state, null, 2)}\n`);
}

function claudeDir(options = {}) {
  return options.claudeDir || path.join(os.homedir(), '.claude');
}

function readState(dataDir) {
  if (!dataDir) return null;
  const statePath = path.join(dataDir, 'rtk-token-saver-state.json');
  if (!fs.existsSync(statePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch {
    return null;
  }
}

function shellQuote(value) {
  return `'${String(value || '').replace(/'/g, "'\\''")}'`;
}

function sha256(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function writeEnvFile(envFile, info) {
  if (!envFile) return;
  const lines = [
    '# rtk-token-saver',
    `export RTK_TOKEN_SAVER_STATUS=${shellQuote(info.status)}`,
    `export RTK_TOKEN_SAVER_VERSION=${shellQuote(info.version || '')}`
  ];
  if (info.binaryPath) {
    lines.push(`export RTK_TOKEN_SAVER_RTK_PATH=${shellQuote(info.binaryPath)}`);
  }
  if (info.installDir) {
    const nextPath = `${info.installDir}${path.delimiter}${process.env.PATH || ''}`;
    lines.push(`export PATH=${shellQuote(nextPath)}`);
  }
  fs.appendFileSync(envFile, `${lines.join(os.EOL)}${os.EOL}`);
}

function existing(paths) {
  return paths.filter((filePath) => filePath && fs.existsSync(filePath));
}

function trustedShellCommands(options = {}) {
  if (options.environmentCommands) return options.environmentCommands;

  if (process.platform === 'win32') {
    const systemRoot = 'C:\\Windows';
    const programFiles = 'C:\\Program Files';
    const pwshRoot = path.join(programFiles, 'PowerShell');
    const pwshVersions = fs.existsSync(pwshRoot)
      ? fs.readdirSync(pwshRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(pwshRoot, entry.name, 'pwsh.exe'))
      : [];
    return {
      pwsh: existing([
        path.join(programFiles, 'PowerShell', '7', 'pwsh.exe'),
        ...pwshVersions
      ])[0],
      powershell: existing([
        path.join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
      ])[0],
      cmd: existing([
        path.join(systemRoot, 'System32', 'cmd.exe')
      ])[0],
      bash: existing([
        path.join(programFiles, 'Git', 'bin', 'bash.exe'),
        path.join(programFiles, 'Git', 'usr', 'bin', 'bash.exe')
      ])[0]
    };
  }

  return {
    pwsh: existing([
      '/opt/microsoft/powershell/7/pwsh',
      '/usr/bin/pwsh'
    ])[0],
    powershell: undefined,
    cmd: undefined,
    bash: existing([
      '/bin/bash',
      '/usr/bin/bash'
    ])[0]
  };
}

function sanitizeText(value, maxLength = 300) {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r?\n/g, ' ')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

function runText(command, args, runner = commandResult) {
  if (!command) return '';
  const result = runner(command, args);
  if (result.status !== 0) return '';
  return sanitizeText(`${result.stdout || ''}${result.stderr || ''}`);
}

function detectShellEnvironment(options = {}) {
  const runner = options.commandRunner || commandResult;
  const commands = trustedShellCommands(options);
  const env = {
    detectedAt: new Date().toISOString(),
    os: {
      type: os.type(),
      platform: process.platform,
      release: os.release(),
      arch: process.arch
    },
    shells: {}
  };

  const pwshJson = runText(commands.pwsh, [
    '-NoProfile',
    '-Command',
    '$o = [ordered]@{ version = $PSVersionTable.PSVersion.ToString(); edition = $PSVersionTable.PSEdition; os = $PSVersionTable.OS; platform = $PSVersionTable.Platform }; $o | ConvertTo-Json -Compress'
  ], runner);
  if (pwshJson) {
    try {
      const parsed = JSON.parse(pwshJson);
      env.shells.pwsh = {
        version: sanitizeText(parsed.version),
        edition: sanitizeText(parsed.edition),
        os: sanitizeText(parsed.os),
        platform: sanitizeText(parsed.platform)
      };
    } catch {
      env.shells.pwsh = { raw: pwshJson };
    }
  }

  const windowsPowerShell = runText(commands.powershell, [
    '-NoProfile',
    '-Command',
    '$PSVersionTable.PSVersion.ToString()'
  ], runner);
  if (windowsPowerShell) {
    env.shells.powershell = { version: windowsPowerShell };
  }

  const cmdVersion = runText(commands.cmd, ['/c', 'ver'], runner);
  if (cmdVersion) {
    env.shells.cmd = { version: cmdVersion };
  }

  const bashVersion = runText(commands.bash, ['--version'], runner);
  if (bashVersion) {
    env.shells.bash = { version: sanitizeText(bashVersion.split(/\r?\n/)[0]) };
  }

  return env;
}

function environmentMarkdown(env) {
  const lines = [
    '# Environment',
    '',
    'Generated by `rtk-token-saver` at session start. Versions are detected on this machine; do not assume they match other users.',
    '',
    '## OS',
    '',
    `- Type: ${env.os.type}`,
    `- Platform: ${env.os.platform}`,
    `- Release: ${env.os.release}`,
    `- Architecture: ${env.os.arch}`,
    '',
    '## Shells',
    ''
  ];

  if (env.shells.pwsh) {
    lines.push(`- PowerShell Core (\`pwsh\`): ${sanitizeText(env.shells.pwsh.version) || 'detected'}${env.shells.pwsh.edition ? `, ${sanitizeText(env.shells.pwsh.edition)}` : ''}${env.shells.pwsh.os ? `, ${sanitizeText(env.shells.pwsh.os)}` : ''}`);
  }
  if (env.shells.powershell) {
    lines.push(`- Windows PowerShell (\`powershell\`): ${sanitizeText(env.shells.powershell.version)}`);
  }
  if (env.shells.cmd) {
    lines.push(`- CMD: ${sanitizeText(env.shells.cmd.version)}`);
  }
  if (env.shells.bash) {
    lines.push(`- Bash: ${sanitizeText(env.shells.bash.version)}`);
  }
  if (lines[lines.length - 1] === '') {
    lines.push('- No shell versions detected.');
  }

  lines.push(
    '',
    '## Authoring Guidance',
    '',
    '- Prefer the detected modern shell when writing commands.',
    '- On Windows, prefer `pwsh` when available and use PowerShell-native path/quoting patterns.',
    '- Do not use `pwsh -Command` with a `param(...)` block plus extra positional args; inline literal-safe values or invoke a script file with parameters.',
    '- Preserve exact commands, paths, errors, and version output when diagnosing setup issues.',
    ''
  );

  return lines.join(os.EOL);
}

function ensureReference(filePath, reference) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const lines = existing.split(/\r?\n/);
  if (lines.some((line) => line.trim() === reference)) return false;
  const next = `${existing}${existing && !existing.endsWith('\n') ? os.EOL : ''}${reference}${os.EOL}`;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, next);
  return true;
}

function updateGlobalEnvironmentMemory(options = {}) {
  const root = claudeDir(options);
  const env = detectShellEnvironment(options);
  const envPath = path.join(root, 'ENV.md');
  const claudePath = path.join(root, 'CLAUDE.md');
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(envPath, environmentMarkdown(env));
  const referenceAdded = ensureReference(claudePath, '@ENV.md');
  return { env, envPath, claudePath, referenceAdded };
}

function isShellUnsafe(command) {
  return /(?:\|\||&&|[;&|<>`]|[\r\n]|\$\()/u.test(command);
}

function isAlreadyWrapped(command) {
  return /^\s*(?:"[^"]*[\\/]rtk(?:\.exe)?"|'[^']*[\\/]rtk'|rtk(?:\.exe)?)\b/i.test(command);
}

function shouldWrapCommand(command) {
  const trimmed = String(command || '').trim();
  if (!trimmed || isAlreadyWrapped(trimmed) || isShellUnsafe(trimmed)) return false;
  return NOISY_COMMAND_PREFIXES.some((pattern) => pattern.test(trimmed));
}

function platformKey() {
  return `${process.platform}-${process.arch}`;
}

function verifyApprovedBinary(binaryPath, installer, runner = commandResult, dataDir = '') {
  if (!fs.existsSync(binaryPath)) return false;
  if (!(installer.ASSETS && installer.ASSETS[platformKey()])) return false;
  const state = readState(dataDir);
  if (!state || !['installed', 'available'].includes(state.status) || state.binaryPath !== binaryPath || !state.binarySha256) return false;
  if (sha256(binaryPath) !== state.binarySha256) return false;
  return checkCommand(binaryPath, installer.RTK_VERSION, runner).ok;
}

function shellCommandPath(binaryPath) {
  const normalized = process.platform === 'win32'
    ? binaryPath.replace(/\\/g, '/')
    : binaryPath;
  return shellQuote(normalized);
}

async function ensureRtk(options = {}) {
  const installer = options.installer || loadInstaller(options.pluginRoot);
  const dataDir = options.dataDir || process.env.CLAUDE_PLUGIN_DATA || path.join(os.tmpdir(), 'rtk-token-saver');
  const envFile = options.envFile !== undefined ? options.envFile : process.env.CLAUDE_ENV_FILE;
  const runner = options.commandRunner || commandResult;
  const now = new Date().toISOString();
  const expectedVersion = installer.RTK_VERSION;
  const defaultDir = installer.defaultInstallDir();
  const installedCandidate = candidateBinary(defaultDir);
  const verifyBinary = options.verifyBinary || verifyApprovedBinary;
  const available = verifyBinary(installedCandidate, installer, runner, dataDir);

  if (available) {
    const state = {
      checkedAt: now,
      status: 'available',
      version: expectedVersion,
      binaryPath: installedCandidate,
      binarySha256: sha256(installedCandidate),
      installDir: defaultDir
    };
    writeState(dataDir, state);
    writeEnvFile(envFile, {
      status: 'available',
      version: expectedVersion,
      binaryPath: installedCandidate,
      installDir: defaultDir
    });
    return { ok: true, status: 'available', version: expectedVersion, command: shellCommandPath(installedCandidate), binaryPath: installedCandidate };
  }

  try {
    const result = await installer.installRtk(options.installOptions || {});
    if (result.installDir) {
      process.env.PATH = `${result.installDir}${path.delimiter}${process.env.PATH || ''}`;
    }
    const installedCheck = checkCommand(result.binaryPath, result.version, runner);
    if (!installedCheck.ok) {
      throw new Error(`Installed RTK did not report expected version ${result.version}: ${installedCheck.output || 'no version output'}`);
    }
    const binarySha256 = result.binarySha256 || sha256(result.binaryPath);
    const state = {
      checkedAt: now,
      status: 'installed',
      version: result.version,
      binaryPath: result.binaryPath,
      binarySha256,
      installDir: result.installDir,
      pathUpdated: Boolean(result.pathUpdated)
    };
    writeState(dataDir, state);
    writeEnvFile(envFile, state);
    return { ok: true, status: 'installed', version: result.version, command: shellCommandPath(result.binaryPath), binaryPath: result.binaryPath, install: result };
  } catch (error) {
    const detail = error && error.message ? error.message : String(error);
    const state = {
      checkedAt: now,
      status: 'unavailable',
      expectedVersion,
      detail
    };
    writeState(dataDir, state);
    writeEnvFile(envFile, { status: 'unavailable', version: expectedVersion });
    return { ok: false, status: 'unavailable', version: expectedVersion, detail };
  }
}

function allowOutput(extra = {}) {
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      ...extra
    }
  };
}

async function handlePreToolUse(input, options = {}) {
  if (!input || input.tool_name !== 'Bash') {
    return allowOutput();
  }
  const toolInput = input.tool_input && typeof input.tool_input === 'object' ? input.tool_input : {};
  const command = typeof toolInput.command === 'string' ? toolInput.command.trim() : '';
  if (!shouldWrapCommand(command)) {
    return allowOutput();
  }

  const rtk = await ensureRtk(options);
  if (!rtk.ok) {
    return allowOutput({
      additionalContext: `RTK unavailable; ran original command. ${rtk.detail || 'Install check failed open.'}`
    });
  }

  return allowOutput({
    updatedInput: {
      ...toolInput,
      command: `${rtk.command} ${command}`
    },
    additionalContext: `RTK ${rtk.version} wrapped noisy Bash command.`
  });
}

async function handleSessionStart(options = {}) {
  const rtk = await ensureRtk(options);
  let envStatus = 'Environment versions were not persisted.';
  try {
    const memory = updateGlobalEnvironmentMemory(options);
    const shellNames = Object.keys(memory.env.shells);
    envStatus = `Environment versions updated in ${memory.envPath}${shellNames.length ? ` (${shellNames.join(', ')})` : ''}.`;
  } catch (error) {
    envStatus = `Environment version detection failed open: ${error.message}`;
  }
  const status = rtk.ok
    ? `RTK ${rtk.version} ${rtk.status}; noisy Bash commands are eligible for automatic RTK wrapping.`
    : `RTK setup failed open: ${rtk.detail || 'unavailable'}. Noisy Bash commands will run normally until RTK is available.`;
  return {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: `Compact TLDR is forced by this plugin. ${status} ${envStatus}`
    }
  };
}

async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

module.exports = {
  ensureRtk,
  handlePreToolUse,
  handleSessionStart,
  isShellUnsafe,
  parseRtkVersion,
  readStdin,
  shouldWrapCommand,
  updateGlobalEnvironmentMemory
};
