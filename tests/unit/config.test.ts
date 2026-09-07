import { DEFAULT_OPTIONS } from "@kyrspect/core";
import { deepMerge } from "../../packages/core/src/utils/misc";

describe("config merging", () => {
  it("keeps defaults when overrides are empty", () => {
    const merged = deepMerge(
      DEFAULT_OPTIONS as unknown as Record<string, unknown>,
      {},
    ) as typeof DEFAULT_OPTIONS;
    expect(merged.volume).toBe(1);
    expect(merged.quality).toBe("auto");
    expect(merged.hls.preferNative).toBe(false);
    expect(merged.dash.capLevelToPlayerSize).toBe(true);
    expect(merged.dash.startLevel).toBe("auto");
  });

  it("deep-merges nested live and retry options", () => {
    const merged = deepMerge(DEFAULT_OPTIONS as unknown as Record<string, unknown>, {
      live: { lowLatency: true },
      retry: { maxAttempts: 2 },
      debug: true,
    }) as typeof DEFAULT_OPTIONS & { debug: boolean };
    expect(merged.live.lowLatency).toBe(true);
    expect(merged.live.targetLatency).toBe(3);
    expect(merged.retry.maxAttempts).toBe(2);
    expect(merged.retry.baseDelay).toBe(500);
    expect(merged.debug).toBe(true);
  });
});
