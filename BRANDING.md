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
- Routine `runOn: "maus"` and the agents-catalog `run_on` enum value `"maus"` (stored data and the
  tool schema the agents call).
- `OMB_*` environment variables, `OPENMAUSBOT_KEYSTORE_*` CI secrets, and internal constants.
- Native ids: iOS bundle ids, Android `applicationId` / `com.openmausbot.companion` package.
  Changing these needs new Apple and Play store records; only display names were changed.
- `electron/vendor/electron-updater.cjs` (vendored third-party code).
- Mascot body geometry (`shared/mascot-bodies.ts`, `src/components/cursor-face-data.ts`,
  `scripts/gen-mascot-bodies.ts`, `scripts/mascot-bodies/`): data and a generator kept so stored
  `mascotBody` values still validate and the Android generator still builds. The desktop app no
  longer renders it.
- Historical engineering notes under `docs/plans/` and `docs/superpowers/`.

## Legal

- `LICENSE` is unchanged. The core stays Apache-2.0.
- `NOTICE` keeps its upstream text; the SocialCoffeeAgent attribution paragraph is prepended.
- `third_party/` and `public/novnc-NOTICE.txt` are unchanged.
- Milind Soni copyright lines are kept. The SocialCoffee DigiTech Pvt Ltd copyright is added only to
  the About panel, `electron-builder.yml`, and the README license section.
- `CLA.md` is upstream's contributor agreement and is left as written; it needs a SocialCoffee
  replacement (see Follow-ups) before accepting outside contributions to this fork.

## Enterprise split

On this fork, the Apache core is our distribution. `enterprise/` is not:

- `enterprise/LICENSE` is "Copyright (c) 2026 Milind Soni. All rights reserved". Section 3 forbids
  redistributing modified versions, white-labelling, and removing the license check without a
  written partner agreement. This repository is public, so rebranding `enterprise/` or replacing its
  LICENSE would redistribute modified proprietary code without permission.
- `enterprise/` is therefore carried unchanged and is not relicensed by SocialCoffee DigiTech Pvt Ltd.
  The entitlement gate is unchanged; deleting `enterprise/` still boots the open-source edition.
- Core-side (Apache) code that talks to the enterprise layer was rebranded like the rest of the core.
- Upstream maintains its own enterprise build. Any SocialCoffeeAgent enterprise edition on this fork
  must be written fresh under our own license, or rebranded only with a written agreement. Options:
  1. delete `enterprise/` and ship the open-source edition;
  2. keep it as-is under upstream's license;
  3. obtain a written agreement that allows rebranding.

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
- Mobile display names: `ios/project.yml`, `ios/Widgets/Info.plist`,
  `android/app/src/{main,preview}/res/values/strings.xml`.
- Docs and repo meta: `README.md`, `NOTICE`, `LICENSING.md`, `BRANDING.md`, `AGENTS.md`,
  `CONTRIBUTING.md`, `SECURITY.md`, `docs/`, `apps/docs/`, `.github/`.

`git diff --stat main` on the branch has the full list.

## Verification

On the branch: `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint` and
`node scripts/generate-locale.mjs --check` pass. Test results are in the pull request description.

## Follow-ups

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
- **CLA:** replace `CLA.md` with a SocialCoffee DigiTech Pvt Ltd agreement.
- **Enterprise:** decide among the three options above.
- **Alias:** remove `pnpm omb` next release.
