# Framework Integration Guide

`@kyrspect/core` and `@kyrspect/wasm` are framework-agnostic. Below are complete code examples for integrating Kyrspect into React, Next.js, Vue 3, Svelte, Angular, and Vanilla JavaScript.

---

## 1. React / Next.js

### Official `@kyrspect/react` Component (Recommended)

Kyrspect ships with an official, typed, and lightweight React package (`@kyrspect/react` ~1.7 KB gzip):

```bash
npm install @kyrspect/react @kyrspect/core
```

```tsx
import React, { useRef } from "react";
import { KyrspectPlayer, type KyrspectHandle } from "@kyrspect/react";

export const VideoPage: React.FC = () => {
  const playerRef = useRef<KyrspectHandle>(null);

  return (
    <div style={{ width: "100%", maxWidth: "960px", aspectRatio: "16 / 9" }}>
      <KyrspectPlayer
        ref={playerRef}
        src="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        autoplay={false}
        controls
        theme="dracula" // 'cyberpunk' | 'nord' | 'dracula' | 'sunset' | 'emerald' | 'oled' | 'minimal' | 'default'
        performanceMode={false}
        onReady={() => console.log("Player is ready")}
        onPlay={() => console.log("Playback started")}
      />
    </div>
  );
};
```

### Custom Hook / Manual Binding

If you prefer building a custom component with `@kyrspect/wasm` or `@kyrspect/core`:

```tsx
import React, { useEffect, useRef } from "react";
import { createPlayer, KyrspectWasm } from "@kyrspect/wasm";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
}

export const CustomVideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, autoplay = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<KyrspectWasm | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const player = createPlayer(containerRef.current, {
      src,
      autoplay,
      controls: true,
      ui: {
        theme: "dracula",
        performanceMode: false,
      },
    });

    playerRef.current = player;

    return () => {
      player.destroy();
      playerRef.current = null;
    };
  }, [src, autoplay]);

  return <div ref={containerRef} style={{ width: "100%", aspectRatio: "16 / 9" }} />;
};
```

### Next.js (App Router / Pages Router)
Because WebAssembly, HTMLMediaElement, and DOM manipulations run client-side, dynamic import with `ssr: false` or `'use client'` is recommended:

```tsx
'use client';
import dynamic from 'next/dynamic';

export const DynamicPlayer = dynamic(
  () => import('./VideoPage').then((mod) => mod.VideoPage),
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
      ui: {
        theme: "nord",
      },
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
      ui: {
        theme: "cyberpunk",
      },
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
      ui: {
        theme: "emerald",
      },
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
    theme: "sunset",
    performanceMode: false,
    audioVisualizer: true,
  },
});

// Control API
player.play();
player.setVolume(0.8);
player.setQuality("auto");

// Subtitles
player.parseVtt(`WEBVTT\n\n1\n00:00:01.000 --> 00:00:04.000\nHello world!`);
```
