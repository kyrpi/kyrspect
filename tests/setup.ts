if (typeof MediaStream === "undefined") {
  // jsdom does not implement MediaStream.
  class MediaStreamStub {}
  Object.defineProperty(globalThis, "MediaStream", { value: MediaStreamStub });
}

if (typeof HTMLVideoElement !== "undefined") {
  HTMLVideoElement.prototype.play = async () => undefined;
  HTMLVideoElement.prototype.pause = () => undefined;
  HTMLVideoElement.prototype.load = () => undefined;
}
