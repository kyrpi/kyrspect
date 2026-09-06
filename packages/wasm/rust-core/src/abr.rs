use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityProfile {
    pub id: i32,
    pub width: u32,
    pub height: u32,
    pub bitrate: u64, // bits per second
    pub label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AbrDecision {
    pub selected_index: i32,
    pub reason: String,
    pub estimated_bandwidth_bps: f64,
    pub buffer_length_sec: f64,
}

pub struct AbrEngine {
    bandwidth_ewma: f64, // bits per second
    alpha_fast: f64,     // fast EWMA factor (0.3)
    alpha_slow: f64,     // slow EWMA factor (0.05)
    fast_estimate: f64,
    slow_estimate: f64,
    samples_count: usize,
    default_bandwidth: f64,
    min_buffer_for_upswitch_sec: f64,
    max_buffer_sec: f64,
    safety_factor: f64, // percentage of estimated bandwidth to use (e.g. 0.8)
}

impl AbrEngine {
    pub fn new() -> Self {
        let default_bw = 5_000_000.0; // 5 Mbps default start
        Self {
            bandwidth_ewma: default_bw,
            alpha_fast: 0.3,
            alpha_slow: 0.05,
            fast_estimate: default_bw,
            slow_estimate: default_bw,
            samples_count: 0,
            default_bandwidth: default_bw,
            min_buffer_for_upswitch_sec: 4.0,
            max_buffer_sec: 30.0,
            safety_factor: 0.82,
        }
    }

    /// Record a downloaded chunk sample: size in bytes, duration in seconds
    pub fn record_sample(&mut self, bytes: u64, duration_sec: f64) {
        if duration_sec <= 0.001 || bytes == 0 {
            return;
        }

        let bits = (bytes as f64) * 8.0;
        let instant_bandwidth = bits / duration_sec;

        if self.samples_count == 0 {
            self.fast_estimate = instant_bandwidth;
            self.slow_estimate = instant_bandwidth;
            self.bandwidth_ewma = instant_bandwidth;
        } else {
            self.fast_estimate = self.alpha_fast * instant_bandwidth + (1.0 - self.alpha_fast) * self.fast_estimate;
            self.slow_estimate = self.alpha_slow * instant_bandwidth + (1.0 - self.alpha_slow) * self.slow_estimate;
            // Conservative estimate: take the minimum of fast and slow to prevent aggressive upswitches
            self.bandwidth_ewma = self.fast_estimate.min(self.slow_estimate);
        }

        self.samples_count += 1;
    }

    pub fn get_estimated_bandwidth(&self) -> f64 {
        self.bandwidth_ewma
    }

    /// Choose optimal quality index from available profiles
    pub fn evaluate(
        &self,
        qualities: &[QualityProfile],
        current_quality_index: i32,
        buffer_length_sec: f64,
        viewport_width: u32,
        viewport_height: u32,
        is_manual: bool,
    ) -> AbrDecision {
        if qualities.is_empty() {
            return AbrDecision {
                selected_index: -1,
                reason: "no_qualities_available".to_string(),
                estimated_bandwidth_bps: self.bandwidth_ewma,
                buffer_length_sec,
            };
        }

        if is_manual && current_quality_index >= 0 && (current_quality_index as usize) < qualities.len() {
            return AbrDecision {
                selected_index: current_quality_index,
                reason: "manual_override".to_string(),
                estimated_bandwidth_bps: self.bandwidth_ewma,
                buffer_length_sec,
            };
        }

        let effective_bandwidth = self.bandwidth_ewma * self.safety_factor;

        // Emergency downswitch on starving buffer
        if buffer_length_sec < 1.5 && qualities.len() > 1 {
            let lowest_idx = 0;
            return AbrDecision {
                selected_index: lowest_idx,
                reason: "emergency_buffer_low".to_string(),
                estimated_bandwidth_bps: self.bandwidth_ewma,
                buffer_length_sec,
            };
        }

        // Filter profiles that fit bandwidth and viewport constraints
        let mut best_idx = 0;
        let mut best_bitrate = 0;

        for (idx, q) in qualities.iter().enumerate() {
            let is_bw_suitable = (q.bitrate as f64) <= effective_bandwidth || idx == 0;

            // Optional viewport cap (don't play 4K on a 320px screen unless forced)
            let is_res_suitable = if viewport_width > 0 && viewport_height > 0 {
                // allow up to 1.5x of screen resolution for high DPI / sharpness
                let max_w = (viewport_width as f64 * 1.5) as u32;
                let max_h = (viewport_height as f64 * 1.5) as u32;
                q.width <= max_w && q.height <= max_h
            } else {
                true
            };

            if is_bw_suitable && (is_res_suitable || best_idx == 0) {
                if q.bitrate >= best_bitrate {
                    best_bitrate = q.bitrate;
                    best_idx = idx;
                }
            }
        }

        // Hysteresis: if proposing to upswitch, require enough buffer
        if (best_idx as i32) > current_quality_index && current_quality_index >= 0 {
            if buffer_length_sec < self.min_buffer_for_upswitch_sec {
                return AbrDecision {
                    selected_index: current_quality_index,
                    reason: "hysteresis_buffer_filling".to_string(),
                    estimated_bandwidth_bps: self.bandwidth_ewma,
                    buffer_length_sec,
                };
            }
        }

        AbrDecision {
            selected_index: best_idx as i32,
            reason: "bandwidth_optimal".to_string(),
            estimated_bandwidth_bps: self.bandwidth_ewma,
            buffer_length_sec,
        }
    }

    pub fn reset(&mut self) {
        self.bandwidth_ewma = self.default_bandwidth;
        self.fast_estimate = self.default_bandwidth;
        self.slow_estimate = self.default_bandwidth;
        self.samples_count = 0;
    }
}
