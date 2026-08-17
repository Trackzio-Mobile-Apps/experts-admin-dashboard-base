import { describe, expect, it } from "vitest";
import { darkenHex, normalizeHex, softHex } from "@/lib/color";
import { defaultApiBaseUrl, getCoinzyApp } from "@/lib/apps";

describe("color helpers", () => {
  it("normalizes 3 and 6 digit hex", () => {
    expect(normalizeHex("#7c3")).toBe("#77cc33");
    expect(normalizeHex("7c3c3f")).toBe("#7c3c3f");
    expect(normalizeHex("nope")).toBe("#7c3c3f");
  });

  it("darkens and softens a brand color", () => {
    expect(darkenHex("#7c3c3f", 0.12)).toMatch(/^#[0-9a-f]{6}$/);
    expect(softHex("#7c3c3f")).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("Coinzy app config", () => {
  it("returns a single Coinzy app with a trailing-slash-free API URL", () => {
    const app = getCoinzyApp();
    expect(app.id).toBe("coinzy");
    expect(app.name).toBe("Coinzy");
    expect(app.apiBaseUrl).toBe(defaultApiBaseUrl().replace(/\/$/, ""));
    expect(app.apiBaseUrl.endsWith("/")).toBe(false);
  });
});
