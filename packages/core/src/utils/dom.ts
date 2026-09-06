export function resolveElement(target: string | HTMLElement): HTMLElement {
  if (typeof target !== "string") return target;
  if (typeof document === "undefined") {
    throw new Error("Kyrspect requires a DOM environment.");
  }
  const node = document.querySelector(target);
  if (!(node instanceof HTMLElement)) {
    throw new Error(`Kyrspect could not find element "${target}".`);
  }
  return node;
}

export interface BoundTarget {
  root: HTMLElement;
  video: HTMLVideoElement;
  createdVideo: boolean;
  wrapped: boolean;
  cleanupDom: () => void;
}

function findDirectChild(root: HTMLElement, className: string): HTMLElement | null {
  for (const child of Array.from(root.children)) {
    if (child instanceof HTMLElement && child.classList.contains(className)) return child;
  }
  return null;
}

function ensureSizer(root: HTMLElement): HTMLElement {
  let sizer = findDirectChild(root, "kyrspect-sizer");
  if (!sizer) {
    sizer = document.createElement("div");
    sizer.className = "kyrspect-sizer";
    sizer.setAttribute("aria-hidden", "true");
    root.insertBefore(sizer, root.firstChild);
  }
  return sizer;
}

function ensureVideoPlacement(root: HTMLElement, video: HTMLVideoElement, sizer: HTMLElement): void {
  video.classList.add("kyrspect-video");
  if (video.parentElement !== root) root.appendChild(video);
  if (video.previousElementSibling !== sizer) {
    root.insertBefore(video, sizer.nextSibling);
  }
}

export function bindTarget(
  target: string | HTMLElement,
  options: { wrapForUi: boolean },
): BoundTarget {
  const element = resolveElement(target);

  if (element instanceof HTMLVideoElement) {
    if (!options.wrapForUi) {
      return {
        root: element,
        video: element,
        createdVideo: false,
        wrapped: false,
        cleanupDom: () => undefined,
      };
    }
    const wrapper = document.createElement("div");
    wrapper.className = "kyrspect kyrspect-player";
    element.parentNode?.insertBefore(wrapper, element);
    wrapper.appendChild(element);
    const sizer = ensureSizer(wrapper);
    ensureVideoPlacement(wrapper, element, sizer);
    return {
      root: wrapper,
      video: element,
      createdVideo: false,
      wrapped: true,
      cleanupDom: () => {
        wrapper.replaceWith(element);
        element.classList.remove("kyrspect-video");
      },
    };
  }

  element.classList.add("kyrspect", "kyrspect-player");
  let video =
    Array.from(element.children).find((child): child is HTMLVideoElement => child instanceof HTMLVideoElement) ??
    element.querySelector("video");
  let createdVideo = false;
  if (!(video instanceof HTMLVideoElement)) {
    video = document.createElement("video");
    createdVideo = true;
  }
  const sizer = ensureSizer(element);
  ensureVideoPlacement(element, video, sizer);

  return {
    root: element,
    video,
    createdVideo,
    wrapped: false,
    cleanupDom: () => {
      element.classList.remove("kyrspect", "kyrspect-player");
      findDirectChild(element, "kyrspect-sizer")?.remove();
      if (createdVideo) video.remove();
      else video.classList.remove("kyrspect-video");
    },
  };
}
