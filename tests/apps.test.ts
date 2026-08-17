import { afterEach, describe, expect, it, vi } from "vitest";
import { darkenHex, normalizeHex, softHex } from "@/lib/color";
import { defaultApiBaseUrl, getAdminApp, slugifyAppId } from "@/lib/apps";

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

describe("admin app config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to Coinzy when brand env vars are unset", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_NAME", "");
    vi.stubEnv("NEXT_PUBLIC_APP_ICON", "");
    vi.stubEnv("NEXT_PUBLIC_APP_COLOR", "");
    vi.stubEnv("NEXT_PUBLIC_APP_ID", "");
    vi.stubEnv("NEXT_PUBLIC_APP_MODELS", "");
    vi.stubEnv("NEXT_PUBLIC_APP_SIDEBAR", "");

    const app = getAdminApp();
    expect(app.id).toBe("coinzy");
    expect(app.name).toBe("Coinzy");
    expect(app.icon).toBe("C");
    expect(app.apiBaseUrl).toBe(defaultApiBaseUrl().replace(/\/$/, ""));
    expect(app.apiBaseUrl.endsWith("/")).toBe(false);
  });

  it("reads name, icon, color, and API URL from env for another product", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_NAME", "Banknote");
    vi.stubEnv("NEXT_PUBLIC_APP_ICON", "B");
    vi.stubEnv("NEXT_PUBLIC_APP_COLOR", "#1d4ed8");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://banknote-experts-api.example.com/");
    vi.stubEnv("NEXT_PUBLIC_APP_MODELS", "Banknote evaluation, Grading");

    const app = getAdminApp();
    expect(app.id).toBe("banknote");
    expect(app.name).toBe("Banknote");
    expect(app.icon).toBe("B");
    expect(app.primary).toBe("#1d4ed8");
    expect(app.apiBaseUrl).toBe("https://banknote-experts-api.example.com");
    expect(app.models).toEqual(["Banknote evaluation", "Grading"]);
  });

  it("uses NEXT_PUBLIC_APP_ID when the branch name should not become the id", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_NAME", "Banknote");
    vi.stubEnv("NEXT_PUBLIC_APP_ID", "notes-prod");
    expect(getAdminApp().id).toBe("notes-prod");
  });

  it("slugifies names for ids", () => {
    expect(slugifyAppId("Bank Note AI")).toBe("bank-note-ai");
  });
});
