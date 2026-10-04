import { copyFileSync, writeFileSync } from 'node:fs';
copyFileSync('src/styles.css', 'dist/styles.css');
writeFileSync('dist/styles.d.ts', 'export {};\n');
