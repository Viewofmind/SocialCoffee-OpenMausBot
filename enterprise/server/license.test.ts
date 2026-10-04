// Copyright 2026 SocialCoffee DigiTech Pvt Ltd. All rights reserved.
// SocialCoffeeAgent Enterprise License: see ../LICENSE.
import { execFileSync } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { register } from "./index.ts";
import { keyId, signLicense, verifyLicenseKey } from "./license.ts";
import { TRUSTED_KEYS } from "./trusted-keys.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const DAY_MS = 24 * 60 * 60_000;
const NOW = Date.parse("2027-01-10T12:00:00Z");

function pair() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    pem: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    trusted: { [keyId(publicKey)]: publicKey.export({ type: "spki", format: "der" }).toString("base64") },
  };
}

const issuer = pair();
const issue = (expiresAt: string | null, features = ["budgets", "billing"]) =>
  signLicense(issuer.pem, { customer: "Acme", features, expiresAt, issuedAt: "2027-01-01" });
const check = (key: string, options: { graceDays?: number; now?: number; trustedKeys?: Record<string, string> } = {}) =>
  verifyLicenseKey(key, { trustedKeys: issuer.trusted, now: NOW, ...options });

describe("SocialCoffeeAgent license keys", () => {
  it("accepts a genuine key and reports its claims", () => {
    expect(check(issue("2027-06-30"))).toEqual({ customer: "Acme", features: ["billing", "budgets"], expiresAt: "2027-06-30" });
    expect(check(issue(null, ["admin"]))).toEqual({ customer: "Acme", features: ["admin"], expiresAt: null });
  });

  it("refuses keys that are not ours, altered, or signed by an untrusted key", () => {
    expect(() => check("omb1.not.real")).toThrow("not a SocialCoffeeAgent license key");
    expect(() => check("sca1.only-two")).toThrow("not a SocialCoffeeAgent license key");
    const key = issue("2027-06-30");
    const [prefix, claims, signature] = key.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(claims!, "base64url").toString()), features: ["admin", "billing", "budgets", "whitelabel"] })).toString("base64url");
    expect(() => check(`${prefix}.${forged}.${signature}`)).toThrow("signature is not valid");
    expect(() => check(`${prefix}.${claims}.${signature!.slice(0, -4)}AAAA`)).toThrow("signature is not valid");
    expect(() => check(`${prefix}.not-json.${signature}`)).toThrow(/claims are (not readable|malformed)/);
    expect(() => check(key, { trustedKeys: pair().trusted })).toThrow("does not trust");
    const other = pair();
    expect(() => check(key, { trustedKeys: { [Object.keys(issuer.trusted)[0]!]: Object.values(other.trusted)[0]! } })).toThrow("does not match its id");
  });

  it("accepts a lapsed key only inside the grace period", () => {
    const lapsed = issue("2027-01-08");
    expect(() => check(lapsed)).toThrow("expired on 2027-01-08");
    expect(check(lapsed, { graceDays: 7 }).expiresAt).toBe("2027-01-08");
    expect(() => check(lapsed, { graceDays: 7, now: Date.parse("2027-01-15T00:00:00Z") })).toThrow("expired on 2027-01-08");
    expect(check(lapsed, { graceDays: 7, now: Date.parse("2027-01-15T00:00:00Z") - 1 }).customer).toBe("Acme");
    expect(() => check(issue("2027-01-10"), { now: Date.parse("2027-01-10T00:00:00Z") + DAY_MS / 2 })).toThrow("expired");
  });

  it("signs only with an Ed25519 key and only valid claims", () => {
    const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    expect(() => signLicense(rsa, { customer: "Acme", features: [], expiresAt: null })).toThrow("Ed25519");
    expect(() => signLicense(issuer.pem, { customer: " ", features: [], expiresAt: null })).toThrow();
    expect(() => signLicense(issuer.pem, { customer: "Acme", features: ["Bad Id"], expiresAt: null })).toThrow();
    expect(() => signLicense(issuer.pem, { customer: "Acme", features: [], expiresAt: "2027-13-40" })).toThrow();
  });

  it("register() uses the trusted keys this build ships", () => {
    expect(register({ licenseKey: issue(null), graceDays: 7 }, issuer.trusted)).toMatchObject({ customer: "Acme" });
    if (Object.keys(TRUSTED_KEYS).length === 0) {
      expect(() => register({ licenseKey: issue(null) })).toThrow("no SocialCoffeeAgent license signing key");
    } else {
      expect(() => register({ licenseKey: issue(null) })).toThrow("does not trust");
    }
  });
});

describe("issuer scripts", () => {
  const dir = mkdtempSync(join(tmpdir(), "sca-licensing-"));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  const run = (script: string, args: string[]) =>
    execFileSync(process.execPath, ["--experimental-strip-types", join(HERE, "..", "scripts", script), ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

  it("generate a private key on disk only and issue keys the printed public key verifies", () => {
    const out = run("keygen.ts", ["--dir", dir]);
    const [pem] = readdirSync(dir);
    const kid = pem!.replace(/\.pem$/, "");
    if (process.platform !== "win32") expect(statSync(join(dir, pem!)).mode & 0o077).toBe(0);
    expect(out).not.toContain("PRIVATE KEY");
    expect(out).not.toContain(readFileSync(join(dir, pem!), "utf8").split("\n")[1]);
    const spki = out.match(new RegExp(`"${kid}": "([A-Za-z0-9+/=]+)"`))?.[1];
    expect(spki).toBeTruthy();
    const key = run("issue-license.ts", ["--key", join(dir, pem!), "--customer", "Acme Pvt Ltd", "--features", "budgets, billing", "--expires", "2099-12-31"]).trim();
    expect(verifyLicenseKey(key, { trustedKeys: { [kid]: spki! } })).toEqual({ customer: "Acme Pvt Ltd", features: ["billing", "budgets"], expiresAt: "2099-12-31" });
    expect(() => run("issue-license.ts", ["--key", join(dir, pem!), "--customer", "Acme", "--features", "budgets"])).toThrow();
  });
});
