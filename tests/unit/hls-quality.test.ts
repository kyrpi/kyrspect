import { mapLevelFixture } from "./hls-helpers";

describe("HLS quality extraction", () => {
  it("maps master playlist levels into Kyrspect qualities", () => {
    const qualities = [
      mapLevelFixture({ width: 640, height: 360, bitrate: 800000, index: 0 }),
      mapLevelFixture({ width: 1920, height: 1080, bitrate: 5000000, index: 2 }),
    ];
    expect(qualities[1]?.name).toBe("1080p");
    expect(qualities[0]?.id).toBe(0);
  });
});
