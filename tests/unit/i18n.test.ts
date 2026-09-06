import {
  Kyrspect,
  KyrspectError,
  LOCALES,
  SUPPORTED_LOCALES,
  resolveLabels,
  resolveLocale,
  userFacingErrorMessage,
} from "@kyrspect/core";
import { DEFAULT_LABELS } from "@kyrspect/ui";

describe("i18n", () => {
  it("maps regional tags onto built-in locale files", () => {
    expect(resolveLocale("tr-TR")).toBe("tr");
    expect(resolveLocale("es_MX")).toBe("es");
    expect(resolveLocale("pt-BR")).toBe("pt");
    expect(resolveLocale("de")).toBe("de");
    expect(resolveLocale("xx-YY")).toBe("en");
  });

  it("ships a complete pack for every supported locale", () => {
    const keys = Object.keys(DEFAULT_LABELS).sort();
    expect(SUPPORTED_LOCALES.length).toBeGreaterThanOrEqual(3);
    for (const locale of SUPPORTED_LOCALES) {
      expect(Object.keys(LOCALES[locale]).sort()).toEqual(keys);
    }
  });

  it("resolves Turkish and Spanish player strings", () => {
    expect(resolveLabels("tr").settings).toBe("Ayarlar");
    expect(resolveLabels("es").playbackRate).toBe("Velocidad de reproducción");
    expect(resolveLabels("tr", { settings: "Seçenekler" }).settings).toBe("Seçenekler");
  });

  it("applies the language option when the player loads", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const player = new Kyrspect(root, { controls: true, language: "tr" });

    expect(player.language).toBe("tr");
    expect(root.getAttribute("lang")).toBe("tr");
    expect(root.getAttribute("aria-label")).toBe("Video oynatıcı");
    expect(root.querySelector('[data-control="settings"]')?.getAttribute("aria-label")).toBe("Ayarlar");
    expect(root.querySelector('[data-control="fullscreen"]')?.getAttribute("aria-label")).toBe("Tam ekran");

    player.setLanguage("es");
    expect(player.language).toBe("es");
    expect(root.getAttribute("lang")).toBe("es");
    expect(root.querySelector('[data-control="settings"]')?.getAttribute("aria-label")).toBe("Ajustes");

    player.destroy();
    root.remove();
  });

  it("translates user-facing playback errors", () => {
    const error = new KyrspectError({
      code: "media-src-not-supported",
      category: "UNSUPPORTED_FORMAT",
      message: "This media format is not supported.",
    });
    expect(userFacingErrorMessage(error, resolveLabels("tr"))).toBe("Bu video biçimi desteklenmiyor.");
    expect(userFacingErrorMessage(error, resolveLabels("es"))).toBe("Este formato de vídeo no es compatible.");
  });
});
