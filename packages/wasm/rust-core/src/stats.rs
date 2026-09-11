use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerStatsSnapshot {
    pub fps: f64,
    pub dropped_frames: u64,
    pub total_frames: u64,
    pub dropped_frame_rate: f64, // percentage (0 - 100%)
    pub bandwidth_bps: f64,
    pub buffer_length_sec: f64,
    pub current_bitrate_bps: u64,
    pub latency_sec: f64,
    pub connection_quality: String, // "Excellent", "Good", "Fair", "Poor"
    pub playback_stalls: u32,
}

pub struct StatsEngine {
    last_frame_count: u64,
    last_frame_time_ms: f64,
    fps_smooth: f64,
    stalls_count: u32,
}

impl Default for StatsEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl StatsEngine {
    pub fn new() -> Self {
        Self {
            last_frame_count: 0,
            last_frame_time_ms: 0.0,
            fps_smooth: 0.0,
            stalls_count: 0,
        }
    }

    pub fn record_stall(&mut self) {
        self.stalls_count += 1;
    }

    #[allow(clippy::too_many_arguments)]
    pub fn compute(
        &mut self,
        total_frames: u64,
        dropped_frames: u64,
        time_ms: f64,
        bandwidth_bps: f64,
        buffer_sec: f64,
        current_bitrate_bps: u64,
        latency_sec: f64,
    ) -> PlayerStatsSnapshot {
        // Compute instant FPS
        if self.last_frame_time_ms > 0.0 && time_ms > self.last_frame_time_ms {
            let delta_sec = (time_ms - self.last_frame_time_ms) / 1000.0;
            let frame_delta = total_frames.saturating_sub(self.last_frame_count);
            let instant_fps = (frame_delta as f64) / delta_sec;

            if (0.0..=240.0).contains(&instant_fps) {
                if self.fps_smooth == 0.0 {
                    self.fps_smooth = instant_fps;
                } else {
                    self.fps_smooth = 0.7 * self.fps_smooth + 0.3 * instant_fps;
                }
            }
        }

        self.last_frame_count = total_frames;
        self.last_frame_time_ms = time_ms;

        let dropped_rate = if total_frames > 0 {
            ((dropped_frames as f64) / (total_frames as f64)) * 100.0
        } else {
            0.0
        };

        let quality_str = if bandwidth_bps > 8_000_000.0 && buffer_sec > 5.0 && dropped_rate < 0.5 {
            "Excellent"
        } else if bandwidth_bps > 3_000_000.0 && buffer_sec > 2.5 && dropped_rate < 2.0 {
            "Good"
        } else if bandwidth_bps > 1_000_000.0 && buffer_sec > 1.0 {
            "Fair"
        } else {
            "Poor"
        };

        PlayerStatsSnapshot {
            fps: (self.fps_smooth * 10.0).round() / 10.0,
            dropped_frames,
            total_frames,
            dropped_frame_rate: (dropped_rate * 100.0).round() / 100.0,
            bandwidth_bps,
            buffer_length_sec: (buffer_sec * 100.0).round() / 100.0,
            current_bitrate_bps,
            latency_sec: (latency_sec * 100.0).round() / 100.0,
            connection_quality: quality_str.to_string(),
            playback_stalls: self.stalls_count,
        }
    }

    pub fn reset(&mut self) {
        self.last_frame_count = 0;
        self.last_frame_time_ms = 0.0;
        self.fps_smooth = 0.0;
        self.stalls_count = 0;
    }
}
