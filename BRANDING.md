# SocialCoffeeAgent branding

SocialCoffeeAgent is a modified, independently maintained distribution based on OpenMausBot,
Copyright 2026 Milind Soni and OpenMausBot contributors. Modified and maintained by SocialCoffee
DigiTech Pvt Ltd. This product is not OpenMausBot, Maus, or SupaMaus, and is not affiliated with those
names. Upstream: https://github.com/milind-soni/OpenMausBot

This file records how the fork was rebranded, what was deliberately left alone, and what is still to do.

## Identity

| Field | Value |
| --- | --- |
| Product | SocialCoffeeAgent |
| Short name | Agent |
| Company | SocialCoffee DigiTech Pvt Ltd, Ahmedabad |
| Contact | gunjan@socialcoffee.in |
| Homepage / repository | https://github.com/Viewofmind/SocialCoffee-OpenMausBot |
| desktopName / Electron appId | `in.socialcoffee.agent` |
| npm package | `socialcoffee-agent` |
| CLI | `sc-agent` |
| Deep link | `socialcoffee-agent://` |
| Data directory | `~/.socialcoffee-agent` (Electron userData: `<appData>/socialcoffee-agent`) |
| About string | SocialCoffeeAgent by SocialCoffee DigiTech Pvt Ltd |
| Core license | Apache-2.0 (unchanged) |

## Old to new

| Old | New |
| --- | --- |
| OpenMausBot, MausBot, Maus, SupaMaus (product name, titles, menus, onboarding, empty states, settings, docs, default bot names) | SocialCoffeeAgent |
| `MAUS` (webhook / routine labels) | bot |
| `openmausbot` (npm package) | `socialcoffee-agent` |
| `omb` / `openmausbot` CLI | `sc-agent` |
| `server/openmausbot.ts` | `server/sc-agent.ts` |
| `maus.ps1`, `deploy/podman/maus.ps1` | `sc-agent-compose.ps1`, `deploy/podman/sc-agent-compose.ps1` |
| `build/linux-openmausbot-browser.apparmor` | `build/linux-socialcoffee-agent-browser.apparmor` |
| `com.openmausbot.app.desktop` (appId) | `in.socialcoffee.agent` |
| `openmausbot://` | `socialcoffee-agent://` |
| `~/.openmausbot` (and the older `~/.opengrokbot` migration) | `~/.socialcoffee-agent`, no migration |
| openmausbot.com, supamaus.com links | this repository, or `socialcoffee.in` placeholders (see Follow-ups) |
| milind-soni/OpenMausBot release, issue and docs links | Viewofmind/SocialCoffee-OpenMausBot |
| Maus mascot (`CursorAvatar`), mascot preview page | "SC" mark on a per-bot color tile; preview page removed |
| App icon (silver cursor) | "SC" wordmark on `#6F4E37` (`build/icon.*`, `public/app-icon.svg`, `electron/resources/app-icon.png`) |
| Upstream marketing screenshots (`docs/screenshots/hero.png`, `docs-*.png`, ...) | removed |
| iOS `CFBundleDisplayName` / Android `app_name` "MausBot" | SocialCoffeeAgent |

### Hidden `omb` alias

`pnpm omb` is kept for one release only so old scripts fail loudly instead of silently: it runs
`scripts/omb-alias.mjs`, which prints `use sc-agent` and exits 1. It is not documented anywhere else.
Remove it in the next release.

## Kept on purpose (not user-facing, or a wire / native contract)

These still contain the old name because renaming them would break compatibility with existing
clients, servers, store accounts, or third-party contracts:

- `/api/health` app marker `{"app":"openmausbot"}` and the hosted `service: "openmausbot"` marker
  (checked by the CLI, Electron boot probe, companion, Docker/compose health checks).
- `x-openmausbot-*` request headers, `/.well-known/openmausbot/*` paths, `_openmausbot._tcp` mDNS
  type, and the `application/x-openmausbot-sidebar-section` drag type.
- File format ids inside saved files: `openmaus.package`, `openmaus.backup` and
  `openmaus.workspace-backup`. Team packages and backups already shared keep importing.
- `openmausbot://pair` pairing links and `openmausbot://thread/` thread links: the iOS and Android
  companions register `openmausbot://` natively, and their ids are unchanged. The desktop's own
  deep links (install, cloud, organization, settings) use `socialcoffee-agent://`.
- Routine `runOn: "maus"` and the agents-catalog `run_on` enum value `"maus"` (stored data and the
  tool schema the agents call).
- `OMB_*` environment variables, `OPENMAUSBOT_KEYSTORE_*` CI secrets, and internal constants.
- Native ids: iOS bundle ids, Android `applicationId` / `com.openmausbot.companion` package.
  Changing these needs new Apple and Play store records; only display names were changed.
- `electron/vendor/electron-updater.cjs` (vendored third-party code; only our relaunch patch now uses `socialcoffee-agent://organization`).
- Mascot body geometry (`shared/mascot-bodies.ts`, `src/components/cursor-face-data.ts`,
  `scripts/gen-mascot-bodies.ts`, `scripts/mascot-bodies/`): data and a generator kept so stored
  `mascotBody` values still validate and the Android generator still builds. The desktop app no
  longer renders it.
- Historical engineering notes under `docs/plans/` and `docs/superpowers/`.

- The pinned Windows browser engine build input (`server/browser-engine-release.ts`) still
  downloads `agent-browser-win32-x64-0.36.0-omb.1.exe` from the upstream release, verified by its
  pinned SHA-256. This fork has no such release yet. Follow-up: mirror it to a fork release and
  repoint the URL. This is a build input, not the updater feed.

## Legal

- `LICENSE` is unchanged. The core stays Apache-2.0.
- `NOTICE` keeps its upstream text; the SocialCoffeeAgent attribution paragraph is prepended.
- `third_party/` and `public/novnc-NOTICE.txt` are unchanged.
- Milind Soni copyright lines are kept. The SocialCoffee DigiTech Pvt Ltd copyright is added only to
  the About panel, `electron-builder.yml`, and the README license section.
- `CLA.md` (upstream's agreement, which granted rights to the upstream author for `enterprise/`) was
  removed with upstream's `enterprise/`. `enterprise/` here takes no outside contributions; the
  `contributors` workflow refuses outside pull requests that touch it.

## Enterprise split

`enterprise/` on this fork is SocialCoffeeAgent Enterprise: our distribution, separate from upstream's.

- Upstream's `enterprise/` (Copyright Milind Soni, all rights reserved; its license forbids modified
  redistribution and white-labelling) was deleted, not rebranded. Upstream maintains its own
  enterprise build; none of it is in the current tree. Earlier commits in this fork's history still
  carry it unchanged, under upstream's license.
- The new `enterprise/` was written from scratch against the Apache-licensed hook in
  `server/enterprise.ts` (`register()` returning customer, features and expiry). Upstream's
  enterprise source was not used as a reference. It is proprietary to SocialCoffee DigiTech Pvt Ltd
  under `enterprise/LICENSE`.
- Keys are `sca1.<claims>.<signature>`, Ed25519-signed by SocialCoffee DigiTech and checked offline
  against `enterprise/server/trusted-keys.ts`. That list ships empty, so until a public key is added
  every key is refused and builds run the open-source edition. `enterprise/scripts/keygen.ts` and
  `issue-license.ts` run on the issuer's machine; the private key never enters the repository or CI.
- Entitlements (`enterprise/FEATURES`): `whitelabel`, `admin`, `budgets`, `billing`. The features
  themselves are in the Apache core behind `entitled()`; the layer only verifies the key.
- No hosted-workspace sign-in adapter is shipped, so a server configured with `OMB_ADMIN_URL` fails
  closed. `server/hosted-access.test.ts` skips itself while the adapter is absent.
- The entitlement gate is unchanged, and deleting `enterprise/` still boots the open-source edition
  (CI job `open-source edition builds without enterprise/`).
- `OMB_LICENSE_KEY` and `OMB_ENTERPRISE_DIR` keep their names (compatibility env vars).

## Updates and signing

- `electron-builder.yml` has `publish: null`: no update feed, nothing is published by the build, and
  the updater is not pointed at upstream. The upstream GitHub publisher was removed.
- Code signing and notarization are not configured for SocialCoffeeAgent. macOS builds are unsigned
  and not notarized; Windows installers are unsigned.
- The managed Composio broker default is empty: there is no SocialCoffeeAgent-hosted broker yet.

## Files touched

About 920 files. By area:

- Identity and packaging: `package.json`, `electron-builder.yml`, `electron/`, `build/`,
  `scripts/build-npm-package.mjs`, `scripts/omb-alias.mjs`, `server/sc-agent.ts`, `server/config.ts`.
- Product strings: `server/`, `shared/`, `src/` (including `src/locales/*.json` and
  `source-hashes.json`), `companion/`, `cloudflare/`, `deploy/`, `scripts/`, `skills/`, `evals/`,
  `index.html`, `onboarding-preview.html`, Docker and compose files.
- Artwork: `build/icon.*`, `build/icon.iconset/`, `public/app-icon.svg`,
  `electron/resources/app-icon.png`, `src/components/Avatar.tsx`, `src/components/CursorAvatar.tsx`
  (removed), `mascot-preview.html` and `src/mascot-preview.*` (removed), `docs/screenshots/` (marketing
  shots removed), `apps/docs/components/product-screenshot.tsx` (removed).
- Mobile: display names (`ios/project.yml`, `ios/Widgets/Info.plist`, Android `strings.xml`), in-app
  copy in Swift, Kotlin, `Localizable.xcstrings` and every Android `strings.xml`, the launcher and
  notification icons (`ic_launcher_*`, `ic_maus_mark.xml`, `launcher_background`, iOS `AppIcon`), store
  icon sources, and store text. Upstream store screenshots and the feature graphic are removed.
- Enterprise: `enterprise/` replaced (new `LICENSE`, `README.md`, `FEATURES`, `server/`, `scripts/`),
  `CLA.md` removed, `.github/workflows/contributors.yml`, the hosted and verification-docs tests,
  `docs/verification/enterprise-license.md` and `hosted-workspaces.md`.
- Docs and repo meta: `README.md`, `NOTICE`, `LICENSING.md`, `BRANDING.md`, `AGENTS.md`,
  `CONTRIBUTING.md`, `SECURITY.md`, `docs/`, `apps/docs/`, `.github/`.

`git diff --stat main` on the branch has the full list.

## Verification

On the branch: `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint` and
`pnpm i18n:check` pass. `pnpm broker:test`, `pnpm test:electron` and `pnpm test:packaged-server`
pass. In `vitest run`, four files fail on this build machine and fail the same way on `main`, so
they are not caused by the rename:

- `server/engine-install.test.ts` and `server/harness/registry.test.ts`: the reduced test `PATH`
  has no `node` (`/usr/bin/env: 'node': No such file or directory`).
- `server/config.test.ts` (permission/owner change) and two `server/lending-memory.test.ts`
  filesystem fingerprint cases: environment-dependent file metadata on this machine.

`electron/updater-handoff.electron.test.mjs` needs an X display (`DISPLAY` and `XAUTHORITY`).

## Follow-ups

- Updater feed: builds carry no `app-update.yml`, and the packaging gates in CI check that it is absent.
  When signing and a release feed exist, set `publish` and restore those gates, plus the
  `pnpm smoke:linux-update` step in `.github/workflows/package-linux.yml`.
- SBOM property names in `scripts/generate-cua-sbom.mjs` stay `openmausbot:*`, so they match the
  unchanged `third_party/cua-driver/SBOM.cdx.json`.
- **Signing:** Apple Developer ID and notarization, and a Windows code-signing certificate.
- **Release channel:** set up an update feed on this fork before turning `publish` back on.
- **Store listing:** new App Store and Play records under SocialCoffee DigiTech Pvt Ltd; then move
  iOS bundle ids and the Android package off `com.openmausbot.*`. Until then the app links point at
  this repository's releases.
- **Domain:** hosted defaults that used openmausbot.com now point at `socialcoffee.in` hosts
  (cloud account, control plane, docs `metadataBase`, pairing links). Nothing is deployed there yet;
  stand up the services or clear the defaults before relying on hosted features.
- **Icon pack:** a designed icon set (tray, dock, store, docs favicon) to replace the generated "SC"
  wordmark; delete the unused mascot geometry once Android stops generating from it.
- **Mobile mascot:** the iOS and Android companions still draw the bot avatars with the old
  silhouette in native code (`MausSilhouette` and friends) and offer a "Use mascot" avatar option.
  Replacing that needs an Xcode and Android SDK build, which this branch could not run. Icons and
  copy are already rebranded. Not compiled here: the iOS and Android string and icon changes.
- **Store artwork:** capture new App Store and Play screenshots and a feature graphic.
- **Enterprise signing key:** run `node enterprise/scripts/keygen.ts` offline, add the printed public
  key to `enterprise/server/trusted-keys.ts`, and keep the private key backed up offline.
- **Enterprise legal review:** have counsel review `enterprise/LICENSE` and the customer agreement.
- **Hosted workspaces:** write our own sign-in adapter if hosted team workspaces are needed.
- **Alias:** remove `pnpm omb` next release.
