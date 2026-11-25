// The JavaScript counterpart of Checkstyle and SonarQube: ESLint plus SonarSource's own rule set.
import js from "@eslint/js";
import globals from "globals";
import sonarjs from "eslint-plugin-sonarjs";

const strict = {
  "no-var": "error",
  "prefer-const": "error",
  "eqeqeq": ["error", "always"],
  "curly": ["error", "multi-line"],
  "no-shadow": "error",
  "no-implicit-globals": "error",
  "no-unused-vars": ["error", { args: "after-used" }],
  "no-use-before-define": ["error", { functions: false, variables: false }],
  "no-param-reassign": "error",
  "no-template-curly-in-string": "error",
  "no-unreachable-loop": "error",
  "no-self-compare": "error",
  "require-atomic-updates": "error",
  "no-eval": "error",
  "no-implied-eval": "error",
  "no-new-func": "error",
  "no-script-url": "error",
  "complexity": ["error", 15],
  "max-depth": ["error", 4],
  "max-params": ["error", 5]
};

export default [
  { ignores: ["node_modules/", ".cache/"] },
  js.configs.recommended,
  sonarjs.configs.recommended,
  {
    files: ["**/dist/**/*.js"],
    languageOptions: { sourceType: "script", ecmaVersion: 2021, globals: globals.browser },
    rules: {
      ...strict,
      "strict": ["error", "global"],
      // The page's security policy and its offline use rule these out.
      "no-restricted-properties": ["error",
        { property: "innerHTML", message: "Use textContent or createElement: texts are data, not HTML." },
        { property: "outerHTML", message: "Use replaceWith and createElement." },
        { property: "insertAdjacentHTML", message: "Use append and createElement." },
        { object: "document", property: "write" },
        { object: "Object", property: "hasOwn", message: "Not in older Safari: use Object.prototype.hasOwnProperty.call." }],
      "no-restricted-globals": ["error",
        { name: "fetch", message: "The page works offline and loads nothing at run time." },
        { name: "XMLHttpRequest", message: "The page works offline and loads nothing at run time." }],
      "no-restricted-syntax": ["error",
        { selector: "Literal[value=/[\\u0400-\\u04FF]/]", message: "Visible texts belong in i18n.js, in all three languages." }]
    }
  },
  {
    // Texts live here, so Cyrillic is fine; the language pack is data, not logic.
    files: ["**/dist/i18n.js"],
    rules: { "no-restricted-syntax": "off", "sonarjs/no-duplicate-string": "off" }
  },
  {
    // Checks are long lists of rules that run in Node and, through page.run(), inside the page.
    files: ["tools/**/*.mjs", "eslint.config.js", "stylelint.config.js"],
    languageOptions: { ecmaVersion: 2024, globals: { ...globals.node, ...globals.browser, seen: "readonly" } },
    rules: {
      ...strict,
      "complexity": "off",
      "curly": "off",
      "no-use-before-define": "off",
      "max-depth": "off",
      "max-params": "off",
      "no-shadow": "off",
      "no-implicit-globals": "off",
      ...Object.fromEntries(["cognitive-complexity", "no-nested-template-literals", "no-nested-assignment", "no-nested-functions", "no-nested-conditional", "no-alphabetical-sort", "regex-complexity", "slow-regex", "super-linear-regex", "no-os-command-from-path", "os-command", "publicly-writable-directories", "no-clear-text-protocols", "assertions-in-tests", "updated-loop-counter"].map(rule => [`sonarjs/${rule}`, "off"]))
    }
  }
];
