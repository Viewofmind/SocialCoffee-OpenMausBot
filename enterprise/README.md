# SocialCoffeeAgent Enterprise

Proprietary layer maintained by SocialCoffee DigiTech Pvt Ltd under its own
[LICENSE](./LICENSE); everything outside this folder is Apache 2.0. It is not
the upstream project's enterprise build.

**Delete this folder and you have the open-source edition.** Core reaches the
layer only through `server/enterprise.ts`, which loads `server/index.ts` here
(or the bundled `index.js`) when it exists.

## Turning a deployment enterprise

Set `OMB_LICENSE_KEY` to a key issued by SocialCoffee DigiTech Pvt Ltd. A key
is `sca1.<claims>.<signature>`: base64url JSON claims (customer, entitlement
ids, expiry, issue date and signing-key id) signed with Ed25519. The server
checks it offline against the public keys in `server/trusted-keys.ts`, so one
build serves every customer and the key decides the features. `GET
/api/edition` reports the result. A missing, altered, untrusted or expired key
runs the open-source edition, with a notice saying what to fix.

[FEATURES](./FEATURES) lists the entitlement ids. This layer has no hosted
workspace sign-in adapter: a server configured for hosted sign-in
(`OMB_ADMIN_URL`) refuses remote access instead of falling back.

## Issuing keys (SocialCoffee DigiTech only)

Run these on the issuer's own machine, never in CI:

```sh
node enterprise/scripts/keygen.ts            # once: writes ~/.socialcoffee-agent-licensing/<kid>.pem
# add the printed line to server/trusted-keys.ts and release a build
node enterprise/scripts/issue-license.ts --key ~/.socialcoffee-agent-licensing/<kid>.pem \
  --customer "Acme Pvt Ltd" --features budgets,billing --expires 2027-12-31
```

The private key must never be committed, pasted into an issue, or stored in
CI. Rotating: generate a new pair, add its public key, ship, then remove the
old public key once its keys have lapsed.
