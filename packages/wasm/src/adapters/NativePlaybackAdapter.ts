export class NativePlaybackAdapter {
  private media: HTMLVideoElement;
  private onTrackCallback?: () => void;

  constructor(media: HTMLVideoElement) {
    this.media = media;
  }

  load(src: string): void {
    this.media.src = src;
    this.media.load();
  }

  destroy(): void {
    this.media.removeAttribute("src");
    this.media.load();
  }
}
