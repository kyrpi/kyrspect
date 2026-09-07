import type { CencDrmOptions, DrmLicenseRequest, DrmOptions, FairPlayOptions } from "../types/drm";
import type { KyrspectOptions } from "../types/options";
import type { ResolvedSource } from "../types/source";

export function getSourceDrm(source: ResolvedSource): DrmOptions | undefined {
  return "drm" in source ? source.drm : undefined;
}

export function resolveDrmOptions(source: ResolvedSource, options: KyrspectOptions): DrmOptions | undefined {
  const fromSource = getSourceDrm(source);
  const fromOptions = options.drm;
  if (!fromSource && !fromOptions) return undefined;

  const merged: DrmOptions = {
    ...fromOptions,
    ...fromSource,
    preferred: fromSource?.preferred ?? fromOptions?.preferred,
    widevine: mergeCenc(fromOptions?.widevine, fromSource?.widevine),
    playready: mergeCenc(fromOptions?.playready, fromSource?.playready),
    fairplay: mergeFairPlay(fromOptions?.fairplay, fromSource?.fairplay),
    beforeLicenseRequest: fromSource?.beforeLicenseRequest ?? fromOptions?.beforeLicenseRequest,
  };
  return hasConfiguredDrm(merged) ? merged : undefined;
}

export function needsDrmManager(source?: unknown, options?: { drm?: DrmOptions }): boolean {
  if (hasConfiguredDrm(options?.drm)) return true;
  if (source && typeof source === "object" && "drm" in source) {
    return hasConfiguredDrm((source as { drm?: DrmOptions }).drm);
  }
  return false;
}

export function hasWidevine(drm?: DrmOptions): boolean {
  return Boolean(drm?.widevine?.licenseUrl);
}

export function hasPlayReady(drm?: DrmOptions): boolean {
  return Boolean(drm?.playready?.licenseUrl);
}

export function hasFairPlay(drm?: DrmOptions): boolean {
  return Boolean(drm?.fairplay?.licenseUrl && drm.fairplay.certificateUrl);
}

export function hasConfiguredDrm(drm?: DrmOptions): boolean {
  return hasWidevine(drm) || hasPlayReady(drm) || hasFairPlay(drm);
}

export async function applyLicenseRequestHook(
  request: { url?: string; headers?: Record<string, string>; data?: ArrayBuffer | Uint8Array | string },
  drm: DrmOptions,
  systemHeaders?: Record<string, string>,
): Promise<void> {
  const headers = { ...systemHeaders, ...request.headers };
  const next: DrmLicenseRequest = {
    url: request.url ?? "",
    headers,
    body: request.data,
  };
  await drm.beforeLicenseRequest?.(next);
  request.url = next.url;
  request.headers = next.headers;
  if (next.body !== undefined) request.data = next.body;
}

function mergeCenc(base?: CencDrmOptions, override?: CencDrmOptions): CencDrmOptions | undefined {
  if (!base && !override) return undefined;
  if (!override) return base;
  if (!base) return override;
  return {
    ...base,
    ...override,
    headers: { ...base.headers, ...override.headers },
  };
}

function mergeFairPlay(base?: FairPlayOptions, override?: FairPlayOptions): FairPlayOptions | undefined {
  if (!base && !override) return undefined;
  if (!override) return base;
  if (!base) return override;
  return {
    ...base,
    ...override,
    headers: { ...base.headers, ...override.headers },
  };
}
