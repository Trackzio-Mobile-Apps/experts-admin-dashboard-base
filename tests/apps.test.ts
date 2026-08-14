import { describe, expect, it } from "vitest";
import { darkenHex, normalizeHex, softHex } from "@/lib/color";
import {
  defaultCoinzyApp,
  mergeApps,
  normalizeApp,
  parseEnvApps,
  slugifyAppId,
} from "@/lib/apps";

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

describe("apps", () => {
  it("falls back to Coinzy when env JSON is missing", () => {
    const apps = parseEnvApps("");
    expect(apps).toHaveLength(1);
    expect(apps[0].id).toBe("coinzy");
    expect(apps[0].name).toBe("Coinzy");
  });

  it("parses multiple env apps with icons, colors, and models", () => {
    const apps = parseEnvApps(
      JSON.stringify([
        {
          id: "coinzy",
          name: "Coinzy",
          icon: "C",
          primary: "#7c3c3f",
          apiBaseUrl: "https://coinzy.example",
          models: ["Coin evaluation"],
        },
        {
          id: "banknote",
          name: "Banknote",
          icon: "B",
          primary: "#1d4ed8",
          apiBaseUrl: "https://banknote.example",
          models: "Banknote evaluation, Grading",
        },
      ]),
    );
    expect(apps.map((app) => app.id)).toEqual(["coinzy", "banknote"]);
    expect(apps[1].models).toEqual(["Banknote evaluation", "Grading"]);
    expect(apps[1].icon).toBe("B");
    expect(apps[1].primary).toBe("#1d4ed8");
  });

  it("merges local apps without duplicating env ids", () => {
    const env = [defaultCoinzyApp()];
    const local = [
      normalizeApp(
        {
          id: "coinzy",
          name: "Override",
          icon: "X",
          primary: "#000000",
          apiBaseUrl: "https://ignored.example",
        },
        "local",
      )!,
      normalizeApp(
        {
          name: "Banknote",
          icon: "B",
          primary: "#1d4ed8",
          apiBaseUrl: "https://banknote.example",
          models: ["Banknote evaluation"],
        },
        "local",
      )!,
    ];
    const merged = mergeApps(env, local);
    expect(merged).toHaveLength(2);
    expect(merged[0].name).toBe("Coinzy");
    expect(merged[1].id).toBe("banknote");
  });

  it("slugifies names for new app ids", () => {
    expect(slugifyAppId("Bank Note AI")).toBe("bank-note-ai");
  });
});
