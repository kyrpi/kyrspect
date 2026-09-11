# Farklı Kütüphane ve Framework'lerde Kullanım

`@kyrspect/core` ve `@kyrspect/wasm` framework'ten bağımsızdır. Aşağıda React, Next.js, Vue 3, Svelte, Angular ve Vanilla JavaScript projelerinde kullanım örnekleri yer almaktadır.

---

## 1. React & Next.js

### Resmi `@kyrspect/react` Bileşeni (Tavsiye Edilen)

Kyrspect, React projeleri için tip güvenli, reaktif ve yalnızca 1.7 KB (gzip) boyutunda resmi bir sarmalayıcı sunar:

```bash
npm install @kyrspect/react @kyrspect/core
```

```tsx
import React, { useRef } from "react";
import { KyrspectPlayer, type KyrspectHandle } from "@kyrspect/react";

export const VideoSayfasi: React.FC = () => {
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
        onReady={() => console.log("Oynatıcı hazır")}
        onPlay={() => console.log("Oynatma başladı")}
      />
    </div>
  );
};
```

### Özel Hook / Doğrudan DOM Sarmalama

`@kyrspect/wasm` veya `@kyrspect/core` sınıfını doğrudan React içinde kendiniz kontrol etmek isterseniz:

```tsx
import React, { useEffect, useRef } from "react";
import { createPlayer, KyrspectWasm } from "@kyrspect/wasm";

interface VideoPlayerProps {
  src: string;
  autoplay?: boolean;
}

export const OzelVideoPlayer: React.FC<VideoPlayerProps> = ({ src, autoplay = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<KyrspectWasm | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const player = createPlayer(containerRef.current, {
      src,
      autoplay,
      controls: true,
      ui: {
        language: "tr",
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
WebAssembly ve HTML video bileşenleri istemci tarafında çalıştığı için `ssr: false` veya `'use client'` ile dinamik import tavsiye edilir:

```tsx
'use client';
import dynamic from 'next/dynamic';

export const DynamicVideoPlayer = dynamic(
  () => import('./VideoSayfasi').then((mod) => mod.VideoSayfasi),
  { ssr: false }
);
```

---

## 2. Vue 3 & Nuxt 3

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
        language: "tr",
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

## 3. Svelte 5 & SvelteKit

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
        language: "tr",
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
        language: "tr",
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

## 5. Düz JavaScript & TypeScript (Vanilla JS)

```typescript
import { createPlayer } from "@kyrspect/wasm";

const player = createPlayer("#player", {
  src: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  controls: true,
  ui: {
    language: "tr",
    theme: "sunset",
    performanceMode: false,
    audioVisualizer: true,
  },
});

player.play();
player.setVolume(0.75);

// WebAssembly WebVTT altyazı yükleme
player.parseVtt(`WEBVTT\n\n1\n00:00:01.000 --> 00:00:04.000\nMerhaba Kyrspect Wasm!`);
```
