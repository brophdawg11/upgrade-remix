#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const version = process.argv[2] || "latest";

const packageJsonPath = path.join(process.cwd(), "package.json");
if (!fs.existsSync(path.join(process.cwd(), "package-lock.json"))) {
  throw new Error(
    "Could not find a package.json file! " +
      "Please run `npx upgrade-remix` from your root Remix app directory."
  );
}

console.log(
  `Updating remix packages in "${packageJsonPath}" to version "${version}"`
);
const packageJson = require(packageJsonPath);

const implementations = {
  npm: {
    install: (packages, isDev) =>
      `npm install ${isDev ? "--save-dev" : "--save"} ${packages}`,
    sync: "npm ci",
  },
  yarn: {
    install: (packages, isDev) => `yarn add ${isDev ? "-D" : ""} ${packages}`,
    sync: "yarn install --frozen-lockfile",
  },
  pnpm: {
    install: (packages, isDev) => `pnpm add ${isDev ? "-D" : ""} ${packages}`,
    sync: "pnpm install --frozen-lockfile",
  },
};

let implementation;

if (fs.existsSync(path.join(process.cwd(), "package-lock.json"))) {
  console.log("Found package-lock.json, using npm");
  implementation = implementations.npm;
} else if (fs.existsSync(path.join(process.cwd(), "yarn.lock"))) {
  console.log("Found yarn.lock, using yarn");
  implementation = implementations.yarn;
} else if (fs.existsSync(path.join(process.cwd(), "pnpm-lock.yaml"))) {
  console.log("Found pnpm-lock.yaml, using pnpm");
  implementation = implementations.pnpm;
} else {
  throw new Error("Unsupported Package Manager");
}

function installUpdates(deps, isDev) {
  const packages = Object.keys(deps)
    .filter(
      (k) =>
        (k.startsWith("@remix-run/") || k === "remix") &&
        k !== "@remix-run/router"
    )
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
