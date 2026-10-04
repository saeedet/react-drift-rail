import { readFileSync } from 'node:fs';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const repository = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
if (
  pkg.private ||
  !repository ||
  !pkg.author ||
  !pkg.homepage ||
  !pkg.bugs ||
  !repository.includes('github.com/') ||
  /YOUR_|REPLACE|example\.com/.test(JSON.stringify(pkg))
) {
  throw new Error(
    'Release metadata is incomplete. Follow docs/PUBLISHING.md: choose ownership, repository, author, homepage, bugs, and set private:false.',
  );
}
if (process.env.GITHUB_REF_TYPE === 'tag' && process.env.GITHUB_REF_NAME !== `v${pkg.version}`) {
  throw new Error('Git tag must match package.json version.');
}
