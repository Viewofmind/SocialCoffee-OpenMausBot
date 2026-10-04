# Licensing

SocialCoffeeAgent is open source under the [Apache License 2.0](LICENSE), with one
carve-out and a few notes.

## The carve-out: `enterprise/`

Everything under `enterprise/` is not Apache 2.0. On this fork it is still the
upstream enterprise layer, unchanged, under the license in
[`enterprise/LICENSE`](enterprise/LICENSE) (the upstream OpenMausBot Enterprise
License, Copyright Milind Soni). SocialCoffee DigiTech Pvt Ltd does not grant
any rights to that folder and does not relicense it. See
[BRANDING.md](BRANDING.md) for how this fork treats it.

Delete the folder and what remains is the open-source edition: the server
reports `{"edition":"oss"}` and ordinary standalone operation is unchanged.
A workspace explicitly configured for hosted sign-in refuses remote access
without that optional adapter; removing the enterprise layer must not bypass
its configured sign-in authority. The `open-source edition builds without
enterprise/` CI job proves the OSS build, boot response and absent adapter
factory; it does not exercise every hosted HTTP route. The isolated hosted
workspace tests verify those sign-in and revocation paths separately. The list
of entitlement ids the server understands is in [`enterprise/FEATURES`](enterprise/FEATURES).

The routing rule for new work: could any open-source user want it? Then it goes
in core, as a public pull request. Organisation-, admin- or tier-flavoured?
Then it lives in `enterprise/` behind an entitlement. Customer-specific brand,
skills, packages or connectors belong in that customer's own repository as
data and configuration, never as a fork.

## Contributions

- Outside `enterprise/`: contribute under Apache 2.0. No DCO sign-off or CLA is
  required. Submit only code you wrote or have the right to contribute.
- Inside `enterprise/`: the upstream [Contributor License Agreement](CLA.md)
  applies to that folder, which this fork keeps unchanged.
- The open-core boundary, the cloud seam and this file are covered by
  [`CODEOWNERS`](.github/CODEOWNERS): a maintainer reviews changes there.

## Third-party components and trademarks

Bundled third-party software keeps its own licenses; notices, license texts,
source locations and the SBOM are listed in [NOTICE](NOTICE) and
[`third_party/`](third_party/). SocialCoffeeAgent is a modified, independently
maintained distribution of the Apache-licensed upstream project by SocialCoffee
DigiTech Pvt Ltd. The Apache License does not grant trademark rights (section
6), so this distribution uses its own name and mark; see [NOTICE](NOTICE) for
attribution.
