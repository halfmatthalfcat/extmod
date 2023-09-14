<div align="center">
  <h1>@extmod/core</h1>
  <h2><i>loader</i></h2>
</div>

The ESM loader is the crux of what makes `extmod` work. High level, the loader intercepts all `import` and dynamic `import()`s, analyzes their specifiers, determines whether they're remote (http/https), determines whether those remotes have changed (in order to "bust" the local ESM cache) and, if specified, bundles the specifier with all it's nested dependencies.

## Stages

There are two stages involved with loading ESM modules - the resolve stage and the loading stage. Each of these play important roles.

### Resolving

In order to pull remote modules, we first need to determine whether a specifier is identified as `https?`. If it is, we make a HEAD http call to the resource to determine either it has an etag value or returns a Cache-Control max-age header. These are important aspects as there are runtime performance concerns with pulling remote modules on every load (see below). That being said, please note the following runtime characteristics as it relates to resolving, **IN ORDER OF PRECEDENCE**:

1. If an `etag` value is found for the remote resource, it will be cached within the ESM cache until that value is changed.
2. If a Cache-Control max-age value is found, the remote resouce will be cached within the ESM cache until the TTL has expired.
3. If neither the above are found the remote resource will be fetched **ONCE** and cached indefinitely, as long as the process is running.

### Loading

After we've resolved a module that requires loading (either due to seeing it for the first time or cache invalidation), we fetch that remote module, ensure its an ESM module and, depending on whether we're bundling or not, continue with the bundling procedure or load that code directly into the ESM cache.

#### Import Attributes

To influence resolving, users can leverage ESM [import attributes](https://github.com/tc39/proposal-import-attributes) to affect what the loader ultimately returns.

There are two supported `extmod`-specific import attributes: `bundle` and `client`.

##### `bundle` import attribute

The `bundle` import attribute signals to the loader to bundle the remote resource and any of it's upstream dependencies.

```javascript
import resource from "https://my.resource.com" with { type: "bundle" }
```

##### `client` import attribute

The `client` import attribute signals to the loader that we're loading React Server Component Client code and the importer is expecting this to be ran in a browser.

What is done is the specifier is fetched and bundled for the browser, however React Suspense is leveraged to render a placeholder as the bundling process takes place at runtime and, once finished,
the bundle is automatically downloaded to the browser and rendered in-place.
