// Copyright 2026 SocialCoffee DigiTech Pvt Ltd. All rights reserved.
// SocialCoffeeAgent Enterprise License: see ../LICENSE.
//
// Create a license signing key pair on the issuer's own machine:
//   node enterprise/scripts/keygen.ts [--dir ~/.socialcoffee-agent-licensing]
// The private key is written there (0600) and never printed. Add the printed
// public-key line to enterprise/server/trusted-keys.ts.
import { generateKeyPairSync } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { keyId } from "../server/license.ts";

const { values } = parseArgs({ options: { dir: { type: "string" } } });
const dir = resolve(values.dir ?? join(homedir(), ".socialcoffee-agent-licensing"));
const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const kid = keyId(publicKey);
mkdirSync(dir, { recursive: true, mode: 0o700 });
const file = join(dir, `${kid}.pem`);
writeFileSync(file, privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600, flag: "wx" });
const spki = publicKey.export({ type: "spki", format: "der" }).toString("base64");
console.log(`private key: ${file} (keep it offline and backed up; never commit it)`);
console.log(`key id: ${kid}`);
console.log("add to TRUSTED_KEYS in enterprise/server/trusted-keys.ts:");
console.log(`  "${kid}": "${spki}",`);
