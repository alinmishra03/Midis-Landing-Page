import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      /*
       * Allow a leading underscore to mark a binding that exists only to be
       * discarded. The polymorphic Button destructures its own props out of
       * the object before spreading the remainder onto the DOM element —
       * without that, `variant` and `size` would be forwarded to an <a> and
       * React would warn about unknown attributes. The names are the
       * conventional signal for "deliberately unused", so the rule is
       * taught to recognise them rather than each site being suppressed.
       */
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
