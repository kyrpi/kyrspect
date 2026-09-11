import type { DrmOptions } from "../../types/drm";
import { FAIRPLAY_KEY_SYSTEM } from "../../types/drm";
import { KyrspectError } from "../../errors/KyrspectError";
import { applyLicenseRequestHook, hasFairPlay } from "../resolve";
import type { DrmPlaybackTarget, DrmProvider, HlsDrmEngineConfig } from "./types";

export class FairPlayDrmProvider implements DrmProvider {
  readonly id = "fairplay" as const;
  readonly keySystem = FAIRPLAY_KEY_SYSTEM;

  canHandle(drm: DrmOptions): boolean {
    return hasFairPlay(drm);
  }

  supports(target: DrmPlaybackTarget): boolean {
    return target === "hls.js" || target === "native-hls";
  }

  requiresMse(): boolean {
    return false;
  }

  licenseHeaders(drm: DrmOptions): Record<string, string> {
    return { ...drm.fairplay?.headers };
  }

  toDashProtectionData(): Record<string, unknown> {
    return {};
  }

  toHlsConfig(drm: DrmOptions): Partial<HlsDrmEngineConfig> {
    if (!drm.fairplay) return {};
    return {
      emeEnabled: true,
      drmSystems: {
        [this.keySystem]: {
          licenseUrl: drm.fairplay.licenseUrl,
          serverCertificateUrl: drm.fairplay.certificateUrl,
        },
      },
      drmSystemOptions: {},
    };
  }

  attachNative(video: HTMLVideoElement, drm: DrmOptions): () => void {
    if (!drm.fairplay) {
      throw new KyrspectError({
        code: "fairplay-missing",
        category: "DRM_ERROR",
        message: "FairPlay requires licenseUrl and certificateUrl.",
      });
    }

    let activeSession: MediaKeySession | null = null;
    let activeMediaKeys: MediaKeys | null = null;

    const onEncrypted = (event: Event) => {
      void (async () => {
        try {
          const fairplay = drm.fairplay;
          if (!fairplay || !(event as MediaEncryptedEvent).initData) return;

          const access = await navigator.requestMediaKeySystemAccess(this.keySystem, [
            {
              initDataTypes: [(event as MediaEncryptedEvent).initDataType || "sinf"],
              videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
            },
          ]);
          const keys = await access.createMediaKeys();
          activeMediaKeys = keys;

          let certRes: Response;
          try {
            certRes = await fetch(fairplay.certificateUrl);
          } catch (fetchErr) {
            throw new KyrspectError({
              code: "fairplay-cert-network",
              category: "DRM_ERROR",
              message: "Failed to fetch FairPlay application certificate.",
              originalError: fetchErr,
            });
          }

          if (!certRes.ok) {
            throw new KyrspectError({
              code: "fairplay-cert-http",
              category: "DRM_ERROR",
              message: `FairPlay certificate request returned status ${certRes.status}.`,
            });
          }

          const certificate = await certRes.arrayBuffer();
          await keys.setServerCertificate(certificate);
          await video.setMediaKeys(keys);

          const session = keys.createSession();
          activeSession = session;
          const contentId = fairplay.contentId ?? fairplay.extractContentId?.((event as MediaEncryptedEvent).initData!) ?? extractFairPlayContentId((event as MediaEncryptedEvent).initData!);
          session.addEventListener("message", (messageEvent) => {
            void this.requestLicense(session, (messageEvent as MediaKeyMessageEvent).message, drm, contentId);
          });
          await session.generateRequest((event as MediaEncryptedEvent).initDataType || "sinf", (event as MediaEncryptedEvent).initData!);
        } catch (error) {
          // Propagate or log DRM initialization failure
          if (error instanceof KyrspectError) throw error;
        }
      })();
    };

    video.addEventListener("encrypted", onEncrypted);
    return () => {
      video.removeEventListener("encrypted", onEncrypted);
      if (activeSession) {
        try {
          void activeSession.close();
        } catch {
          // Ignored
        }
        activeSession = null;
      }
      if (activeMediaKeys) {
        try {
          void video.setMediaKeys(null);
        } catch {
          // Ignored
        }
        activeMediaKeys = null;
      }
    };
  }

  private async requestLicense(
    session: MediaKeySession,
    challenge: BufferSource,
    drm: DrmOptions,
    contentId: string,
  ): Promise<void> {
    const fairplay = drm.fairplay;
    if (!fairplay) return;
    const body = challenge instanceof ArrayBuffer ? challenge : challenge.buffer.slice(challenge.byteOffset, challenge.byteOffset + challenge.byteLength);
    const request = {
      url: fairplay.licenseUrl,
      headers: { ...fairplay.headers, "Content-Type": "application/octet-stream", "X-FairPlay-Content-Id": contentId },
      data: body as ArrayBuffer,
    };
    await applyLicenseRequestHook(request, drm, fairplay.headers);
    const response = await fetch(request.url, {
      method: "POST",
      headers: request.headers,
      body: request.data,
    });
    if (!response.ok) {
      throw new KyrspectError({
        code: "fairplay-license",
        category: "DRM_ERROR",
        message: `FairPlay license request failed (${response.status}).`,
      });
    }
    await session.update(await response.arrayBuffer());
  }
}

export function extractFairPlayContentId(initData: ArrayBuffer): string {
  const bytes = new Uint8Array(initData);
  const utf8 = new TextDecoder().decode(bytes);
  const utf16 = decodeUtf16(bytes);
  const text = `${utf8}\n${utf16}`;
  const match = text.match(/skd:\/\/([^?\s\u0000]+)/i);
  return match?.[1] ?? utf8.replace(/\u0000/g, "").trim();
}

function decodeUtf16(bytes: Uint8Array): string {
  if (bytes.length < 2) return "";
  const units = new Uint16Array(Math.floor(bytes.length / 2));
  for (let i = 0; i < units.length; i += 1) {
    units[i] = ((bytes[i * 2] ?? 0) << 8) | (bytes[i * 2 + 1] ?? 0);
  }
  return String.fromCharCode(...units);
}
