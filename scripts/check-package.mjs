import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';

for (const file of ['index.js', 'index.cjs', 'styles.css']) {
  const content = readFileSync(`dist/${file}`);
  const gzip = gzipSync(content).length;
  console.log(`${file}: ${content.length} bytes; ${gzip} bytes gzip`);
  assert(gzip < (file.endsWith('.css') ? 1024 : 6144), `${file} exceeds its gzip budget`);
}
for (const file of ['index.js', 'index.cjs']) {
  const source = readFileSync(`dist/${file}`, 'utf8');
  assert(source.startsWith('"use client";'), 'Missing client directive');
  const map = JSON.parse(readFileSync(`dist/${file}.map`, 'utf8'));
  assert(!map.sources.some((s) => s.includes('node_modules')), 'Runtime dependency bundled');
}
assert(statSync('dist/index.d.ts').size > 0);
assert(statSync('dist/index.d.cts').size > 0);
const packed = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--ignore-scripts', '--json'], { encoding: 'utf8' }),
)[0];
assert(
  packed.files.every((file) =>
    /^(dist\/|README.md$|LICENSE$|CHANGELOG.md$|package.json$)/.test(file.path),
  ),
  'Unexpected published file',
);
console.log(
  `npm tarball: ${packed.size} bytes; unpacked: ${packed.unpackedSize} bytes; ${packed.entryCount} files`,
);
// Each format is evaluated in a fresh Node process with no browser globals.
for (const format of ['esm', 'cjs']) {
  const code =
    format === 'esm'
      ? "import { DraggableRail } from './dist/index.js'; import React from 'react'; import { renderToString } from 'react-dom/server'; console.log(renderToString(React.createElement(DraggableRail, null, 'SSR smoke')));"
      : "const { DraggableRail } = require('./dist/index.cjs'); const React = require('react'); const {renderToString} = require('react-dom/server'); console.log(renderToString(React.createElement(DraggableRail, null, 'SSR smoke')));";
  const result = execFileSync(
    process.execPath,
    [...(format === 'esm' ? ['--input-type=module'] : []), '-e', code],
    { encoding: 'utf8' },
  );
  assert(result.includes('SSR smoke'));
}
console.log('Exports, package allowlist, React externalization, ESM/CJS SSR: passed.');
