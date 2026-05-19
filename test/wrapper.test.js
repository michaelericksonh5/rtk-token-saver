const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const { isLegacyTokenSaverCommand, migrateTokenSaverHooks, parseRtkVersion, runDoctor } = require('../scripts/lib/doctor');
const { ASSETS, RTK_VERSION, defaultInstallDir } = require('../scripts/lib/install-rtk');
const { validatePackage } = require('../scripts/lib/validate-package');

test('plugin manifest is marketplace compatible and does not register hooks', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin', 'plugin.json'), 'utf8'));
  assert.strictEqual(manifest.name, 'rtk-token-saver');
  assert.deepStrictEqual(manifest.skills, ['./skills/rtk-token-saver']);
  assert.strictEqual(manifest.hooks, undefined);
});

test('doctor detects legacy token-saver and RTK hook state', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'rtk-token-saver-test-'));
  const claudeDir = path.join(home, '.claude');
  fs.mkdirSync(claudeDir, { recursive: true });
  fs.writeFileSync(path.join(claudeDir, 'settings.json'), JSON.stringify({
    hooks: {
      PreToolUse: [
        {
          matcher: 'Bash',
          hooks: [
            { type: 'command', command: 'rtk hook claude', timeout: 10 },
            { type: 'command', command: 'node ~/.claude/token-saver/lib/pretool-filter.js', timeout: 10 }
          ]
        }
      ]
    }
  }, null, 2));

  const report = runDoctor({ home });
  const rtkHook = report.results.find((result) => result.name === 'RTK PreToolUse hook configured');
  const legacy = report.results.find((result) => result.name === 'Legacy token-saver hooks absent');
  assert.strictEqual(rtkHook.ok, true);
  assert.strictEqual(legacy.ok, false);
});

test('doctor detects token_saver spelling and other PreToolUse hooks', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'rtk-token-saver-test-'));
  const claudeDir = path.join(home, '.claude');
  fs.mkdirSync(claudeDir, { recursive: true });
  fs.writeFileSync(path.join(claudeDir, 'settings.json'), JSON.stringify({
    hooks: {
      PreToolUse: [
        {
          matcher: 'Bash',
          hooks: [
            { type: 'command', command: 'rtk hook claude', timeout: 10 },
            { type: 'command', command: 'node ~/.claude/token_saver/lib/pretool-filter.js', timeout: 10 },
            { type: 'command', command: 'node ~/.claude/custom/pretool.js', timeout: 10 }
          ]
        }
      ]
    }
  }, null, 2));

  const report = runDoctor({ home });
  const legacy = report.results.find((result) => result.name === 'Legacy token-saver hooks absent');
  const otherHooks = report.results.find((result) => result.name === 'Other PreToolUse hooks reviewed');
  assert.strictEqual(legacy.ok, false);
  assert.match(legacy.detail, /token_saver/);
  assert.strictEqual(otherHooks.ok, false);
  assert.match(otherHooks.detail, /custom\/pretool/);
});

test('migration removes only legacy token-saver hooks and backs up settings', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'rtk-token-saver-test-'));
  const claudeDir = path.join(home, '.claude');
  const settingsPath = path.join(claudeDir, 'settings.json');
  fs.mkdirSync(claudeDir, { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify({
    hooks: {
      PreToolUse: [
        {
          matcher: 'Bash',
          hooks: [
            { type: 'command', command: 'node ~/.claude/token_saver/lib/pretool-filter.js', timeout: 10 },
            { type: 'command', command: 'node ~/.claude/security/pretool-filter.js', timeout: 10 },
            { type: 'command', command: 'pwsh C:/team/filter-output.ps1', timeout: 10 },
            { type: 'command', command: 'node ~/.claude/custom/pretool.js', timeout: 10 }
          ]
        }
      ],
      PostToolUse: [
        {
          matcher: 'Bash',
          hooks: [
            { type: 'command', command: 'pwsh ~/.claude/hooks/token-saver-filter-output.ps1', timeout: 10 }
          ]
        }
      ]
    },
    keep: true
  }, null, 2));

  const result = migrateTokenSaverHooks({ home });
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  const text = JSON.stringify(settings);
  assert.strictEqual(result.changed, true);
  assert.ok(fs.existsSync(result.backupPath));
  assert.match(text, /custom\/pretool/);
  assert.match(text, /security\/pretool-filter/);
  assert.match(text, /team\/filter-output/);
  assert.doesNotMatch(text, /token_saver|token-saver-filter-output/);
  assert.strictEqual(settings.keep, true);
});

test('legacy token-saver detection is path-specific', () => {
  assert.strictEqual(isLegacyTokenSaverCommand('node ~/.claude/token-saver/lib/pretool-filter.js'), true);
  assert.strictEqual(isLegacyTokenSaverCommand('pwsh ~/.claude/hooks/token-saver-filter-output.ps1'), true);
  assert.strictEqual(isLegacyTokenSaverCommand('node ~/.claude/security/pretool-filter.js'), false);
  assert.strictEqual(isLegacyTokenSaverCommand('pwsh C:/team/filter-output.ps1'), false);
});

test('package validator rejects nested archives and requires plugin files', () => {
  const result = validatePackage(root);
  assert.strictEqual(result.requiredPresent, true);
  assert.strictEqual(result.nestedArchiveCount, 0);
});

test('RTK installer pins reviewed release assets', () => {
  assert.strictEqual(RTK_VERSION, '0.40.0');
  assert.match(ASSETS['win32-x64'].name, /windows-msvc\.zip$/);
  assert.match(ASSETS['darwin-arm64'].name, /apple-darwin\.tar\.gz$/);
  assert.match(ASSETS['darwin-x64'].name, /apple-darwin\.tar\.gz$/);
  assert.match(ASSETS['linux-x64'].name, /linux-musl\.tar\.gz$/);
  for (const asset of Object.values(ASSETS)) {
    assert.match(asset.sha256, /^[a-f0-9]{64}$/);
  }
  assert.strictEqual(defaultInstallDir(), path.join(os.homedir(), '.local', 'bin'));
});

test('doctor parses RTK versions exactly', () => {
  assert.strictEqual(parseRtkVersion('rtk 0.40.0'), '0.40.0');
  assert.strictEqual(parseRtkVersion('rtk v0.40.0'), '0.40.0');
  assert.strictEqual(parseRtkVersion('rtk 0.40.01'), '0.40.01');
  assert.notStrictEqual(parseRtkVersion('rtk 0.40.01'), '0.40.0');
});

test('standalone installer requires explicit install flag', () => {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts/lib/install-rtk.js')], {
    encoding: 'utf8'
  });
  assert.notStrictEqual(result.status, 0);
  assert.match(result.stderr, /explicit --install-rtk/);
});
