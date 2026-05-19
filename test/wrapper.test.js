const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const { runDoctor } = require('../scripts/lib/doctor');
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

test('package validator rejects nested archives and requires plugin files', () => {
  const result = validatePackage(root);
  assert.strictEqual(result.requiredPresent, true);
  assert.strictEqual(result.nestedArchiveCount, 0);
});
