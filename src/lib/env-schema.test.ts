import { describe, expect, it } from "vitest";
import { parseEnv } from "./env-schema";

describe("parseEnv", () => {
  it("accepts a valid PostgreSQL URL", () => {
    const env = parseEnv({
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/mohima",
    });

    expect(env.DATABASE_URL).toContain("postgresql://");
  });

  it("uses development as the default NODE_ENV", () => {
    const env = parseEnv({
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/mohima",
    });

    expect(env.NODE_ENV).toBe("development");
  });

  it("throws when DATABASE_URL is missing", () => {
    expect(() => parseEnv({})).toThrow("Invalid environment variables");
  });

  it("throws when DATABASE_URL is not a PostgreSQL URL", () => {
    expect(() => parseEnv({ DATABASE_URL: "mysql://localhost/test" })).toThrow(
      "DATABASE_URL must be a PostgreSQL connection string",
    );
  });
});
