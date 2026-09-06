import { StrictMode, useRef } from "react";
import { createRoot } from "react-dom/client";
import { KyrspectPlayer, type KyrspectHandle } from "@kyrspect/react";

function App() {
  const playerRef = useRef<KyrspectHandle>(null);

  return (
    <div className="shell">
      <header className="top">
        <div className="brand">
          <span className="mark" />
          <div>
            <strong>React</strong>
            <p>Declarative wrapper around @kyrspect/core.</p>
          </div>
        </div>
      </header>
      <KyrspectPlayer
        ref={playerRef}
        src="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        autoplay={false}
        muted
        controls
        hls={{ preferNative: false }}
        onReady={() => console.log("Kyrspect ready")}
        onPlay={() => console.log("play")}
        onQualityChange={(event) => console.log(event)}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
