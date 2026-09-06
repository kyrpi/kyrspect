export class PiPManager {
  private readonly onChange: () => void;

  constructor(
    private readonly video: HTMLVideoElement,
    onChange: (active: boolean) => void,
  ) {
    this.onChange = () => onChange(this.active);
    this.video.addEventListener("enterpictureinpicture", this.onChange);
    this.video.addEventListener("leavepictureinpicture", this.onChange);
  }

  get available(): boolean {
    return typeof document !== "undefined" && Boolean(document.pictureInPictureEnabled) && !this.video.disablePictureInPicture;
  }

  get active(): boolean {
    return typeof document !== "undefined" && document.pictureInPictureElement === this.video;
  }

  async enter(): Promise<void> {
    if (!this.available || this.active) return;
    if (typeof this.video.requestPictureInPicture === "function") {
      await this.video.requestPictureInPicture();
    }
  }

  async exit(): Promise<void> {
    if (!this.active || typeof document === "undefined") return;
    if (typeof document.exitPictureInPicture === "function") {
      await document.exitPictureInPicture();
    }
  }

  destroy(): void {
    this.video.removeEventListener("enterpictureinpicture", this.onChange);
    this.video.removeEventListener("leavepictureinpicture", this.onChange);
  }
}
