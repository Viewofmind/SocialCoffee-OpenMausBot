// Copyright 2026 SocialCoffee DigiTech Pvt Ltd. All rights reserved.
// SocialCoffeeAgent Enterprise License: see ../LICENSE.
//
// SocialCoffeeAgent license keys: `sca1.<claims>.<signature>`.
// <claims> is base64url JSON; <signature> is base64url Ed25519 over the ASCII
// bytes of `sca1.<claims>`, made with a SocialCoffee DigiTech signing key.
// Verification is offline against the public keys in trusted-keys.ts.
import { createHash, createPrivateKey, createPublicKey, sign, verify, type KeyObject } from "node:crypto";
import { z } from "zod";

export const KEY_PREFIX = "sca1";
const DAY_MS = 24 * 60 * 60_000;

const claimsSchema = z.object({
  v: z.literal(1),
  kid: z.string().regex(/^[0-9a-f]{16}$/),
  customer: z.string().trim().min(1).max(200),
  features: z.array(z.string().regex(/^[a-z][a-z0-9-]{0,39}$/)).max(64),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((day) => Number.isFinite(Date.parse(`${day}T00:00:00Z`))).nullable(),
  issuedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict();

export type LicenseClaims = z.infer<typeof claimsSchema>;

export interface VerifiedLicense {
  customer: string;
  features: string[];
  expiresAt: string | null;
}

/** Signing-key id: the first 8 bytes of the SHA-256 of the public key's SPKI DER, in hex. */
export function keyId(publicKey: KeyObject): string {
  return createHash("sha256").update(publicKey.export({ type: "spki", format: "der" })).digest("hex").slice(0, 16);
}

export function publicKeyFromBase64(spkiDer: string): KeyObject {
  const key = createPublicKey({ key: Buffer.from(spkiDer, "base64"), format: "der", type: "spki" });
  if (key.asymmetricKeyType !== "ed25519") throw new Error("trusted license keys must be Ed25519");
  return key;
}

/** Issue a key. Used by scripts/issue-license.ts and tests; never at runtime. */
export function signLicense(
  privateKeyPem: string,
  input: { customer: string; features: string[]; expiresAt: string | null; issuedAt?: string },
): string {
  const privateKey = createPrivateKey(privateKeyPem);
  if (privateKey.asymmetricKeyType !== "ed25519") throw new Error("the signing key must be Ed25519");
  const claims = claimsSchema.parse({
    v: 1,
    kid: keyId(createPublicKey(privateKey)),
    customer: input.customer,
    features: [...new Set(input.features)].sort(),
    expiresAt: input.expiresAt,
    issuedAt: input.issuedAt ?? new Date().toISOString().slice(0, 10),
  });
  const body = `${KEY_PREFIX}.${Buffer.from(JSON.stringify(claims)).toString("base64url")}`;
  return `${body}.${sign(null, Buffer.from(body), privateKey).toString("base64url")}`;
}

/** Check a key against the trusted public keys (key id -> SPKI DER, base64).
 * A key that expired less than `graceDays` ago is still accepted; core counts
 * the grace period down and switches the features off when it ends. */
export function verifyLicenseKey(
  licenseKey: string,
  options: { trustedKeys: Readonly<Record<string, string>>; graceDays?: number; now?: number },
): VerifiedLicense {
  const parts = licenseKey.trim().split(".");
  if (parts.length !== 3 || parts[0] !== KEY_PREFIX || !parts[1] || !parts[2]) {
    throw new Error("OMB_LICENSE_KEY is not a SocialCoffeeAgent license key");
  }
  if (Object.keys(options.trustedKeys).length === 0) {
    throw new Error("this build has no SocialCoffeeAgent license signing key configured");
  }
  let raw: unknown;
  try {
    raw = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    throw new Error("OMB_LICENSE_KEY claims are not readable");
  }
  const parsed = claimsSchema.safeParse(raw);
  if (!parsed.success) throw new Error("OMB_LICENSE_KEY claims are malformed");
  const claims = parsed.data;
  const trusted = Object.hasOwn(options.trustedKeys, claims.kid) ? options.trustedKeys[claims.kid] : undefined;
  if (!trusted) throw new Error("OMB_LICENSE_KEY was signed by a key this build does not trust");
  const publicKey = publicKeyFromBase64(trusted);
  if (keyId(publicKey) !== claims.kid) throw new Error(`trusted license key ${claims.kid} does not match its id`);
  if (!verify(null, Buffer.from(`${parts[0]}.${parts[1]}`), publicKey, Buffer.from(parts[2], "base64url"))) {
    throw new Error("OMB_LICENSE_KEY signature is not valid");
  }
  if (claims.expiresAt) {
    const graceEnds = Date.parse(`${claims.expiresAt}T00:00:00Z`) + (options.graceDays ?? 0) * DAY_MS;
    if ((options.now ?? Date.now()) >= graceEnds) throw new Error(`OMB_LICENSE_KEY expired on ${claims.expiresAt}`);
  }
  return { customer: claims.customer, features: claims.features, expiresAt: claims.expiresAt };
}
