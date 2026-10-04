# SocialCoffeeAgent Cloud Pro home machine: one per customer on Fly (fly.toml beside this
# file, docs/cloud-pro.md). The published server image, plus the engine CLIs
# people sign in to, plus Caddy as the only listener the network can reach.
#
#   docker build -t socialcoffee-agent .
#   docker build -f deploy/fly/Dockerfile --build-arg BASE_IMAGE=socialcoffee-agent -t omb-cloud-home .
#
# HOME is the /data volume, so Claude Code and Codex sign-ins (~/.claude,
# ~/.codex) and SocialCoffeeAgent's own state (~/.socialcoffee-agent) persist.
ARG BASE_IMAGE=ghcr.io/viewofmind/socialcoffee-agent:latest
FROM caddy:2.10.2 AS edge

FROM ${BASE_IMAGE}
USER root
# Build-time CLI caches must not end up in a customer's volume.
ENV HOME=/tmp/omb-build-home
# Engine CLIs baked into the image (space-separated npm packages). The base
# image already carries agent-browser and its Chrome.
ARG ENGINES="@anthropic-ai/claude-code @openai/codex"
RUN if [ -n "$ENGINES" ]; then npm install -g $ENGINES; fi
COPY --from=edge /usr/bin/caddy /usr/local/bin/caddy
# Official Caddy carries a privileged-port file capability. The edge uses the
# unprivileged 8080, and a plain copy to a fresh inode drops the capability.
RUN cp /usr/local/bin/caddy /usr/local/bin/caddy.new \
 && mv /usr/local/bin/caddy.new /usr/local/bin/caddy \
 && caddy version
COPY deploy/fly/Caddyfile /app/cloud/Caddyfile
# The root supervisor runs /app's code and hands the server its secrets, so
# no file there may be one `scagent` can change (the base image gives scagent
# /app/dist-server and /app/dist). Only the /data volume is scagent's; the
# launcher refuses to start otherwise (codeTrustProblem).
RUN OMB_CLOUD_PUBLIC_HOST=validate.fly.dev caddy validate --config /app/cloud/Caddyfile --adapter caddyfile \
 && test -f /app/dist-server/cloud-home-start.js \
 && chown -R root:root /app \
 && chmod -R go-w /app \
 && rm -rf /tmp/omb-build-home
ENV HOME=/data \
    OMB_DATA_DIR=/data/.socialcoffee-agent \
    OMB_PORT=8799 \
    OMB_WEBHOOK_PORT=8800
EXPOSE 8080
# Fly uses the checks in fly.toml; this one serves a plain `docker run`.
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -sf http://127.0.0.1:8080/api/health | grep -q socialcoffee-agent || exit 1
# Starts as root: hands a fresh volume to `scagent`, runs the server and the edge
# as `scagent`, and hands the server its secrets over a pipe, never an
# environment `scagent` could read (server/cloud-home-start.ts). It runs only
# root's code from the image, never anything on the volume.
CMD ["node", "/app/dist-server/cloud-home-start.js"]
