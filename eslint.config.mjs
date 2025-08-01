import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Allow require() imports in telemetry/metrics files for Node.js compatibility
      "@typescript-eslint/no-require-imports": "off",
      // Allow unused variables in catch blocks (intentionally empty error handlers)
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_|error"
        }
      ]
    }
  },
  {
    files: ["src/lib/logger.ts", "src/lib/metrics-collector.ts", "src/lib/system-metrics.ts", "instrumentation.ts"],
    rules: {
      // Telemetry files need require() for conditional Node.js imports
      "@typescript-eslint/no-require-imports": "off",
      // Allow any type for OpenTelemetry dynamic imports
      "@typescript-eslint/no-explicit-any": "off",
      // Allow unused imports (NextRequest) in API routes
      "@typescript-eslint/no-unused-vars": "off"
    }
  },
  {
    files: ["src/app/api/**/*.ts"],
    rules: {
      // API routes often have unused parameters
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_|request|error",
          "varsIgnorePattern": "^_|error"
        }
      ]
    }
  }
];

export default eslintConfig;
