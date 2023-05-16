# upgrade-remix

`upgrade remix` is a CLI utility to update all of your [Remix](https://remix.run) dependencies together.

It automatically detects the relevant `remix` and `@remix-run/*` packages from your `package.json` and runs the proper `npm`/`yarn` command to upgrade them. Once updated it runs a full `npm ci` or `yarn` to ensure everything is synced up.

## Usage

```bash
# By default it will update to the `latest` tag on NPM
> npx upgrade-remix

# Or you can specify a specific version or tag
> npx upgrade-remix 1.16.0
> npx upgrade-remix pre
```
