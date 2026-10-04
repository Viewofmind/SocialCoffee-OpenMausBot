import { describe, expect, it } from "vitest";

import { launchdPlist, serviceCommand, servicePlan, systemdUnit, unstableInstallWarning, type ServiceSpec } from "./service-unit.ts";

const spec: ServiceSpec = {
  node: "/usr/bin/node",
  script: "/usr/lib/node_modules/socialcoffee-agent/cli.js",
  serveArgs: ["--port", "8799", "--data-dir", "/home/scagent/.socialcoffee-agent", "--domain", "agent.example.com", "--no-pair"],
  dataDir: "/home/scagent/.socialcoffee-agent",
  user: "scagent",
  home: "/home/scagent",
  bindsLowPorts: true,
  label: "agentada",
};

describe("service units", () => {
  it("runs the same serve command, with strip-types only for a checkout", () => {
    expect(serviceCommand(spec)).toEqual(["/usr/bin/node", "/usr/lib/node_modules/socialcoffee-agent/cli.js", "serve", ...spec.serveArgs]);
    expect(serviceCommand({ ...spec, script: "/srv/SocialCoffeeAgent/server/sc-agent.ts" })[1]).toBe("--experimental-strip-types");
  });

  it("renders a systemd unit that restarts, runs as the user, and grants low ports only for --domain", () => {
    const unit = systemdUnit(spec);
    expect(unit).toContain("Description=SocialCoffeeAgent (agentada)");
    expect(unit).toContain("User=scagent");
    expect(unit).toContain("Environment=OMB_DATA_DIR=/home/scagent/.socialcoffee-agent");
    expect(unit).toContain("ExecStart=/usr/bin/node /usr/lib/node_modules/socialcoffee-agent/cli.js serve --port 8799 --data-dir /home/scagent/.sc-agent --domain agent.example.com --no-pair");
    expect(unit).toContain("Restart=always");
    expect(unit).toContain("AmbientCapabilities=CAP_NET_BIND_SERVICE");
    expect(unit).toContain("WantedBy=multi-user.target");
    const local = systemdUnit({ ...spec, bindsLowPorts: false, serveArgs: ["--port", "8799", "--data-dir", "/home/scagent/.socialcoffee-agent"] });
    expect(local).not.toContain("CAP_NET_BIND_SERVICE");
    // a path with a space is quoted for systemd
    expect(systemdUnit({ ...spec, dataDir: "/home/scagent/My Data", serveArgs: ["--data-dir", "/home/scagent/My Data"] })).toContain('ExecStart=/usr/bin/node /usr/lib/node_modules/socialcoffee-agent/cli.js serve --data-dir "/home/scagent/My Data"');
  });

  it("renders a launchd agent that keeps the server alive and logs under the data dir", () => {
    const plist = launchdPlist({ ...spec, home: "/Users/scagent", dataDir: "/Users/scagent/.socialcoffee-agent" });
    expect(plist).toContain("<string>com.socialcoffee-agent.serve</string>");
    expect(plist).toContain("<string>/usr/bin/node</string>");
    expect(plist).toContain("<string>serve</string>");
    expect(plist).toContain("<string>agent.example.com</string>");
    expect(plist).toContain("<key>KeepAlive</key>");
    expect(plist).toContain("/Users/scagent/.socialcoffee-agent/logs/service.log");
    expect(launchdPlist({ ...spec, serveArgs: ["--label", "a & b <c>"] })).toContain("<string>a &amp; b &lt;c&gt;</string>");
  });

  it("refuses to point a service at an npx cache, and knows where each platform's file goes", () => {
    expect(unstableInstallWarning("/home/scagent/.npm/_npx/abc123/node_modules/socialcoffee-agent/cli.js")).toMatch(/npm install -g socialcoffee-agent/);
    expect(unstableInstallWarning("/usr/lib/node_modules/socialcoffee-agent/cli.js")).toBeNull();
    const linux = servicePlan("linux", "/home/scagent/.socialcoffee-agent");
    expect(linux?.installed).toBe("/etc/systemd/system/socialcoffee-agent.service");
    expect(linux?.activate.join("\n")).toContain("systemctl enable --now socialcoffee-agent");
    const mac = servicePlan("darwin", "/Users/scagent/.socialcoffee-agent", "/Users/scagent");
    expect(mac?.installed).toBe("/Users/scagent/Library/LaunchAgents/com.socialcoffee-agent.serve.plist");
    expect(mac?.activate.join("\n")).toContain("launchctl bootstrap gui/$(id -u)");
    expect(servicePlan("win32", "C:\\x")).toBeNull();
  });
});
