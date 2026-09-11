#![allow(clippy::not_unsafe_ptr_arg_deref)]

mod abr;
mod live;
mod source;
mod state;
mod stats;
mod subtitles;

use std::collections::HashMap;
use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::sync::Mutex;

use abr::{AbrEngine, QualityProfile};
use live::LiveEngine;
use state::{PlayerStatus, StateEngine};
use stats::StatsEngine;
use subtitles::SubtitleParser;

pub struct WasmPlayerInstance {
    pub state: StateEngine,
    pub abr: AbrEngine,
    pub live: LiveEngine,
    pub stats: StatsEngine,
    pub subtitles: SubtitleParser,
    pub quality_profiles: Vec<QualityProfile>,
}

impl Default for WasmPlayerInstance {
    fn default() -> Self {
        Self::new()
    }
}

impl WasmPlayerInstance {
    pub fn new() -> Self {
        Self {
            state: StateEngine::new(),
            abr: AbrEngine::new(),
            live: LiveEngine::new(3.0, 10.0),
            stats: StatsEngine::new(),
            subtitles: SubtitleParser::new(),
            quality_profiles: Vec::new(),
        }
    }
}

static INSTANCES: Mutex<Option<HashMap<u32, WasmPlayerInstance>>> = Mutex::new(None);
static NEXT_ID: Mutex<u32> = Mutex::new(1);

fn with_instances<F, R>(f: F) -> R
where
    F: FnOnce(&mut HashMap<u32, WasmPlayerInstance>) -> R,
{
    let mut guard = INSTANCES.lock().unwrap();
    if guard.is_none() {
        *guard = Some(HashMap::new());
    }
    f(guard.as_mut().unwrap())
}

// Memory Allocation FFI
#[no_mangle]
pub extern "C" fn kyrspect_wasm_alloc(size: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(size);
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

#[no_mangle]
pub extern "C" fn kyrspect_wasm_free(ptr: *mut u8, size: usize) {
    if !ptr.is_null() {
        unsafe {
            let _ = Vec::from_raw_parts(ptr, 0, size);
        }
    }
}

// Player Instance Lifecycle
#[no_mangle]
pub extern "C" fn kyrspect_wasm_create_player() -> u32 {
    let mut next_id = NEXT_ID.lock().unwrap();
    let id = *next_id;
    *next_id += 1;

    with_instances(|instances| {
        instances.insert(id, WasmPlayerInstance::new());
    });

    id
}

#[no_mangle]
pub extern "C" fn kyrspect_wasm_destroy_player(id: u32) {
    with_instances(|instances| {
        instances.remove(&id);
    });
}

// State Operations
#[no_mangle]
pub extern "C" fn kyrspect_wasm_set_status(id: u32, status_code: i32) {
    let status = match status_code {
        0 => PlayerStatus::Idle,
        1 => PlayerStatus::Loading,
        2 => PlayerStatus::Ready,
        3 => PlayerStatus::Playing,
        4 => PlayerStatus::Paused,
        5 => PlayerStatus::Buffering,
        6 => PlayerStatus::Seeking,
        7 => PlayerStatus::Ended,
        _ => PlayerStatus::Error,
    };

    with_instances(|instances| {
        if let Some(player) = instances.get_mut(&id) {
            player.state.set_status(status);
            if status == PlayerStatus::Buffering {
                player.stats.record_stall();
            }
        }
    });
}

#[no_mangle]
pub extern "C" fn kyrspect_wasm_update_playback(
    id: u32,
    current_time: f64,
    duration: f64,
    buffered_end: f64,
) {
    with_instances(|instances| {
        if let Some(player) = instances.get_mut(&id) {
            player
                .state
                .update_playback(current_time, duration, buffered_end);
        }
    });
}

#[no_mangle]
pub extern "C" fn kyrspect_wasm_set_volume(id: u32, volume: f64, muted: i32) {
    with_instances(|instances| {
        if let Some(player) = instances.get_mut(&id) {
            player.state.set_volume(volume, muted != 0);
        }
    });
}

#[no_mangle]
pub extern "C" fn kyrspect_wasm_set_playback_rate(id: u32, rate: f64) {
    with_instances(|instances| {
        if let Some(player) = instances.get_mut(&id) {
            player.state.set_playback_rate(rate);
        }
    });
}

#[no_mangle]
pub extern "C" fn kyrspect_wasm_get_state_json(id: u32) -> *mut c_char {
    let json_str = with_instances(|instances| {
        if let Some(player) = instances.get(&id) {
            serde_json::to_string(player.state.get_state()).unwrap_or_else(|_| "{}".to_string())
        } else {
            "{}".to_string()
        }
    });

    CString::new(json_str).unwrap_or_default().into_raw()
}

// ABR Operations
#[no_mangle]
pub extern "C" fn kyrspect_wasm_record_bandwidth_sample(id: u32, bytes: u64, duration_sec: f64) {
    with_instances(|instances| {
        if let Some(player) = instances.get_mut(&id) {
            player.abr.record_sample(bytes, duration_sec);
        }
    });
}

#[no_mangle]
pub extern "C" fn kyrspect_wasm_set_qualities_json(id: u32, ptr: *const c_char) {
    if ptr.is_null() {
        return;
    }
    let cstr = unsafe { CStr::from_ptr(ptr) };
    if let Ok(slice) = cstr.to_str() {
        if let Ok(profiles) = serde_json::from_str::<Vec<QualityProfile>>(slice) {
            with_instances(|instances| {
                if let Some(player) = instances.get_mut(&id) {
                    player.quality_profiles = profiles;
                }
            });
        }
    }
}

#[no_mangle]
pub extern "C" fn kyrspect_wasm_evaluate_abr(
    id: u32,
    current_quality_index: i32,
    buffer_length_sec: f64,
    viewport_width: u32,
    viewport_height: u32,
    is_manual: i32,
) -> *mut c_char {
    let json_str = with_instances(|instances| {
        if let Some(player) = instances.get_mut(&id) {
            let decision = player.abr.evaluate(
                &player.quality_profiles,
                current_quality_index,
                buffer_length_sec,
                viewport_width,
                viewport_height,
                is_manual != 0,
            );
            serde_json::to_string(&decision).unwrap_or_else(|_| "{}".to_string())
        } else {
            "{}".to_string()
        }
    });

    CString::new(json_str).unwrap_or_default().into_raw()
}

// Live Stream Synchronization
#[no_mangle]
pub extern "C" fn kyrspect_wasm_update_live(
    id: u32,
    is_live: i32,
    current_time: f64,
    live_edge_time: f64,
) -> *mut c_char {
    let json_str = with_instances(|instances| {
        if let Some(player) = instances.get_mut(&id) {
            let sync = player
                .live
                .update(is_live != 0, current_time, live_edge_time);
            player
                .state
                .set_live_info(sync.is_live, sync.live_edge_distance, sync.at_live_edge);
            serde_json::to_string(&sync).unwrap_or_else(|_| "{}".to_string())
        } else {
            "{}".to_string()
        }
    });

    CString::new(json_str).unwrap_or_default().into_raw()
}

// Real-time Statistics
#[no_mangle]
pub extern "C" fn kyrspect_wasm_compute_stats(
    id: u32,
    total_frames: u64,
    dropped_frames: u64,
    time_ms: f64,
    buffer_sec: f64,
    current_bitrate_bps: u64,
    latency_sec: f64,
) -> *mut c_char {
    let json_str = with_instances(|instances| {
        if let Some(player) = instances.get_mut(&id) {
            let bw = player.abr.get_estimated_bandwidth();
            let stats = player.stats.compute(
                total_frames,
                dropped_frames,
                time_ms,
                bw,
                buffer_sec,
                current_bitrate_bps,
                latency_sec,
            );
            serde_json::to_string(&stats).unwrap_or_else(|_| "{}".to_string())
        } else {
            "{}".to_string()
        }
    });

    CString::new(json_str).unwrap_or_default().into_raw()
}

// Subtitles Parsing & Lookup
#[no_mangle]
pub extern "C" fn kyrspect_wasm_parse_vtt(id: u32, ptr: *const c_char) -> u32 {
    if ptr.is_null() {
        return 0;
    }
    let cstr = unsafe { CStr::from_ptr(ptr) };
    if let Ok(vtt_text) = cstr.to_str() {
        with_instances(|instances| {
            if let Some(player) = instances.get_mut(&id) {
                player.subtitles.parse_vtt(vtt_text) as u32
            } else {
                0
            }
        })
    } else {
        0
    }
}

#[no_mangle]
pub extern "C" fn kyrspect_wasm_get_active_cues(id: u32, current_time: f64) -> *mut c_char {
    let json_str = with_instances(|instances| {
        if let Some(player) = instances.get(&id) {
            let active = player.subtitles.get_active_cues(current_time);
            serde_json::to_string(&active).unwrap_or_else(|_| "[]".to_string())
        } else {
            "[]".to_string()
        }
    });

    CString::new(json_str).unwrap_or_default().into_raw()
}

// Source Inspection
#[no_mangle]
pub extern "C" fn kyrspect_wasm_analyze_source(
    url_ptr: *const c_char,
    mime_ptr: *const c_char,
) -> *mut c_char {
    if url_ptr.is_null() {
        return CString::new("{}").unwrap().into_raw();
    }
    let url = unsafe { CStr::from_ptr(url_ptr) }.to_str().unwrap_or("");
    let mime = if !mime_ptr.is_null() {
        unsafe { CStr::from_ptr(mime_ptr) }.to_str().ok()
    } else {
        None
    };

    let info = source::analyze_source(url, mime);
    let json_str = serde_json::to_string(&info).unwrap_or_else(|_| "{}".to_string());
    CString::new(json_str).unwrap_or_default().into_raw()
}

// Free CString returned by Wasm
#[no_mangle]
pub extern "C" fn kyrspect_wasm_free_string(ptr: *mut c_char) {
    if !ptr.is_null() {
        unsafe {
            let _ = CString::from_raw(ptr);
        }
    }
}
