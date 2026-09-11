type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  webkitRequestFullScreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenEnabled?: boolean;
};

export class FullscreenManager {
  private readonly onChange: () => void;
  private readonly doc: FullscreenDocument | null;

  constructor(
    private readonly target: HTMLElement,
    onChange: (active: boolean) => void,
  ) {
    this.doc = typeof document !== "undefined" ? (document as FullscreenDocument) : null;
    this.onChange = () => onChange(this.active);
    this.doc?.addEventListener("fullscreenchange", this.onChange);
    this.doc?.addEventListener("webkitfullscreenchange", this.onChange);
  }

  get available(): boolean {
    if (!this.doc) return false;
    return Boolean(this.doc.fullscreenEnabled || this.doc.webkitFullscreenEnabled);
  }

  get active(): boolean {
    if (!this.doc) return false;
    const current = this.doc.fullscreenElement || this.doc.webkitFullscreenElement || null;
    return current === this.target || (current != null && this.target.contains(current));
  }

  async enter(): Promise<void> {
    if (!this.available || this.active) return;
    const el = this.target as FullscreenElement;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen({ navigationUI: "hide" } as FullscreenOptions);
        return;
      }
      await el.webkitRequestFullscreen?.();
      await el.webkitRequestFullScreen?.();
    } catch {
      // Fallback or permission rejection handled gracefully
    }
  }

  async exit(): Promise<void> {
    if (!this.active || !this.doc) return;
    try {
      if (this.doc.exitFullscreen) {
        await this.doc.exitFullscreen();
        return;
      }
      await this.doc.webkitExitFullscreen?.();
    } catch {
      // Fallback
    }
  }

  async toggle(): Promise<void> {
    if (this.active) await this.exit();
    else await this.enter();
  }

  destroy(): void {
    this.doc?.removeEventListener("fullscreenchange", this.onChange);
    this.doc?.removeEventListener("webkitfullscreenchange", this.onChange);
  }
}
