use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleCue {
    pub id: String,
    pub start_time: f64,
    pub end_time: f64,
    pub text: String,
    pub settings: String,
}

pub struct SubtitleParser {
    cues: Vec<SubtitleCue>,
}

impl SubtitleParser {
    pub fn new() -> Self {
        Self { cues: Vec::new() }
    }

    pub fn get_cues(&self) -> &[SubtitleCue] {
        &self.cues
    }

    /// Parse a WebVTT formatted string into structured cues
    pub fn parse_vtt(&mut self, content: &str) -> usize {
        self.cues.clear();
        let lines: Vec<&str> = content.lines().collect();

        let mut i = 0;
        // Skip BOM and header
        while i < lines.len() {
            let line = lines[i].trim();
            if line.starts_with("WEBVTT") {
                i += 1;
                break;
            }
            i += 1;
        }

        while i < lines.len() {
            let line = lines[i].trim();
            if line.is_empty()
                || line.starts_with("NOTE")
                || line.starts_with("STYLE")
                || line.starts_with("REGION")
            {
                i += 1;
                continue;
            }

            // Check if current line is identifier or timestamp
            let mut id = String::new();
            let mut time_line = line;

            if !time_line.contains("-->") {
                id = line.to_string();
                i += 1;
                if i >= lines.len() {
                    break;
                }
                time_line = lines[i].trim();
            }

            if let Some((start_sec, end_sec, settings)) = Self::parse_timestamp_line(time_line) {
                i += 1;
                let mut text_lines = Vec::new();
                while i < lines.len() {
                    let text_line = lines[i].trim_end();
                    if text_line.trim().is_empty() {
                        break;
                    }
                    text_lines.push(text_line);
                    i += 1;
                }

                let text = text_lines.join("\n");
                self.cues.push(SubtitleCue {
                    id,
                    start_time: start_sec,
                    end_time: end_sec,
                    text,
                    settings,
                });
            } else {
                i += 1;
            }
        }

        // Sort cues by start_time for binary searching
        self.cues.sort_by(|a, b| {
            a.start_time
                .partial_cmp(&b.start_time)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        self.cues.len()
    }

    fn parse_timestamp_line(line: &str) -> Option<(f64, f64, String)> {
        let parts: Vec<&str> = line.split("-->").collect();
        if parts.len() != 2 {
            return None;
        }

        let start_str = parts[0].trim();
        let end_and_settings = parts[1].trim();

        let end_tokens: Vec<&str> = end_and_settings.split_whitespace().collect();
        if end_tokens.is_empty() {
            return None;
        }

        let end_str = end_tokens[0];
        let settings = if end_tokens.len() > 1 {
            end_tokens[1..].join(" ")
        } else {
            String::new()
        };

        let start_time = Self::parse_timestamp(start_str)?;
        let end_time = Self::parse_timestamp(end_str)?;

        Some((start_time, end_time, settings))
    }

    fn parse_timestamp(s: &str) -> Option<f64> {
        let s = s.trim();
        let parts: Vec<&str> = s.split(':').collect();
        match parts.len() {
            2 => {
                // MM:SS.mmm
                let minutes: f64 = parts[0].parse().ok()?;
                let sec_parts: Vec<&str> = parts[1].split('.').collect();
                let seconds: f64 = sec_parts[0].parse().ok()?;
                let millis: f64 = if sec_parts.len() > 1 {
                    let m_str = format!("{:0<3}", sec_parts[1]);
                    m_str[..3.min(m_str.len())].parse().ok()?
                } else {
                    0.0
                };
                Some(minutes * 60.0 + seconds + millis / 1000.0)
            }
            3 => {
                // HH:MM:SS.mmm
                let hours: f64 = parts[0].parse().ok()?;
                let minutes: f64 = parts[1].parse().ok()?;
                let sec_parts: Vec<&str> = parts[2].split('.').collect();
                let seconds: f64 = sec_parts[0].parse().ok()?;
                let millis: f64 = if sec_parts.len() > 1 {
                    let m_str = format!("{:0<3}", sec_parts[1]);
                    m_str[..3.min(m_str.len())].parse().ok()?
                } else {
                    0.0
                };
                Some(hours * 3600.0 + minutes * 60.0 + seconds + millis / 1000.0)
            }
            _ => None,
        }
    }

    /// Find active cues at current_time
    pub fn get_active_cues(&self, current_time: f64) -> Vec<SubtitleCue> {
        let mut active = Vec::new();
        for cue in &self.cues {
            if cue.start_time <= current_time && current_time < cue.end_time {
                active.push(cue.clone());
            } else if cue.start_time > current_time {
                // cues are sorted by start_time
                break;
            }
        }
        active
    }
}
