# Hosted workspace sign-in and revocation

SocialCoffeeAgent does not ship a hosted workspace sign-in adapter. Core keeps
the optional `createWorkspaceAccess` seam in `server/enterprise.ts`, and the
SocialCoffeeAgent Enterprise layer (`enterprise/`) does not export it.

## What that means for a deployment

A server configured for hosted sign-in (any of `OMB_ADMIN_URL`,
`OMB_ADMIN_WORKSPACE` or `OMB_ADMIN_MEMBERSHIP`) has no access hook, so it
fails closed: remote access is refused, and pairing codes and email sign-in
stay off. It never falls back to them. Unproxied loopback still reaches the
server (see [shared-workspace trust](shared-workspace-trust.md)). Ordinary
self-hosted and desktop servers are unaffected.

## Isolated verification

Read [the verification entry point](README.md) first. Run only disposable
fixtures.

```sh
pnpm exec vitest run server/enterprise.test.ts server/hosted-models-api.test.ts server/email-signin.test.ts server/sessions.test.ts server/request-auth.test.ts
```

`server/hosted-models-api.test.ts` boots a fixture with a stand-in access hook
to check the hosted model policy, which is core behaviour.
`server/hosted-access.test.ts` drives a real adapter end to end and skips
itself when the enterprise layer has no `workspace-access` adapter, as in this
distribution.
