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

### Listing Packages

You can also use `upgrade-remix` to list currently installed Remix packages to ensure they are synced up and/or de-duped accordingly:

```bash
> npx upgrade-remix --list-versions

# Or using the "-l" shorthand
> npx upgrade-remix -l
```
