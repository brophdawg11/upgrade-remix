# upgrade-remix

`upgrade-remix` is a CLI utility to update all of your [Remix](https://remix.run) dependencies together.

It automatically detects the relevant `remix` and `@remix-run/*` packages from your `package.json` and runs the proper commands to upgrade them. Once updated it runs a full `npm ci`/`yarn`/whatever to ensure everything is synced up.

**Supported Package Managers**

* [`npm`](https://www.npmjs.com)
* [`yarn`](https://yarnpkg.com)
* [`pnpm`](https://pnpm.io)

PR's welcome to support additional package managers!

## Usage

```bash
# By default it will update to the `latest` tag on NPM
> npx upgrade-remix

# Or you can specify a specific version or tag
> npx upgrade-remix 1.16.0
> npx upgrade-remix pre
```
