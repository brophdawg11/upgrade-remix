#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { parseArgs } = require("node:util");
const childProcess = require("child_process");

const packageJsonPath = path.join(process.cwd(), "package.json");
if (!fs.existsSync(packageJsonPath)) {
  throw new Error(
    "Could not find a package.json file! " +
      "Please run `npx upgrade-remix` from your root Remix app directory."
  );
}

let isWindows = process.platform === "win32";

const { args, version, implementation } = setup();

if (args["list-versions"]) {
  listVersions();
} else {
  upgradePackages(args["dry-run"]);
}

function setup() {
  const { values: args, positionals } = parseArgs({
    options: {
      "dry-run": {
        type: "boolean",
        short: "d",
      },
      "list-versions": {
        type: "boolean",
        short: "l",
      },
      "package-manager": {
        type: "string",
        short: "p",
      },
    },
    allowPositionals: true,
  });
  const version = positionals[0] || "latest";
  const implementation = getPackageManagerImplementation(
    version,
    args["package-manager"]
  );
  return { args, version, implementation };
}

function getPackageManagerImplementation(v, packageManagerFlag) {
  const isLooseVersion = /^[\^~]/.test(v);
  const implementations = {
    npm: {
      lockFile: "package-lock.json",
      install: (packages, isDev) =>
        [
          "npm install",
          isDev ? "--save-dev" : "--save",
          isLooseVersion ? undefined : "--save-exact",
          packages,
        ]
          .filter((a) => a)
          .join(" "),
      sync: "npm ci",
      list: (package) => `npm ls ${package}`,
    },
    yarn: {
      lockFile: "yarn.lock",
      install: (packages, isDev) =>
        [
          "yarn add",
          isDev ? "--dev" : undefined,
          isLooseVersion ? undefined : "--exact",
          packages,
        ]
          .filter((a) => a)
          .join(" "),
      sync: "yarn install --frozen-lockfile",
      list: (package) => `yarn list --pattern ${package}`,
    },
    pnpm: {
      lockFile: "pnpm-lock.yaml",
      install: (packages, isDev) =>
        [
          "pnpm add",
          isDev ? "--save-dev" : undefined,
          isLooseVersion ? undefined : "--save-exact",
          packages,
        ]
          .filter((a) => a)
          .join(" "),
      sync: "pnpm install --frozen-lockfile",
      list: (package) => `pnpm list ${package}`,
    },
    bun: {
      lockFile: "bun.lockb",
      install: (packages, isDev) =>
        [
          "bun add",
          isDev ? "--dev" : undefined,
          isLooseVersion ? undefined : "--exact",
          packages,
        ]
          .filter((a) => a)
          .join(" "),

      sync: `bun install --frozen-lockfile`,
      list: (package) => {
        return `bun pm ls | ${isWindows ? "findstr" : "grep"} ${package}`;
      },
    },
  };

  const implementation = packageManagerFlag
    ? [packageManagerFlag, implementations[packageManagerFlag]]
    : Object.entries(implementations).find(([name, impl]) => {
        if (fs.existsSync(path.join(process.cwd(), impl.lockFile))) {
          console.log(`Found ${impl.lockFile}, using ${name}`);
          return true;
        }
      });

  if (!implementation) {
    throw new Error("Unsupported Package Manager");
  }

  return implementation[1];
}

function getDeps(deps) {
  return Object.keys(deps || {}).filter(
    (k) =>
      (k.startsWith("@remix-run/") || k === "remix") &&
      !k.startsWith("@remix-run/v1-") &&
      k !== "@remix-run/router"
  );
}

function listVersions() {
  console.log(`Listing remix packages in "${packageJsonPath}"`);
  const packageJson = require(packageJsonPath);
  let deps = [
    ...getDeps(packageJson.dependencies),
    ...getDeps(packageJson.devDependencies),
    "@remix-run/router",
    "react-router",
    "react-router-dom",
  ];
  deps.forEach((dep) => {
    let cmd = implementation.list(dep);
    console.log(`Executing: ${cmd}`);
    let stdout = childProcess.execSync(cmd).toString();
    console.log(stdout);
  });
}

function upgradePackages(dryRun) {
  if (dryRun) {
    console.log(`SKIPPING package updates due to --dry-run"`);
    console.log(`  detected package.json file: ${packageJsonPath}`);
  } else {
    console.log(
      `Updating remix packages in "${packageJsonPath}" to version "${version}"`
    );
  }
  const packageJson = require(packageJsonPath);

  function installUpdates(deps, isDev) {
    const packages = getDeps(deps)
      .map((k) => `${k}@${version}`)
      .join(" ");
    const cmd = implementation.install(packages, isDev);
    if (dryRun) {
      console.log(`SKIPPING install command due to --dry-run:`);
      console.log(`  ${cmd}`);
    } else {
      console.log(`Executing: ${cmd}`);
    }
    childProcess.execSync(cmd);
  }

  installUpdates(packageJson.dependencies, false);
  installUpdates(packageJson.devDependencies, true);

  const syncCmd = implementation.sync;
  if (!dryRun) {
    console.log(`Running '${syncCmd}' to sync up all deps`);
    childProcess.execSync(syncCmd);
  }
}
