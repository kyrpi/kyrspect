export interface StoredPreferences {
  volume?: number;
  muted?: boolean;
  playbackRate?: number;
  subtitleLanguage?: string;
  subtitleFont?: string;
  subtitleColor?: string;
  subtitleBgColor?: string;
  subtitleFontSize?: string;
  audioDualChannel?: boolean;
  audioEqualizer?: string;
}

export class StorageManager {
  constructor(
    private readonly persist: boolean,
    private readonly key: string,
  ) {}

  read(): StoredPreferences {
    if (!this.persist || typeof localStorage === "undefined") return {};
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as StoredPreferences;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  write(patch: StoredPreferences): void {
    if (!this.persist || typeof localStorage === "undefined") return;
    try {
      const next = { ...this.read(), ...patch };
      localStorage.setItem(this.key, JSON.stringify(next));
    } catch {
      // Quota or private mode — ignore.
    }
  }
}
