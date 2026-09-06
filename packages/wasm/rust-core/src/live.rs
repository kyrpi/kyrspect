use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiveSyncStatus {
    pub is_live: bool,
    pub live_edge_distance: f64,
    pub target_latency: f64,
    pub max_latency: f64,
    pub at_live_edge: bool,
    pub recommended_playback_rate: f64,
    pub drift: f64,
}

pub struct LiveEngine {
    target_latency: f64,
    max_latency: f64,
    min_latency: f64,
    catchup_rate: f64,
    slowdown_rate: f64,
    live_tolerance: f64,
}

impl LiveEngine {
    pub fn new(target_latency: f64, max_latency: f64) -> Self {
        let target = if target_latency > 0.0 { target_latency } else { 3.0 };
        let max = if max_latency > target { max_latency } else { target * 2.5 };
        Self {
            target_latency: target,
            max_latency: max,
            min_latency: (target * 0.6).max(0.5),
            catchup_rate: 1.05,
            slowdown_rate: 0.95,
            live_tolerance: 2.0,
        }
    }

    pub fn update(&self, is_live: bool, current_time: f64, live_edge_time: f64) -> LiveSyncStatus {
        if !is_live || live_edge_time <= 0.0 {
            return LiveSyncStatus {
                is_live: false,
                live_edge_distance: 0.0,
                target_latency: self.target_latency,
                max_latency: self.max_latency,
                at_live_edge: true,
                recommended_playback_rate: 1.0,
                drift: 0.0,
            };
        }

        let distance = (live_edge_time - current_time).max(0.0);
        let drift = distance - self.target_latency;
        let at_edge = distance <= self.live_tolerance;

        let recommended_rate = if distance > self.max_latency {
            // Far behind target latency: catch up
            self.catchup_rate
        } else if distance < self.min_latency {
            // Too close to live edge (risk of stall): slow down slightly
            self.slowdown_rate
        } else {
            // In optimal latency window
            1.0
        };

        LiveSyncStatus {
            is_live: true,
            live_edge_distance: distance,
            target_latency: self.target_latency,
            max_latency: self.max_latency,
            at_live_edge: at_edge,
            recommended_playback_rate: recommended_rate,
            drift,
        }
    }
}
