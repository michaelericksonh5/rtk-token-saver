#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const { runDoctor } = require('./doctor');

function run(command, args) {
  return spawnSync(command, args, {
    stdio: 'inherit',
    windowsHide: true
  });
}

function main() {
  const apply = process.argv.includes('--apply');
  const json = process.argv.includes('--json');
  const before = runDoctor();

  if (json) {
    console.log(JSON.stringify({ before, applied: false }, null, 2));
    return before.ok ? 0 : 1;
  }

  console.log('rtk-token-saver setup');
  console.log('This wrapper does not install RTK binaries. Install RTK from a reviewed upstream release first.');
  console.log('');

  if (!before.results.find((result) => result.name === 'RTK available on PATH').ok) {
    console.log('RTK was not found on PATH. Install RTK, then rerun this setup.');
    return 1;
  }

  if (!apply) {
    console.log('Dry run only. Re-run with --apply to execute `rtk init -g` for Claude Code.');
    console.log('');
    for (const result of before.results) {
      console.log(`${result.ok ? 'OK' : 'WARN'}  ${result.name} - ${result.detail}`);
    }
    return before.ok ? 0 : 1;
  }

  console.log('Running: rtk init -g');
  const result = run('rtk', ['init', '-g']);
  if (result.status !== 0) return result.status || 1;

  const after = runDoctor();
  for (const check of after.results) {
    console.log(`${check.ok ? 'OK' : 'WARN'}  ${check.name} - ${check.detail}`);
  }
  return after.ok ? 0 : 1;
}

if (require.main === module) {
  process.exit(main());
}
