//! Desktop shell for GenBeatz. The app itself is the web UI in ../app; this side only
//! gives it real folders: scan the sample library, read a sample, write an export.

use std::fs;
use std::path::{Path, PathBuf};
use tauri::ipc::{InvokeBody, Request, Response};

const EXTS: &[&str] = &["wav", "mp3", "aif", "aiff", "flac", "ogg", "m4a", "mid", "midi"];

/// Every audio / MIDI file under `path`, as (relative path starting with the folder's own name,
/// absolute path, size). The relative form matches what a browser folder picker reports.
#[tauri::command]
async fn scan_dir(path: String) -> Result<Vec<(String, String, u64)>, String> {
    let root = PathBuf::from(&path);
    if !root.is_dir() {
        return Err(format!("文件夹不存在：{path}"));
    }
    let top = root
        .file_name()
        .map(|s| s.to_string_lossy().into_owned())
        .unwrap_or_else(|| "Library".into());
    let mut out = Vec::new();
    for entry in walkdir::WalkDir::new(&root).follow_links(true).into_iter().filter_map(Result::ok) {
        if !entry.file_type().is_file() {
            continue;
        }
        let p = entry.path();
        let wanted = p
            .extension()
            .and_then(|x| x.to_str())
            .map(|x| EXTS.contains(&x.to_ascii_lowercase().as_str()))
            .unwrap_or(false);
        if !wanted {
            continue;
        }
        let Ok(rel) = p.strip_prefix(&root) else { continue };
        let rel = std::iter::once(top.clone())
            .chain(rel.components().map(|c| c.as_os_str().to_string_lossy().into_owned()))
            .collect::<Vec<_>>()
            .join("/");
        let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
        out.push((rel, p.to_string_lossy().into_owned(), size));
    }
    Ok(out)
}

/// Raw bytes of one file; arrives in JS as an ArrayBuffer.
#[tauri::command]
async fn read_file(path: String) -> Result<Response, String> {
    fs::read(&path).map(Response::new).map_err(|e| format!("{path}: {e}"))
}

/// Write the raw request body to the percent-encoded `path` header, creating folders as needed.
#[tauri::command]
async fn write_file(request: Request<'_>) -> Result<(), String> {
    let InvokeBody::Raw(data) = request.body() else {
        return Err("expected raw bytes".into());
    };
    let enc = request
        .headers()
        .get("path")
        .ok_or("missing path header")?
        .to_str()
        .map_err(|e| e.to_string())?;
    let path = percent_encoding::percent_decode_str(enc)
        .decode_utf8()
        .map_err(|e| e.to_string())?
        .into_owned();
    if let Some(dir) = Path::new(&path).parent() {
        fs::create_dir_all(dir).map_err(|e| format!("{}: {e}", dir.display()))?;
    }
    fs::write(&path, data).map_err(|e| format!("{path}: {e}"))
}

/// Show a folder in Finder / Explorer.
#[tauri::command]
fn open_folder(path: String) -> Result<(), String> {
    tauri_plugin_opener::open_path(path, None::<&str>).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![scan_dir, read_file, write_file, open_folder])
        .run(tauri::generate_context!())
        .expect("error while running GenBeatz");
}
