// CSS rules. The formatting is deliberately compact, so only correctness and consistency are checked here.
export default {
  extends: ["stylelint-config-recommended"],
  reportDescriptionlessDisables: true,
  reportNeedlessDisables: true,
  rules: {
    "no-descending-specificity": null,
    "color-named": ["never", { ignore: ["inside-function"], message: "Use a token or a hex colour." }],
    "color-no-invalid-hex": true,
    "color-hex-length": null,
    "declaration-block-no-redundant-longhand-properties": null,
    "declaration-no-important": true,
    "function-url-no-scheme-relative": true,
    "function-url-scheme-disallowed-list": [["http", "https", "data"], { message: "The page loads nothing from elsewhere." }],
    "keyframes-name-pattern": "^[a-z][a-z0-9-]*$",
    "length-zero-no-unit": true,
    "media-feature-name-no-vendor-prefix": true,
    "no-duplicate-selectors": true,
    "no-unknown-animations": true,
    "property-no-unknown": true,
    "selector-class-pattern": "^[a-z][a-z0-9-]*$",
    "selector-max-id": 1,
    "selector-max-universal": 2,
    "selector-pseudo-class-no-unknown": true,
    "shorthand-property-no-redundant-values": true,
    "unit-allowed-list": ["px", "rem", "em", "%", "vw", "vh", "svh", "cqw", "fr", "s", "ms", "deg", "ch"],
    "declaration-property-value-disallowed-list": [
      { "/^outline/": ["none", "0"], "user-select": ["none"], "/^transition/": ["/\\ball\\b/"], "text-align": ["justify"] },
      { message: "Not allowed here: hidden focus rings, 'transition: all', justified text." }
    ],
    "declaration-property-unit-disallowed-list": [
      { "font-size": ["px"], "letter-spacing": ["px"] }, { message: "Text sizes follow the reader's setting: use rem or em.", severity: "warning" }
    ]
  }
};
