#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const APPROVED_RTK_VERSION = '0.40.0';

function commandResult(command, args = ['--version']) {
  return spawnSync(command, args, { encoding: 'utf8', windowsHide: true });
}

function commandExists(command) {
  const result = commandResult(command);
  return result.status === 0;
}

function resolveCommand(command) {
  const resolver = process.platform === 'win32' ? 'where.exe' : 'which';
  const result = spawnSync(resolver, [command], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) return '';
  return String(result.stdout || '').split(/\r?\n/).find(Boolean) || '';
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function hookCommands(settings, eventName) {
  const groups = settings && settings.hooks && Array.isArray(settings.hooks[eventName])
    ? settings.hooks[eventName]
    : [];
  return groups.flatMap((group) => Array.isArray(group.hooks) ? group.hooks : [])
    .map((hook) => hook && hook.command)
    .filter((command) => typeof command === 'string');
}

function hookEntries(settings, eventName) {
  const groups = settings && settings.hooks && Array.isArray(settings.hooks[eventName])
    ? settings.hooks[eventName]
    : [];
  return groups.flatMap((group) => {
    const matcher = group && group.matcher ? String(group.matcher) : '';
    const hooks = Array.isArray(group && group.hooks) ? group.hooks : [];
    return hooks
      .filter((hook) => hook && typeof hook.command === 'string')
      .map((hook) => ({ matcher, command: hook.command }));
  });
}

function check(name, ok, detail) {
  return { name, ok: Boolean(ok), detail };
}

function runDoctor(options = {}) {
  const home = options.home || os.homedir();
  const settingsPath = path.join(home, '.claude', 'settings.json');
  const settings = readJson(settingsPath) || {};
  const preToolEntries = hookEntries(settings, 'PreToolUse');
  const preToolCommands = preToolEntries.map((entry) => entry.command);
  const postToolCommands = hookCommands(settings, 'PostToolUse');
  const rtkHooks = preToolCommands.filter((command) => /\brtk\b/i.test(command));
  const tokenSaverHooks = [...preToolCommands, ...postToolCommands].filter((command) => /token[-_]saver|pretool-filter|filter-output/i.test(command));
  const nonRtkPreToolHooks = preToolEntries
    .filter((entry) => !/\brtk\b/i.test(entry.command))
    .map((entry) => `${entry.matcher || '*'}: ${entry.command}`);

  const rtkVersion = commandResult('rtk');
  const rtkVersionText = (rtkVersion.stdout || rtkVersion.stderr || '').trim();
  const rtkPath = resolveCommand('rtk');
  const results = [
    check('RTK available on PATH', rtkVersion.status === 0, rtkVersionText || 'rtk --version failed'),
    check('RTK resolved path reviewed', rtkPath.length > 0, rtkPath || 'Could not resolve rtk path.'),
    check('RTK approved version', rtkVersionText.includes(APPROVED_RTK_VERSION), `Expected ${APPROVED_RTK_VERSION}; found ${rtkVersionText || 'unknown'}`),
    check('Claude Code CLI available', commandExists('claude'), 'Run `claude --version`.'),
    check('Claude settings file exists', fs.existsSync(settingsPath), settingsPath),
    check('RTK PreToolUse hook configured', rtkHooks.length > 0, rtkHooks.join(' | ') || 'No RTK PreToolUse hook found.'),
    check('Legacy token-saver hooks absent', tokenSaverHooks.length === 0, tokenSaverHooks.join(' | ') || 'No legacy token-saver hooks found.'),
    check('Other PreToolUse hooks reviewed', nonRtkPreToolHooks.length === 0, nonRtkPreToolHooks.join(' | ') || 'No non-RTK PreToolUse command hooks found.'),
    check('Wrapper plugin has no bundled hook', !fs.existsSync(path.resolve(__dirname, '..', '..', 'hooks', 'hooks.json')), 'This wrapper should not install a competing hook.')
  ];

  return {
    ok: results.every((result) => result.ok),
    approvedRtkVersion: APPROVED_RTK_VERSION,
    rtkPath,
    settingsPath,
    results
  };
}

function printText(report) {
  for (const result of report.results) {
    console.log(`${result.ok ? 'OK' : 'WARN'}  ${result.name} - ${result.detail}`);
  }
  console.log(report.ok ? 'rtk-token-saver doctor passed.' : 'rtk-token-saver doctor found items to review.');
}

if (require.main === module) {
  const json = process.argv.includes('--json');
  const report = runDoctor();
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printText(report);
  }
  process.exit(report.ok ? 0 : 1);
}

module.exports = {
  APPROVED_RTK_VERSION,
  runDoctor
};
