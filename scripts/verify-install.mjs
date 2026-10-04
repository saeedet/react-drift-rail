import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
const temporary = mkdtempSync(join(tmpdir(), 'drift-rail-consumer-'));
const packed = JSON.parse(
  execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', temporary], {
    encoding: 'utf8',
  }),
)[0];
try {
  for (const version of ['18', '19']) {
    const directory = join(temporary, `react-${version}`);
    mkdirSync(directory);
    writeFileSync(
      join(directory, 'package.json'),
      JSON.stringify({ name: 'rail-consumer-smoke', private: true, type: 'module' }),
    );
    execFileSync(
      'npm',
      [
        'install',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        join(temporary, packed.filename),
        `react@${version}`,
        `react-dom@${version}`,
      ],
      { cwd: directory, stdio: 'inherit' },
    );
    const code = `import { createRequire } from 'node:module';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { DraggableRail } from 'react-drift-rail';
const require = createRequire(import.meta.url);
const cjs = require('react-drift-rail');
if (!require.resolve('react-drift-rail/styles.css').endsWith('styles.css')) throw Error('CSS export failed');
for (const Component of [DraggableRail, cjs.DraggableRail]) {
  if (!renderToString(React.createElement(Component, { 'aria-label': 'Packed rail' }, 'Installed from tarball')).includes('Installed from tarball')) throw Error('SSR failed');
}
console.log('React ${version}: installed tarball; ESM, CJS, CSS, SSR passed.');`;
    writeFileSync(join(directory, 'smoke.mjs'), code);
    execFileSync(process.execPath, [resolve(directory, 'smoke.mjs')], {
      cwd: directory,
      stdio: 'inherit',
    });
    const pkg = JSON.parse(
      readFileSync(join(directory, 'node_modules/react-drift-rail/package.json'), 'utf8'),
    );
    assert(!pkg.dependencies || Object.keys(pkg.dependencies).length === 0);
  }
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
