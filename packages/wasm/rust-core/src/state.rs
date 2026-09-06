use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PlayerStatus {
    Idle,
    Loading,
    Ready,
    Playing,
    Paused,
    Buffering,
    Seeking,
    Ended,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerState {
    pub status: PlayerStatus,
    pub current_time: f64,
    pub duration: f64,
    pub volume: f64,
    pub muted: bool,
    pub playback_rate: f64,
    pub buffered_end: f64,
    pub is_live: bool,
    pub live_edge_distance: f64,
    pub at_live_edge: bool,
    pub quality_index: i32,
    pub auto_quality: bool,
    pub loop_playback: bool,
    pub playsinline: bool,
    pub last_error: Option<String>,
}

impl Default for PlayerState {
    fn default() -> Self {
        Self {
            status: PlayerStatus::Idle,
            current_time: 0.0,
            duration: 0.0,
            volume: 1.0,
            muted: false,
            playback_rate: 1.0,
            buffered_end: 0.0,
            is_live: false,
            live_edge_distance: 0.0,
            at_live_edge: true,
            quality_index: -1,
            auto_quality: true,
            loop_playback: false,
            playsinline: true,
            last_error: None,
        }
    }
}

pub struct StateEngine {
    state: PlayerState,
}

impl StateEngine {
    pub fn new() -> Self {
        Self {
            state: PlayerState::default(),
        }
    }

    pub fn get_state(&self) -> &PlayerState {
        &self.state
    }

    pub fn set_status(&mut self, status: PlayerStatus) {
        self.state.status = status;
    }

    pub fn update_playback(
        &mut self,
        current_time: f64,
        duration: f64,
        buffered_end: f64,
    ) {
        self.state.current_time = if current_time.is_finite() && current_time >= 0.0 {
            current_time
        } else {
            0.0
        };

        self.state.duration = if duration.is_finite() && duration >= 0.0 {
            duration
        } else {
            0.0
        };

        self.state.buffered_end = if buffered_end.is_finite() && buffered_end >= 0.0 {
            buffered_end
        } else {
            0.0
        };
    }

    pub fn set_volume(&mut self, volume: f64, muted: bool) {
        self.state.volume = volume.clamp(0.0, 1.0);
        self.state.muted = muted;
    }

    pub fn set_playback_rate(&mut self, rate: f64) {
        if rate > 0.0 && rate <= 16.0 {
            self.state.playback_rate = rate;
        }
    }

    pub fn set_live_info(&mut self, is_live: bool, edge_distance: f64, at_edge: bool) {
        self.state.is_live = is_live;
        self.state.live_edge_distance = edge_distance.max(0.0);
        self.state.at_live_edge = at_edge;
    }

    pub fn set_quality(&mut self, index: i32, auto: bool) {
        self.state.quality_index = index;
        self.state.auto_quality = auto;
    }

    pub fn set_error(&mut self, error_msg: Option<String>) {
        if error_msg.is_some() {
            self.state.status = PlayerStatus::Error;
        }
        self.state.last_error = error_msg;
    }

    pub fn reset(&mut self) {
        self.state = PlayerState::default();
    }
}
