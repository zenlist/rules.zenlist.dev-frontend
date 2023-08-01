const webpack = require("webpack");

module.exports = {
  webpack: {
    plugins: {
      add: [
        new webpack.ProvidePlugin({
          TextDecoder: ["text-encoding", "TextDecoder"],
          TextEncoder: ["text-encoding", "TextEncoder"],
        }),
      ],
    },
    configure: (config) => {
      const wasmExtensionRegExp = /\.wasm$/;
      config.resolve.extensions.push(".wasm");
      config.experiments = {
        syncWebAssembly: true,
        asyncWebAssembly: true,
      };

      config.module.rules.forEach((rule) => {
        (rule.oneOf || []).forEach((oneOf) => {
          if (oneOf.type === "asset/resource") {
            oneOf.exclude.push(wasmExtensionRegExp);
          }
        });
      });

      return config;
    },
  },
};
