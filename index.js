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

const packageJson = require(packageJsonPath);

let isWindows = process.platform === "win32";

const { args, version, implementation, framework } = setup();

if (args["list-versions"]) {
  listVersions();
} else {
  upgradePackages(args);
}

function setup() {
  const { values: args, positionals } = parseArgs({
    options: {
      "dry-run": {
        type: "boolean",
        short: "d",
      },
      force: {
        type: "boolean",
        short: "f",
      },
      list: {
        type: "boolean",
        short: "l",
      },
      "package-manager": {
        type: "string",
        short: "p",
      },
      "no-sync": {
        type: "boolean",
        short: "s",
      },
    },
    allowPositionals: true,
  });
  const version = positionals[0] || "latest";
  const implementation = getPackageManagerImplementation(
    version,
    args["package-manager"]
  );
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const framework = 
    allDeps["@remix-run/react"] ? "remix" : 
    allDeps["react-router"] ? "react-router" : 
    null;

  console.log(`Detected ${framework} application`);
  return { args, version, implementation, framework };
}

function getPackageManagerImplementation(v, packageManagerFlag) {
  const isExact = !/^[\^~]/.test(v);
  const implementations = {
    npm: {
      lockFile: "package-lock.json",
      install: (packages, force, isDev) =>
        [
          "npm install",
          force ? "--force" : undefined,
          isDev ? "--save-dev" : "--save",
          isExact ? "--save-exact" : undefined,
          packages,
        ]
          .filter((a) => a)
          .join(" "),
      sync: "npm ci",
      list: (package) => `npm ls ${package}`,
    },
    yarn: {
      lockFile: "yarn.lock",
      install: (packages, force, isDev) =>
        [
          "yarn add",
          force ? "--force" : undefined,
          isDev ? "--dev" : undefined,
          isExact ? "--exact" : undefined,
          packages,
        ]
          .filter((a) => a)
          .join(" "),
      sync: "yarn install --frozen-lockfile",
      list: (package) => `yarn list --pattern ${package}`,
    },
    pnpm: {
      lockFile: "pnpm-lock.yaml",
      install: (packages, force, isDev) =>
        [
          "pnpm add",
          force ? "--force" : undefined,
          isDev ? "--save-dev" : undefined,
          isExact ? "--save-exact" : undefined,
          packages,
        ]
          .filter((a) => a)
          .join(" "),
      sync: "pnpm install --frozen-lockfile",
      list: (package) => `pnpm list ${package}`,
    },
    bun: {
      lockFile: "bun.lockb",
      install: (packages, force, isDev) =>
        [
          "bun add",
          force ? "--force" : undefined,
          isDev ? "--dev" : undefined,
          isExact ? "--exact" : undefined,
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
  if (framework === "remix") {
    return Object.keys(deps || {}).filter(
      (k) =>
        (k.startsWith("@remix-run/") || k === "remix") &&
        !k.startsWith("@remix-run/v1-") &&
        k !== "@remix-run/router"
    );
  } else if (framework === "react-router") {
    return Object.keys(deps || {}).filter(
      (k) =>
        k.startsWith("@react-router/") ||
        k === "react-router" ||
        k === "react-router-dom"
    );
  }
  throw new Error("Unable to detect if this is a Remix or a React Router app");
}

function listVersions() {
  console.log(`Listing remix packages in "${packageJsonPath}"`);
  const { dependencies, devDependencies } = require(packageJsonPath);
  let deps = [
    ...getDeps(dependencies),
    ...getDeps(devDependencies),
    ...(dependencies["react-router"] ? ["react-router"] : []),
    ...(dependencies["react-router-dom"] ? ["react-router-dom"] : []),
    ...(dependencies["@remix-run/router"] ? ["@remix-run/router"] : []),
  ];
  deps.forEach((dep) => {
    let cmd = implementation.list(dep);
    console.log(`Executing: ${cmd}`);
    let stdout = childProcess.execSync(cmd).toString();
    console.log(stdout);
  });
}

function upgradePackages(args) {
  if (args.dryRun) {
    console.log(`⚠️ Skipping package updates due to --dry-run"`);
    console.log(
      ` - Would have updated ${framework} packages in "${packageJsonPath}" to version "${version}"`
    );
  } else {
    console.log(
      `Updating ${framework} packages in "${packageJsonPath}" to version "${version}"`
    );
  }

  function installUpdates(deps, force, isDev) {
    const packages = getDeps(deps)
      .map((k) => `${k}@${version}`)
      .join(" ");
    const cmd = implementation.install(packages, force, isDev);
    if (args.dryRun) {
      console.log(`SKIPPING install command due to --dry-run:`);
      console.log(`  ${cmd}`);
    } else {
      console.log(`Executing: ${cmd}`);
    }
    childProcess.execSync(cmd);
  }

  installUpdates(packageJson.dependencies, args.force, false);
  installUpdates(packageJson.devDependencies, args.force, true);

  const syncCmd = implementation.sync;
  if (!args["no-sync"] && !args.dryRun) {
    console.log(`Running '${syncCmd}' to sync up all deps`);
    childProcess.execSync(syncCmd);
  }
}
