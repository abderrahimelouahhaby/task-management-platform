import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "./schemas";

describe("signUpSchema", () => {
  it("accepts valid data and normalizes the email", () => {
    const result = signUpSchema.parse({
      name: "  Salma Demo ",
      email: "  SALMA@Mail.com ",
      password: "a-long-password",
    });

    expect(result.name).toBe("Salma Demo");
    expect(result.email).toBe("salma@mail.com");
  });

  it("rejects an invalid email", () => {
    const result = signUpSchema.safeParse({
      name: "Salma",
      email: "not-an-email",
      password: "a-long-password",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a short password", () => {
    const result = signUpSchema.safeParse({
      name: "Salma",
      email: "salma@mail.com",
      password: "short",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a too-long password", () => {
    const result = signUpSchema.safeParse({
      name: "Salma",
      email: "salma@mail.com",
      password: "x".repeat(129),
    });

    expect(result.success).toBe(false);
  });

  it("rejects a name that is too short", () => {
    const result = signUpSchema.safeParse({
      name: "S",
      email: "salma@mail.com",
      password: "a-long-password",
    });

    expect(result.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("accepts an email and a password", () => {
    const result = signInSchema.safeParse({ email: "salma@mail.com", password: "x" });

    expect(result.success).toBe(true);
  });

  it("rejects an empty password", () => {
    const result = signInSchema.safeParse({ email: "salma@mail.com", password: "" });

    expect(result.success).toBe(false);
  });
});
