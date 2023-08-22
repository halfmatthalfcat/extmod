<div align="center">
  <h1>extmod</h1>
 <p><b>Dynamically pull remote ESM modules in Node, ala Federated Modules
</b></p>
</div>

> [!WARNING]
> Extmod relies on currently experimental Node features. While we will strive to maintain compatiblity with future Node releases, please be mindful of the risks associated with including experimental tooling in your stack.

* Pull remote packages into your project, at runtime.
* Supports externals, have dependencies use local packages.

## Mechanism of Action

`extmod` uses two different Node features (both Level 1 Experimental) in order to both allow and dynamically load remote ESM modules at runtime.

### Module Permissions

Node launched [module permissions](https://nodejs.org/api/permissions.html#module-based-permissions) in v11, which allow users to define an allow list of modules that the Node runtime will load and verify
to ensure integrity and security.

Within this feature is the ability to do module _redirection_ where when importing an ESM modules within an `import()` statement, a user can redirect the actual module code loaded from another place.

### ESM Loaders

Node launched [ESM loaders](https://nodejs.org/api/esm.html#loaders) in v8, which hooks into the `import()` machinery to customize the resolution and loading of modules at runtime.

Within this feature is the ability to _remotely pull modules_ via http(s) into your application and runtime to use as you would any other module.

### Runtime Augmentation

Using the `extmod` CLI, one runs a Node script or executable via `extmod run index.mjs` or `extmod run next dev`. Under the hood, `extmod` adds extra Node flags to leverage the local `.extmod.json` configuration (created/managed via the CLI) and the `@extmod/core/loader` ESM loader to enable remote module capabilities.

## Projects

* `@extmod/core`
  * Contains the relevent, custom esm loader, utilities and CLI for managing module permissions.
* `@extmod/example-core`
  * Contains simple tests against `@extmod/example-remote` using `@extmod/core`.
* `@extmod/example-next`
  * Contains a sample Next.js app that pulls in a remote module into a Server Component.
* `@extmod/example-remote`
  * Contains example, locally-hosted test files of various formats for use in local testing.
