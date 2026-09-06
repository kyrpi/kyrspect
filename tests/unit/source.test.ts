import {
  isHlsMime,
  isProbablyHlsUrl,
  normalizeSource,
  resolveSourceSync,
} from "@kyrspect/core";

describe("source detection", () => {
  it("normalizes a string URL to an auto source", () => {
    expect(normalizeSource("https://cdn.example/video.mp4")).toEqual({
      type: "auto",
      src: "https://cdn.example/video.mp4",
    });
  });

  it("detects HLS from MIME type rather than guessing blindly", () => {
    expect(isHlsMime("application/vnd.apple.mpegurl")).toBe(true);
    expect(isHlsMime("video/mp4")).toBe(false);
    const resolved = resolveSourceSync({
      src: "https://cdn.example/asset",
      mimeType: "application/vnd.apple.mpegurl",
    });
    expect(resolved.type).toBe("hls");
  });

  it("uses playlist URL only as a last hint", () => {
    expect(isProbablyHlsUrl("https://cdn.example/live/master.m3u8")).toBe(true);
    expect(isProbablyHlsUrl("https://cdn.example/video.mp4")).toBe(false);
    const resolved = resolveSourceSync("https://cdn.example/live/master.m3u8?token=1");
    expect(resolved.type).toBe("hls");
  });

  it("keeps explicit progressive sources", () => {
    const resolved = resolveSourceSync({
      type: "video",
      src: "https://cdn.example/clip.bin",
      mimeType: "video/webm",
    });
    expect(resolved).toMatchObject({ type: "video", mimeType: "video/webm" });
  });

  it("wraps MediaStream sources", () => {
    const stream = new MediaStream();
    expect(normalizeSource(stream)).toEqual({ type: "media-stream", stream });
    expect(resolveSourceSync(stream).type).toBe("media-stream");
  });

  it("wraps Blob sources with mimeType", () => {
    const blob = new Blob(["x"], { type: "video/mp4" });
    const source = normalizeSource(blob);
    expect(source).toMatchObject({ type: "blob", mimeType: "video/mp4" });
  });
});
