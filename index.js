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

const { args, version, implementation } = setup();

if (args["list-versions"]) {
  listVersions();
} else {
  upgradePackages();
}

function setup() {
  const { values: args, positionals } = parseArgs({
    options: {
      "list-versions": {
        type: "boolean",
        short: "l",
      },
    },
    allowPositionals: true,
  });
  const version = positionals[0] || "latest";
  const implementation = getPackageManagerImplementation(version);
  return { args, version, implementation };
}

function getPackageManagerImplementation(v) {
  const isLooseVersion = /^[\^~]/.test(v);
  const implementations = {
    npm: {
      install: (packages, isDev) =>
        [
          "npm install",
          isDev ? "--save-dev" : "--save",
          isLooseVersion ? undefined : "--save-exact",
          packages,
        ]
          .filter((a) => a != undefined)
          .join(" "),
      sync: "npm ci",
      list: (package) => `npm ls ${package}`,
    },
    yarn: {
      install: (packages, isDev) =>
        [
          "yarn add",
          isDev ? "--dev " : undefined,
          isLooseVersion ? undefined : "--exact",
          packages,
        ]
          .filter((a) => a != undefined)
          .join(" "),
      sync: "yarn install --frozen-lockfile",
      list: (package) => `yarn list --pattern ${package}`,
    },
    pnpm: {
      install: (packages, isDev) =>
        [
          "pnpm add",
          isDev ? "--save-dev " : undefined,
          isLooseVersion ? undefined : "--save-exact",
          packages,
        ]
          .filter((a) => a != undefined)
          .join(" "),
      sync: "pnpm install --frozen-lockfile",
      list: (package) => `pnpm list ${package}`,
    },
  };

  if (fs.existsSync(path.join(process.cwd(), "package-lock.json"))) {
    console.log("Found package-lock.json, using npm");
    return implementations.npm;
  } else if (fs.existsSync(path.join(process.cwd(), "yarn.lock"))) {
    console.log("Found yarn.lock, using yarn");
    return implementations.yarn;
  } else if (fs.existsSync(path.join(process.cwd(), "pnpm-lock.yaml"))) {
    console.log("Found pnpm-lock.yaml, using pnpm");
    return implementations.pnpm;
  } else {
    throw new Error("Unsupported Package Manager");
  }
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
  ];
  deps.forEach((dep) => {
    let cmd = implementation.list(dep);
    console.log(`Executing: ${cmd}`);
    let stdout = childProcess.execSync(cmd).toString();
    console.log(stdout);
  });
}

function upgradePackages() {
  console.log(
    `Updating remix packages in "${packageJsonPath}" to version "${version}"`
  );
  const packageJson = require(packageJsonPath);

  function installUpdates(deps, isDev) {
    const packages = getDeps(deps)
      .map((k) => `${k}@${version}`)
      .join(" ");
    const cmd = implementation.install(packages, isDev);
    console.log(`Executing: ${cmd}`);
    childProcess.execSync(cmd);
  }

  installUpdates(packageJson.dependencies, false);
  installUpdates(packageJson.devDependencies, true);

  const syncCmd = implementation.sync;
  console.log(`Running '${syncCmd}' to sync up all deps`);
  childProcess.execSync(syncCmd);
}
