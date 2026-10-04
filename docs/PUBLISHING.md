# First publication and subsequent releases

Publication is deliberate: pushes to `main` do not publish to npm. The package metadata is configured for `react-drift-rail`, and the metadata guard checks the release before publishing. The first release uses an authenticated local npm session; later releases can use the manual GitHub workflow after trusted publishing is configured.

1. Recheck the name with `npm view react-drift-rail`. Confirm npm's naming/similarity rules and your publishing rights. If necessary, choose an owned scope and update all package-name references and the lockfile.
2. Push the reviewed release state to [saeedet/react-drift-rail](https://github.com/saeedet/react-drift-rail) on `main` and require its CI check. Forks must update repository ownership metadata.
3. Confirm the configured `author`, `repository`, `homepage`, and `bugs` metadata in `package.json`. Confirm the license holder. Replace README screenshot and documentation links with working public repository URLs for the npm listing. Add a private conduct contact and enable private vulnerability reporting. Set `private` to `false`, then run `npm install --package-lock-only`. Do not invent owner information.
4. Review the release's real-device results and remaining assistive-technology coverage in `docs/VALIDATION.md`. Review the API and changelog; choose the intended first version with SemVer.
5. Run `npm ci`, `npm run check`, `npm run test:e2e`, `npm run build:demo`, `npm run build:next`, `npm run test:next`, and `npm run test:package`. Install Playwright's browsers first as needed.
6. Run `npm pack --dry-run`, then `npm pack`, and review the actual tarball. Only `dist`, README, license, changelog, and package metadata should ship. The development examples, private reference imagery, and tests must not ship.
7. For a new package, create the first release from a trusted local machine with `npm login` and `npm publish --access public`, satisfying npm's authentication/2FA requirements. Complete npm authentication in the browser without copying credentials into repository files. Commit and tag the exact reviewed release state before publishing.
8. Once npm package settings exist, configure a GitHub Actions trusted publisher for the exact owner/repository, workflow **publish.yml**, and environment **npm**. Enable permission for direct `npm publish`. Configure the matching GitHub `npm` environment. Do not add a long-lived write token.
9. For later releases, update version/changelog, commit, and push the matching `vX.Y.Z` tag. In GitHub Actions, manually run **Publish** against that tag. The workflow checks the tag/version, runs validation again, and publishes with OIDC. Use GitHub-hosted runners and a current Node 24/npm version (trusted publishing requires npm 11.5.1+ and Node 22.14+). The workflow's first successful use is still an external validation step.
10. Confirm the npm dist-tag, install the released version into a consumer, and review generated provenance. Create GitHub release notes from the changelog.

For a public repository and public package, npm trusted publishing automatically attaches provenance. The repository metadata must match the actual repository. A first local bootstrap publication will not have GitHub OIDC provenance; if provenance on the very first release is mandatory, choose and verify a currently supported npm bootstrap/staging process with npm before release.

Reference: [npm trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/). Recheck these service requirements at release time.
