# upgrade-remix

`upgrade-remix` is a CLI utility to update/list all of your [Remix](https://remix.run) dependencies together.

**Supported Package Managers**

- [`npm`](https://www.npmjs.com)
- [`yarn`](https://yarnpkg.com)
- [`pnpm`](https://pnpm.io)
- [`bun`](https://bun.sh)

PR's welcome to support additional package managers!

## Usage

### Updating Packages

`upgrade-remix` will automatically detect the relevant `remix` and `@remix-run/*` packages from your `package.json` and runs the proper commands to upgrade them. Once updated it runs a full `npm ci`/`yarn install`/etc. to ensure everything is synced up.

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

**`--package-manager`/`-p`**

`upgrade-remix` will try to detect the package manager by looking for a lockfile in the current working directory, but in monorepo setups you may have the lockfile elsewhere so automatic package manager detection may fail. You may use this flag to be explicit about your your package manager:

```sh
npx upgrade-remix --package-manager npm
```

### Listing Packages

You can also use `upgrade-remix` to list currently installed Remix packages to ensure they are synced up and/or de-duped accordingly:

```bash
> npx upgrade-remix --list-versions

# Or using the "-l" shorthand
> npx upgrade-remix -l
```
