#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

function commandResult(command, args = ['--version']) {
  return spawnSync(command, args, { encoding: 'utf8', windowsHide: true });
}

function commandExists(command) {
  const result = commandResult(command);
  return result.status === 0;
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

function check(name, ok, detail) {
  return { name, ok: Boolean(ok), detail };
}

function runDoctor(options = {}) {
  const home = options.home || os.homedir();
  const settingsPath = path.join(home, '.claude', 'settings.json');
  const settings = readJson(settingsPath) || {};
  const preToolCommands = hookCommands(settings, 'PreToolUse');
  const postToolCommands = hookCommands(settings, 'PostToolUse');
  const rtkHooks = preToolCommands.filter((command) => /\brtk\b/i.test(command));
  const tokenSaverHooks = [...preToolCommands, ...postToolCommands].filter((command) => /token-saver/i.test(command));

  const rtkVersion = commandResult('rtk');
  const results = [
    check('RTK available on PATH', rtkVersion.status === 0, (rtkVersion.stdout || rtkVersion.stderr || 'rtk --version failed').trim()),
    check('Claude Code CLI available', commandExists('claude'), 'Run `claude --version`.'),
    check('Claude settings file exists', fs.existsSync(settingsPath), settingsPath),
    check('RTK PreToolUse hook configured', rtkHooks.length > 0, rtkHooks.join(' | ') || 'No RTK PreToolUse hook found.'),
    check('Legacy token-saver hooks absent', tokenSaverHooks.length === 0, tokenSaverHooks.join(' | ') || 'No legacy token-saver hooks found.'),
    check('Wrapper plugin has no bundled hook', !fs.existsSync(path.resolve(__dirname, '..', '..', 'hooks', 'hooks.json')), 'This wrapper should not install a competing hook.')
  ];

  return {
    ok: results.every((result) => result.ok),
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
  runDoctor
};
