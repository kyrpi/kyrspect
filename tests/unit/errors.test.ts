import { KyrspectError, normalizeError } from "@kyrspect/core";

describe("error normalization", () => {
  it("passes KyrspectError through", () => {
    const error = new KyrspectError({
      code: "network",
      category: "NETWORK_ERROR",
      message: "offline",
      fatal: true,
      recoverable: true,
    });
    expect(normalizeError(error)).toBe(error);
    expect(error.toJSON()).toMatchObject({ category: "NETWORK_ERROR", code: "network" });
  });

  it("maps HTMLMediaElement MediaError codes", () => {
    const mediaError = { code: 4, message: "src not supported" } as MediaError;
    const error = normalizeError(mediaError);
    expect(error.category).toBe("UNSUPPORTED_FORMAT");
    expect(error.fatal).toBe(true);
  });

  it("detects CORS language in generic errors", () => {
    const error = normalizeError(new Error("CORS blocked the media request"));
    expect(error.category).toBe("CORS_ERROR");
  });
});
