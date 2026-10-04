// Copyright 2026 SocialCoffee DigiTech Pvt Ltd. All rights reserved.
// SocialCoffeeAgent Enterprise License: see ../LICENSE.
//
// Issue a SocialCoffeeAgent license key for a customer:
//   node enterprise/scripts/issue-license.ts --key ~/.socialcoffee-agent-licensing/<kid>.pem \
//     --customer "Acme Pvt Ltd" --features budgets,billing --expires 2027-12-31
// Pass --perpetual instead of --expires for a key with no end date. The key is
// printed to stdout; the customer sets it as OMB_LICENSE_KEY.
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { signLicense } from "../server/license.ts";

const { values } = parseArgs({
  options: {
    key: { type: "string" },
    customer: { type: "string" },
    features: { type: "string" },
    expires: { type: "string" },
    perpetual: { type: "boolean" },
  },
});
const fail = (message: string): never => {
  console.error(message);
  process.exit(2);
};
if (!values.key || !values.customer || !values.features) fail("--key, --customer and --features are required");
if (Boolean(values.expires) === Boolean(values.perpetual)) fail("pass exactly one of --expires YYYY-MM-DD or --perpetual");
const features = values.features!.split(",").map((feature) => feature.trim()).filter(Boolean);
console.log(signLicense(readFileSync(values.key!, "utf8"), {
  customer: values.customer!,
  features,
  expiresAt: values.expires ?? null,
}));
