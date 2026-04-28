import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Environment variable contract", () => {
  it("client/.env.example contains all required VITE_ variables", () => {
    const envExamplePath = resolve(__dirname, "../../.env.example");
    const content = readFileSync(envExamplePath, "utf-8");

    const requiredVars = [
      "VITE_AWS_REGION",
      "VITE_AWS_COGNITO_USER_POOL_ID",
      "VITE_AWS_COGNITO_CLIENT_ID",
      "VITE_WEBHOOK_URL",
    ];

    for (const varName of requiredVars) {
      expect(content, `Missing required variable: ${varName}`).toContain(varName);
    }
  });
});
