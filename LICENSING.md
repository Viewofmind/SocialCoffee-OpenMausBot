# Licensing

SocialCoffeeAgent is open source under the [Apache License 2.0](LICENSE), with one
carve-out and a few notes.

## The carve-out: `enterprise/`

Everything under `enterprise/` is not Apache 2.0. It is SocialCoffeeAgent
Enterprise, written for this distribution by SocialCoffee DigiTech Pvt Ltd and
proprietary to it, under [`enterprise/LICENSE`](enterprise/LICENSE). It is not
the upstream project's enterprise build and contains none of it. See
[BRANDING.md](BRANDING.md).

Delete the folder and what remains is the open-source edition: the server
reports `{"edition":"oss"}` and ordinary standalone operation is unchanged.
A workspace explicitly configured for hosted sign-in refuses remote access
without an access adapter, and this distribution ships none; removing the
enterprise layer must not bypass a configured sign-in authority. The
`open-source edition builds without enterprise/` CI job proves the OSS build
and boot response. The list
of entitlement ids the server understands is in [`enterprise/FEATURES`](enterprise/FEATURES).

The routing rule for new work: could any open-source user want it? Then it goes
in core, as a public pull request. Organisation-, admin- or tier-flavoured?
Then it lives in `enterprise/` behind an entitlement. Customer-specific brand,
skills, packages or connectors belong in that customer's own repository as
data and configuration, never as a fork.

## Contributions

- Outside `enterprise/`: contribute under Apache 2.0. No DCO sign-off or CLA is
  required. Submit only code you wrote or have the right to contribute.
- Inside `enterprise/`: maintained in-house by SocialCoffee DigiTech Pvt Ltd;
  outside pull requests that change it are not accepted.
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
