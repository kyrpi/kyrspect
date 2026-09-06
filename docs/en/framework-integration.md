# Framework Integration Guide

`@kyrspect/wasm` is framework-agnostic. Below are complete code examples for integrating Kyrspect into popular modern frameworks.

---

## 1. React / Next.js

### React Component

```tsx
import React, { useEffect, useRef } from "react";
import { createPlayer, KyrspectWasm } from "@kyrspect/wasm";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, autoplay = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<KyrspectWasm | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Automatically uses Wasm engine
    const player = createPlayer(containerRef.current, {
      src,
      autoplay,
      controls: true,
      ui: {
        theme: {
          accent: "#6366f1",
          background: "#0a0c10",
        },
      },
    });

    playerRef.current = player;

    player.on("ready", () => {
      console.log("Player ready");
    });

    return () => {
      player.destroy();
      playerRef.current = null;
    };
  }, [src, autoplay]);

  return <div ref={containerRef} style={{ width: "100%", aspectRatio: "16 / 9" }} />;
};
```

### Next.js (App Router / Pages Router)
Because WebAssembly and HTMLMediaElement run client-side, dynamic import with `ssr: false` or `'use client'` is recommended:

```tsx
'use client';
import dynamic from 'next/dynamic';

export const DynamicPlayer = dynamic(
  () => import('./VideoPlayer').then((mod) => mod.VideoPlayer),
  { ssr: false }
);
```

---

## 2. Vue 3 / Nuxt 3

```vue
<template>
  <div ref="playerContainer" class="video-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { createPlayer, KyrspectWasm } from "@kyrspect/wasm";

const props = defineProps<{
  src: string;
  autoplay?: boolean;
}>();

const playerContainer = ref<HTMLElement | null>(null);
let player: KyrspectWasm | null = null;

onMounted(() => {
  if (playerContainer.value) {
    player = createPlayer(playerContainer.value, {
      src: props.src,
      autoplay: props.autoplay,
      controls: true,
    });
  }
});

watch(() => props.src, (newSrc) => {
  if (player && newSrc) {
    player.load(newSrc);
  }
});

onUnmounted(() => {
  if (player) {
    player.destroy();
    player = null;
  }
});
</script>

<style scoped>
.video-container {
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #000;
}
</style>
```

---

## 3. Svelte 5 / SvelteKit

```svelte
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { createPlayer, type KyrspectWasm } from "@kyrspect/wasm";

  export let src: string;
  let container: HTMLDivElement;
  let player: KyrspectWasm;

  onMount(() => {
    player = createPlayer(container, {
      src,
      controls: true,
    });
  });

  onDestroy(() => {
    if (player) player.destroy();
  });
</script>

<div bind:this={container} class="player-wrapper"></div>

<style>
  .player-wrapper {
    width: 100%;
    aspect-ratio: 16 / 9;
  }
</style>
```

---

## 4. Angular

```typescript
import { Component, ElementRef, Input, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { createPlayer, KyrspectWasm } from "@kyrspect/wasm";

@Component({
  selector: "app-kyrspect-player",
  template: `<div #container class="player-box"></div>`,
  styles: [`.player-box { width: 100%; aspect-ratio: 16/9; }`],
})
export class KyrspectPlayerComponent implements OnInit, OnDestroy {
  @Input() src!: string;
  @ViewChild("container", { static: true }) container!: ElementRef<HTMLDivElement>;

  private player?: KyrspectWasm;

  ngOnInit() {
    this.player = createPlayer(this.container.nativeElement, {
      src: this.src,
      controls: true,
    });
  }

  ngOnDestroy() {
    this.player?.destroy();
  }
}
```

---

## 5. Vanilla JavaScript / TypeScript

```typescript
import { createPlayer } from "@kyrspect/wasm";

const player = createPlayer("#player", {
  src: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  controls: true,
  ui: {
    language: "en",
    theme: {
      accent: "#06b6d4",
    },
  },
});

// Control API
player.play();
player.setVolume(0.8);
player.setQuality("auto");

// Subtitles
player.parseVtt(`WEBVTT\n\n1\n00:00:01.000 --> 00:00:04.000\nHello world!`);
```
