<div align="center">
  <h1>@extmod/example-core</h1>
</div>

A test bed for simple tests against @extmod/core. Leverages @extmod/example-remote to import test 
files of various formats.

## Commands

* `build`
  * Run `tsup` (typescript bundler) and emit test files into `/dist`.
* `start`
  * Run node with applicable test flags against generated files in `/dist`