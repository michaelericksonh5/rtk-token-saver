#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function walk(root, relative = '') {
  const dir = path.join(root, relative);
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = path.join(relative, entry.name);
    const normalized = rel.replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (['.git', 'node_modules', 'dist'].includes(entry.name)) continue;
      files.push(...walk(root, rel));
    } else if (entry.isFile()) {
      files.push(normalized);
    }
  }
  return files;
}

function validatePackage(root) {
  const files = walk(root);
  const forbidden = files.filter((file) => /\.(zip|plugin)$/i.test(file) || file === '.env' || file.startsWith('.env.'));
  if (forbidden.length > 0) {
    throw new Error(`Forbidden package files: ${forbidden.join(', ')}`);
  }

  const required = [
    '.claude-plugin/plugin.json',
    'skills/rtk-token-saver/SKILL.md',
    'skills/rtk-token-saver/RTK_SETUP.md',
    'scripts/lib/doctor.js',
    'scripts/lib/install-rtk.js',
    'scripts/lib/setup.js',
    'README.md'
  ];
  const missing = required.filter((file) => !files.includes(file));
  if (missing.length > 0) {
    throw new Error(`Missing required files: ${missing.join(', ')}`);
  }

  return {
    fileCount: files.length,
    requiredPresent: true,
    nestedArchiveCount: 0
  };
}

if (require.main === module) {
  const result = validatePackage(path.resolve(__dirname, '..', '..'));
  console.log(`Package file count: ${result.fileCount}`);
  console.log(`Nested archive count: ${result.nestedArchiveCount}`);
  console.log(`Required files present: ${result.requiredPresent}`);
}

module.exports = {
  validatePackage
};
