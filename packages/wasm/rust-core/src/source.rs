use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MediaType {
    Hls,
    Dash,
    Mp4,
    Webm,
    Ogg,
    MediaStream,
    Blob,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceInfo {
    pub url: String,
    pub media_type: MediaType,
    pub is_hls: bool,
    pub is_dash: bool,
    pub is_stream: bool,
    pub probable_mime: String,
}

pub fn analyze_source(url: &str, mime_type_hint: Option<&str>) -> SourceInfo {
    let clean_url = url
        .split('?')
        .next()
        .unwrap_or(url)
        .split('#')
        .next()
        .unwrap_or(url)
        .to_lowercase();

    let (media_type, probable_mime) = if let Some(mime) = mime_type_hint {
        let m = mime.to_lowercase();
        if m.contains("x-mpegurl") || m.contains("vnd.apple.mpegurl") {
            (MediaType::Hls, "application/x-mpegURL".to_string())
        } else if m.contains("dash+xml") || m.contains("application/dash") {
            (MediaType::Dash, "application/dash+xml".to_string())
        } else if m.contains("video/mp4") {
            (MediaType::Mp4, "video/mp4".to_string())
        } else if m.contains("video/webm") {
            (MediaType::Webm, "video/webm".to_string())
        } else if m.contains("video/ogg") {
            (MediaType::Ogg, "video/ogg".to_string())
        } else {
            (MediaType::Unknown, m)
        }
    } else if clean_url.ends_with(".m3u8") || clean_url.contains(".m3u8") {
        (MediaType::Hls, "application/x-mpegURL".to_string())
    } else if clean_url.ends_with(".mpd") || clean_url.contains(".mpd") {
        (MediaType::Dash, "application/dash+xml".to_string())
    } else if clean_url.ends_with(".mp4") || clean_url.ends_with(".m4v") {
        (MediaType::Mp4, "video/mp4".to_string())
    } else if clean_url.ends_with(".webm") {
        (MediaType::Webm, "video/webm".to_string())
    } else if clean_url.ends_with(".ogv") || clean_url.ends_with(".ogg") {
        (MediaType::Ogg, "video/ogg".to_string())
    } else if url.starts_with("blob:") {
        (MediaType::Blob, "video/mp4".to_string())
    } else if url.starts_with("mediastream:") {
        (MediaType::MediaStream, "".to_string())
    } else {
        (MediaType::Unknown, "video/mp4".to_string())
    };

    let is_hls = media_type == MediaType::Hls;
    let is_dash = media_type == MediaType::Dash;
    let is_stream = is_hls || is_dash || media_type == MediaType::MediaStream;

    SourceInfo {
        url: url.to_string(),
        media_type,
        is_hls,
        is_dash,
        is_stream,
        probable_mime,
    }
}
