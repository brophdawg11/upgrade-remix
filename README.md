# upgrade-remix

`upgrade-remix` is a CLI utility to update/list all of your [Remix](https://remix.run) or [React Router](https://reactrouter.com) dependencies together.

> [!WARNING]
> 
> Support has been added for React Router v7 since this is a familiar flow for Remix v2 users. This tool can only update within a Remix v2 app or within a React Router v7 app. It **does not** handle updating from Remix v2 to React Router v7 since it never _changes_ the existing dependencies, it only updates their versions.

**Supported Package Managers**

- [`npm`](https://www.npmjs.com)
- [`yarn`](https://yarnpkg.com)
- [`pnpm`](https://pnpm.io)
- [`bun`](https://bun.sh)

PR's welcome to support additional package managers!

## Usage

### Updating Packages

`upgrade-remix` will automatically detect the relevant `remix`/`@remix-run/*` or `react-router`/`@react-router/*` packages from your `package.json` and runs the proper commands to upgrade them. Once updated it runs a full `npm ci`/`yarn install`/etc. to ensure everything is synced up.

```bash
# By default it will update to the `latest` tag on NPM
> npx upgrade-remix

# Or you can specify a specific version or tag
> npx upgrade-remix 1.16.0
> npx upgrade-remix pre
```

#### Arguments

The following arguments can be passed to `upgrade-remix`:

**`--dry-run`/`-d`**

Setting `--dry-run` will avoid making any changes and will instead print out the install commands it would otherwise have run:

```sh
npx upgrade-remix --dry-run
```

**`--force`/`-f`**

Setting `--force` will apply the `--force` flag to the underlying install commands. This can be useful to ignore `peerDependency` issues that can arise while updating `dependencies`/`devDependencies` without yet having updated the other one.

```sh
npx upgrade-remix --force
```

**`--no-sync`/`-s`**

Setting `--no-sync` will skip running the command at the end to sync up all dependencies (`npm ci`, `yarn install --frozen-lockfile`, etc.).

```sh
npx upgrade-remix --force
```

**`--package-manager`/`-p`**

`upgrade-remix` will try to detect the package manager by looking for a lockfile in the current working directory, but in monorepo setups you may have the lockfile elsewhere so automatic package manager detection may fail. You may use this flag to be explicit about your your package manager:

```sh
npx upgrade-remix --package-manager npm
```

### Listing Packages

You can also use `upgrade-remix` to list currently installed Remix packages to ensure they are synced up and/or de-duped accordingly:

```bash
> npx upgrade-remix --list

# Or using the "-l" shorthand
> npx upgrade-remix -l
```
