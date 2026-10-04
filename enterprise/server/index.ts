// Copyright 2026 SocialCoffee DigiTech Pvt Ltd. All rights reserved.
// SocialCoffeeAgent Enterprise License: see ../LICENSE.
//
// Entry point server/enterprise.ts loads. It turns OMB_LICENSE_KEY into the
// customer, entitlements and expiry; core keeps the status and answers
// entitled(). This layer has no hosted-workspace sign-in adapter, so it does
// not export createWorkspaceAccess and a hosted configuration fails closed.
import { verifyLicenseKey, type VerifiedLicense } from "./license.ts";
import { TRUSTED_KEYS } from "./trusted-keys.ts";

export function register(
  { licenseKey, graceDays }: { licenseKey: string; graceDays?: number },
  trustedKeys: Readonly<Record<string, string>> = TRUSTED_KEYS,
): VerifiedLicense {
  return verifyLicenseKey(licenseKey, { trustedKeys, graceDays });
}
