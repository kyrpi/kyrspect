import type { DrmOptions } from "../types/drm";
import type { KyrspectOptions } from "../types/options";
import type { ResolvedSource } from "../types/source";
import { KyrspectError } from "../errors/KyrspectError";
import { applyLicenseRequestHook, hasConfiguredDrm, resolveDrmOptions } from "./resolve";
import { FairPlayDrmProvider } from "./providers/FairPlayDrmProvider";
import { PlayReadyDrmProvider } from "./providers/PlayReadyDrmProvider";
import { WidevineDrmProvider } from "./providers/WidevineDrmProvider";
import type { DashDrmHost, DrmPlaybackTarget, DrmProvider, HlsDrmEngineConfig } from "./providers/types";

export interface DrmSession {
  options: DrmOptions;
  providers: DrmProvider[];
}

export class DrmManager {
  private nativeDetach: (() => void) | null = null;
  private providersInternal: DrmProvider[] | null;

  constructor(providers?: DrmProvider[]) {
    this.providersInternal = providers ?? null;
  }

  private get providers(): DrmProvider[] {
    this.providersInternal ??= [
      new WidevineDrmProvider(),
      new PlayReadyDrmProvider(),
      new FairPlayDrmProvider(),
    ];
    return this.providersInternal;
  }

  resolve(source: ResolvedSource, options: KyrspectOptions): DrmSession | null {
    const drm = resolveDrmOptions(source, options);
    if (!drm || !hasConfiguredDrm(drm)) return null;
    const configured = this.providers.filter((provider) => provider.canHandle(drm));
    if (drm.preferred) {
      const preferred = configured.find((provider) => provider.id === drm.preferred);
      if (preferred) return { options: drm, providers: [preferred, ...configured.filter((item) => item !== preferred)] };
    }
    return { options: drm, providers: configured };
  }

  compatible(session: DrmSession | null, target: DrmPlaybackTarget): DrmProvider[] {
    return session?.providers.filter((provider) => provider.supports(target)) ?? [];
  }

  active(session: DrmSession | null, target: DrmPlaybackTarget): DrmProvider | null {
    return this.compatible(session, target)[0] ?? null;
  }

  hlsEngineHint(session: DrmSession | null): "mse" | "native" | null {
    if (!session) return null;
    if (session.providers.some((provider) => provider.requiresMse())) return "mse";
    if (this.compatible(session, "native-hls").length) return "native";
    if (this.compatible(session, "hls.js").length) return "mse";
    return null;
  }

  assertCompatible(session: DrmSession | null, target: DrmPlaybackTarget): DrmProvider[] {
    if (!session) return [];
    const providers = this.compatible(session, target);
    if (providers.length) return providers;
    const names = session.providers.map((provider) => provider.id).join(", ");
    throw new KyrspectError({
      code: "drm-unsupported-target",
      category: "DRM_ERROR",
      message: `${names || "Configured DRM"} cannot play through ${target}.`,
    });
  }

  applyToDash(player: DashDrmHost, session: DrmSession | null): void {
    const providers = this.assertCompatible(session, "dash.js");
    if (!session || !providers.length) return;

    const protection = Object.assign({}, ...providers.map((provider) => provider.toDashProtectionData(session.options)));
    if (typeof player.setProtectionData === "function") {
      player.setProtectionData(protection);
    }

    const headers = this.mergedHeaders(session, providers);
    if ((session.options.beforeLicenseRequest || Object.keys(headers).length) && typeof player.registerLicenseRequestFilter === "function") {
      player.registerLicenseRequestFilter(async (request) => {
        await applyLicenseRequestHook(request, session.options, headers);
        return request;
      });
    }
  }

  hlsConfig(session: DrmSession | null): HlsDrmEngineConfig | null {
    const providers = this.compatible(session, "hls.js");
    if (!session || !providers.length) return null;

    const merged: HlsDrmEngineConfig = {
      emeEnabled: true,
      drmSystems: {},
      drmSystemOptions: {},
    };
    for (const provider of providers) {
      const next = provider.toHlsConfig(session.options);
      if (next.widevineLicenseUrl) merged.widevineLicenseUrl = next.widevineLicenseUrl;
      Object.assign(merged.drmSystems, next.drmSystems);
      Object.assign(merged.drmSystemOptions, next.drmSystemOptions);
    }
    return merged;
  }

  licenseXhrSetup(session: DrmSession | null) {
    const providers = this.compatible(session, "hls.js");
    if (!session || !providers.length) return undefined;
    const headers = this.mergedHeaders(session, providers);
    return async (xhr: XMLHttpRequest, url: string, _keyContext?: unknown, challenge?: Uint8Array) => {
      const request = { url, headers: { ...headers }, data: challenge };
      await applyLicenseRequestHook(request, session.options, headers);
      for (const [key, value] of Object.entries(request.headers)) {
        xhr.setRequestHeader(key, value);
      }
    };
  }

  attachNative(video: HTMLVideoElement, session: DrmSession | null): void {
    this.detachNative();
    const provider = this.active(session, "native-hls");
    if (!session || !provider) return;
    if (provider instanceof FairPlayDrmProvider) {
      this.nativeDetach = provider.attachNative(video, session.options);
    }
  }

  detachNative(): void {
    this.nativeDetach?.();
    this.nativeDetach = null;
  }

  destroy(): void {
    this.detachNative();
  }

  private mergedHeaders(session: DrmSession, providers: DrmProvider[]): Record<string, string> {
    return Object.assign({}, ...providers.map((provider) => provider.licenseHeaders(session.options)));
  }
}

export function createDrmManager(): DrmManager {
  return new DrmManager();
}
