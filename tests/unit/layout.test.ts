import { parseAspectRatio, resolveFrameSize, shouldFillHost } from "../../packages/ui/src/layout";

describe("player frame helpers", () => {
  it("parses ratio strings and numbers", () => {
    expect(parseAspectRatio("9:16")).toEqual({ width: 9, height: 16 });
    expect(parseAspectRatio("4/3")).toEqual({ width: 4, height: 3 });
    expect(parseAspectRatio("1.777")).toEqual({ width: 1.777, height: 1 });
    expect(parseAspectRatio("auto")).toBeNull();
  });

  it("falls back to 16:9 in cinema mode and 9:16 in reels mode", () => {
    const empty = { videoWidth: 0, videoHeight: 0 };
    expect(resolveFrameSize("auto", empty, "standard")).toEqual({ width: 16, height: 9 });
    expect(resolveFrameSize("auto", empty, "reels")).toEqual({ width: 9, height: 16 });
    expect(resolveFrameSize("auto", { videoWidth: 1080, videoHeight: 1920 }, "standard")).toEqual({
      width: 1080,
      height: 1920,
    });
  });

  it("fills a tall reels host by default", () => {
    const root = document.createElement("div");
    const host = document.createElement("div");
    Object.defineProperty(host, "clientWidth", { value: 360 });
    Object.defineProperty(host, "clientHeight", { value: 720 });
    host.append(root);
    document.body.append(host);

    expect(shouldFillHost("reels", undefined, root)).toBe(true);
    expect(shouldFillHost("standard", undefined, root)).toBe(false);
    expect(shouldFillHost("reels", false, root)).toBe(false);

    host.remove();
  });
});
