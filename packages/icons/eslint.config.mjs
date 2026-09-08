import { config } from "../eslint-config/react-internal.js";
export default [
  ...config,
  {
    files: ["src/icons/*.tsx"],
    // The icon generator declares both palette slots for every icon.
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { varsIgnorePattern: "^(primary|secondary)$" },
      ],
    },
  },
];
