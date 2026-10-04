import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import artifactBuildStarted from "./artifact-build-started.mjs";

describe("Linux package-type marker", () => {
  let release;
  afterEach(() => fs.rmSync(release, { recursive: true, force: true }));

  function setup() {
    release = fs.mkdtempSync(path.join(os.tmpdir(), "sc-agent-artifact-"));
    const resources = path.join(release, "linux-unpacked", "resources");
    fs.mkdirSync(resources, { recursive: true });
    return path.join(resources, "package-type");
  }

  it("marks the DEB and clears the marker for the AppImage", async () => {
    const marker = setup();
    await artifactBuildStarted({ targetPresentableName: "AppImage", file: path.join(release, "a.AppImage"), arch: 1 });
    expect(fs.existsSync(marker)).toBe(false);
    await artifactBuildStarted({ targetPresentableName: "deb", file: path.join(release, "a.deb"), arch: 1 });
    expect(fs.readFileSync(marker, "utf8")).toBe("deb");
    await artifactBuildStarted({ targetPresentableName: "AppImage", file: path.join(release, "a.AppImage"), arch: 1 });
    expect(fs.existsSync(marker)).toBe(false);
  });

  it("ignores other targets", async () => {
    const marker = setup();
    await artifactBuildStarted({ targetPresentableName: "nsis", file: path.join(release, "a.exe"), arch: 1 });
    expect(fs.existsSync(marker)).toBe(false);
  });
});
