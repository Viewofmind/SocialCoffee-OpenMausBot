# SocialCoffeeAgent Google Play release preparation

Use this guide with the [release checklist](CHECKLIST.md). It records repository
inputs and checks to perform for each release; it does not supply approved Play
Console declarations or establish that a release is ready to publish.

## Release identity and build

The Android app is **SocialCoffeeAgent**; the desktop app remains **SocialCoffeeAgent**.
The Android application ID is `in.socialcoffee.agent.companion`.

Use the selected release commit's [Gradle configuration](../app/build.gradle.kts)
for `appVersionName`, the derived `versionCode`, and SDK versions. The code is
calculated as `MAJOR * 10000 + MINOR * 100 + PATCH`, with each part in `0..99`.
Confirm the intended version against existing Console uploads before building.

With JDK 17 and the Android SDK configured, run from the repository root:

```sh
cd android
./gradlew :app:bundleRelease
```

The bundle output, relative to the repository root, is
`android/app/build/outputs/bundle/release/app-release.aab`.
`:app:assembleRelease` builds an APK instead.

Gradle reads signing material from the environment or the gitignored
`android/keystore.properties`; environment values take precedence. The required
settings are `SC_AGENT_KEYSTORE_FILE`, `SC_AGENT_KEYSTORE_PASSWORD`, and
`SC_AGENT_KEY_ALIAS`. `SC_AGENT_KEY_PASSWORD` is optional and defaults to
the store password. File equivalents are `storeFile`, `storePassword`,
`keyAlias`, and `keyPassword`.

Keep keys and passwords outside version control and command history. Without
signing material the release is unsigned; partial configuration fails the build.
Before upload, verify the resulting bundle's signature and certificate identity.
The release owner must confirm the Console's upload/app signing configuration
and test compatibility with any supported existing installations. Do not infer
key ownership, upgrade compatibility, or recovery options from this guide.

Record the commit, version, artifact hash, certificate identity, and verification
results together. A successful build alone does not verify app workflows.

## Listing copy and assets

Suggested short description, subject to verification on the release build:

> Chat with AI bots on your paired computer from your phone.

Describe the SocialCoffeeAgent desktop dependency and the setup needed for each
supported connection method. Write the full description and release notes from
features verified in the selected release. Android call mode and on-device voice
key setup are not established by this preparation work; do not advertise them
based on unmerged work in #739 or #1531. Composer dictation is a separate feature.

These files are candidates for review, not an approved upload set:

| Asset | Repository file | Review needed |
| --- | --- | --- |
| Icon, 512×512 | [play-icon-512.png](assets/play-icon-512.png) | Match the release launcher icon. |
| Feature graphic and phone screenshots | Not in this repository | The upstream store artwork was removed. Capture SocialCoffeeAgent screenshots from the selected release and recreate the feature graphic before submission (see BRANDING.md follow-ups). |

The icon has editable sources in
[play-icon.html](assets/play-icon.html) and
[app-icon-source.svg](assets/app-icon-source.svg). Review rendered outputs after
changing sources. Check current Console asset requirements before submission.

For new screenshots, follow the [verification guide](../../docs/verification/README.md)
and [Android fixture instructions](../../docs/verification/android-threads.md).
Use a disposable emulator and isolated fixture with synthetic content. The
preview variant supports scanner/manual pairing and intentionally excludes
system pairing links and share entrypoints; retain those boundaries. Record the
capture commit and build variant, and verify every selected image reflects the
release. Test any claimed device or tablet support before including it.

## Manual Console and privacy review

The release owner must complete current Console forms using the shipped app,
its dependencies, and the deployed services. Review all applicable declarations,
including data safety, permissions, content rating, audience, ads, and app access.
This guide prescribes no answers or age groups.

Account for each supported connection, provider, and hosting configuration:

- [Network configuration](../app/src/main/res/xml/network_security_config.xml)
  permits cleartext local LAN traffic. Do not claim all traffic is encrypted in
  transit based on the availability of HTTPS or Tailscale routes.
- [Composer dictation](../app/src/main/kotlin/com/socialcoffee/agent/companion/dictation/SpeechDictation.kt)
  can fall back to a platform speech recognizer that uses the network. Review
  that processing alongside messages, attachments, credentials, identifiers,
  optional hosted sign-in, and any other enabled data flows.
- Review the release's merged manifest and dependencies against the source
  [manifest](../app/src/main/AndroidManifest.xml). Explain the actual permission
  use, including QR pairing, dictation, notifications, and background connection.

Manually confirm the privacy policy URL, disclosures, retention and deletion
processes, support contacts, and any signup/account requirements. A URL alone
does not establish a working deletion process. Determine collection and sharing
answers from the complete data flows rather than assuming self-hosted or
transient processing is excluded.

Prepare reviewer access instructions for the actual release: required desktop
setup, reachable test environment, authentication, and enabled server settings.
Verify those instructions on an isolated test setup. Do not promise account-free
access, a demo video, or a server configuration that has not been arranged.

Choose pricing, category, countries, testing track, signing setup, and rollout
scope explicitly in the Console. Check the account's current requirements and
resolve validation messages before submitting. Preserve the reviewed listing,
declarations, artifact identity, and test evidence with the release record.
