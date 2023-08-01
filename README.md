The frontend to [rules.zenlist.dev]

## Requirements

This frontend is a React app that calls out to a WebAssembly module built in\
Rust.

You will need both Node.js and Rust installed to build this project.

## Building

The `evaluator` – the Rust project that gets compiled to WebAssembly – is
treated almost like a separate project because it makes it easier to import as
a web worker.

To build `evaluator`, change directories to that directory and run `npm build`.

Once that is done, run `npm run build` in the main repo.

```
(cd evaluator && npm run build) && npm run build
```

The result will be a `build` directory with all of the files needed for this
project.

[rules.zenlist.dev]: https://rules.zenlist.dev
