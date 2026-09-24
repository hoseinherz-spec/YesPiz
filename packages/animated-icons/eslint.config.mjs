import { config } from "../eslint-config/base.js";

export default [
  ...config,
  {
    files: ["scripts/*.mjs"],
    languageOptions: { globals: { console: "readonly" } },
  },
];
