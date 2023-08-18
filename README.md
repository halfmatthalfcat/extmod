<div align="center">
  <h1>extmod</h1>
 <p><b>Dynamically pull remote ESM modules in Node, ala Federated Modules
</b></p>
</div>

> [!WARNING]
> Extmod relies on currently experimental Node features. While we will strive to maintain compatiblity with future Node releases, please be mindful of the risks associated with including experimental tooling in your stack.

* Pull remote packages into your project, at buildtime or runtime.
* Supports externals, have dependencies use local packages.

## Projects

* `@extmod/core`
  * Contains the relevent, custom esm loader, utilities and eventual CLI for managing module permissions.
* `@extmod/example-core`
  * Contains simple tests against `@extmod/example-remote` using `@extmod/core`.
* `@extmod/example-remote`
  * Contains example, locally-hosted test files of various formats for use in local testing.
