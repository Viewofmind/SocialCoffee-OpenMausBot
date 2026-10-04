// Copyright 2026 Milind Soni and OpenMausBot contributors.
// Copyright 2026 SocialCoffee DigiTech Pvt Ltd.
// SPDX-License-Identifier: Apache-2.0
//
// electron-builder writes resources/package-type only alongside an updater
// feed. Publishing is disabled here, so write the marker for the DEB itself:
// electron/package-install-command.mjs reads it to tell a DEB install from an
// AppImage. Mirrors FpmTarget: written into the shared linux-unpacked tree just
// before fpm runs, and removed before the AppImage is assembled.
import { rm, writeFile } from "node:fs/promises";
import path from "node:path";

const ARCH_SUFFIX = { 0: "-ia32", 1: "", 2: "-armv7l", 3: "-arm64" };

export default async function artifactBuildStarted({ targetPresentableName, file, arch }) {
  if (targetPresentableName !== "deb" && targetPresentableName !== "AppImage") return;
  const suffix = ARCH_SUFFIX[arch ?? 1];
  if (suffix === undefined) throw new Error(`Unsupported Linux package architecture: ${arch}`);
  const marker = path.join(path.dirname(file), `linux${suffix}-unpacked`, "resources", "package-type");
  if (targetPresentableName === "deb") await writeFile(marker, "deb");
  else await rm(marker, { force: true });
}
