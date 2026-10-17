import { describe, expect, it } from "vitest";
import { parseEnv } from "./env-schema";

const validEnv = {
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/mohima",
  BETTER_AUTH_SECRET: "a-test-secret-that-is-at-least-32-chars",
  BETTER_AUTH_URL: "http://localhost:3000",
};

describe("parseEnv", () => {
  it("accepts valid values", () => {
    const env = parseEnv(validEnv);

    expect(env.DATABASE_URL).toContain("postgresql://");
    expect(env.BETTER_AUTH_URL).toBe("http://localhost:3000");
  });

  it("uses development as the default NODE_ENV", () => {
    expect(parseEnv(validEnv).NODE_ENV).toBe("development");
  });

  it("throws when DATABASE_URL is missing", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { DATABASE_URL: _removed, ...withoutDatabase } = validEnv;

    expect(() => parseEnv(withoutDatabase)).toThrow("Invalid environment variables");
  });

  it("throws when DATABASE_URL is not a PostgreSQL URL", () => {
    expect(() => parseEnv({ ...validEnv, DATABASE_URL: "mysql://localhost/test" })).toThrow(
      "DATABASE_URL must be a PostgreSQL connection string",
    );
  });

  it("throws when the auth secret is too short", () => {
    expect(() => parseEnv({ ...validEnv, BETTER_AUTH_SECRET: "too-short" })).toThrow(
      "BETTER_AUTH_SECRET must be at least 32 characters",
    );
  });

  it("throws when BETTER_AUTH_URL is not a URL", () => {
    expect(() => parseEnv({ ...validEnv, BETTER_AUTH_URL: "not-a-url" })).toThrow(
      "BETTER_AUTH_URL must be a valid URL",
    );
  });
});
