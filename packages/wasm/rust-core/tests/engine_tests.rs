use kyrspect_wasm_core::*;

#[test]
fn test_player_lifecycle() {
    let id = kyrspect_wasm_create_player();
    assert!(id > 0);
    kyrspect_wasm_destroy_player(id);
}

#[test]
fn test_alloc_and_free() {
    let size = 1024;
    let ptr = kyrspect_wasm_alloc(size);
    assert!(!ptr.is_null());
    kyrspect_wasm_free(ptr, size);
}

#[test]
fn test_source_analysis() {
    use std::ffi::CString;
    let url = CString::new("https://example.com/stream/manifest.mpd").unwrap();
    let result_ptr = kyrspect_wasm_analyze_source(url.as_ptr(), std::ptr::null());
    assert!(!result_ptr.is_null());
    let cstr = unsafe { std::ffi::CStr::from_ptr(result_ptr) };
    let json_str = cstr.to_str().unwrap();
    assert!(json_str.contains("dash"));
    kyrspect_wasm_free_string(result_ptr);
}

#[test]
fn test_hls_source_analysis() {
    use std::ffi::CString;
    let url = CString::new("https://example.com/stream/master.m3u8").unwrap();
    let result_ptr = kyrspect_wasm_analyze_source(url.as_ptr(), std::ptr::null());
    assert!(!result_ptr.is_null());
    let cstr = unsafe { std::ffi::CStr::from_ptr(result_ptr) };
    let json_str = cstr.to_str().unwrap();
    assert!(json_str.contains("hls"));
    kyrspect_wasm_free_string(result_ptr);
}

#[test]
fn test_subtitle_parser() {
    use std::ffi::CString;
    let id = kyrspect_wasm_create_player();
    let vtt = "WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nHello World\n";
    let c_vtt = CString::new(vtt).unwrap();
    let count = kyrspect_wasm_parse_vtt(id, c_vtt.as_ptr());
    assert_eq!(count, 1);

    let cue_ptr = kyrspect_wasm_get_active_cues(id, 2.0);
    assert!(!cue_ptr.is_null());
    let cstr = unsafe { std::ffi::CStr::from_ptr(cue_ptr) };
    assert!(cstr.to_str().unwrap().contains("Hello World"));
    kyrspect_wasm_free_string(cue_ptr);

    kyrspect_wasm_destroy_player(id);
}
