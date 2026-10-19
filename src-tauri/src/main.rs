#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::fs;
use std::path::Path;
use tauri::{AppHandle, Emitter, Manager};

#[derive(Serialize)]
struct Entry {
    name: String,
    path: String,
    depth: u32,
    is_dir: bool,
}

const MD_EXTS: [&str; 3] = ["md", "markdown", "mdown"];

fn is_md_file(name: &str) -> bool {
    Path::new(name)
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| MD_EXTS.contains(&e.to_ascii_lowercase().as_str()))
        .unwrap_or(false)
}

fn is_hidden(name: &str) -> bool {
    name.starts_with('.') || name == "node_modules" || name == "target"
}

#[tauri::command]
fn pick_folder(app: AppHandle) -> Option<String> {
    use tauri_plugin_dialog::DialogExt;
    app.dialog()
        .file()
        .blocking_pick_folder()
        .and_then(|p| p.into_path().ok())
        .map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
fn pick_file(app: AppHandle) -> Option<String> {
    use tauri_plugin_dialog::DialogExt;
    app.dialog()
        .file()
        .add_filter("Markdown", &["md", "markdown", "mdown"])
        .blocking_pick_file()
        .and_then(|p| p.into_path().ok())
        .map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
fn pick_save_file(app: AppHandle, name: String) -> Option<String> {
    use tauri_plugin_dialog::DialogExt;
    app.dialog()
        .file()
        .add_filter("Markdown", &["md", "markdown", "mdown"])
        .set_file_name(&name)
        .blocking_save_file()
        .and_then(|p| p.into_path().ok())
        .map(|p| p.to_string_lossy().to_string())
}

/// 先序遍历目录，返回目录（深度≤4）与 Markdown 文件（深度≤6）
#[tauri::command]
fn list_md(root: String) -> Vec<Entry> {
    let mut out = Vec::new();
    let walker = walkdir::WalkDir::new(&root)
        .max_depth(6)
        .sort_by_file_name()
        .into_iter()
        .filter_entry(|e| {
            if e.depth() == 0 {
                return true;
            }
            let name = e.file_name().to_string_lossy();
            !is_hidden(&name)
        });
    for entry in walker.flatten() {
        let depth = entry.depth() as u32;
        if depth == 0 {
            continue;
        }
        let path = entry.path().to_string_lossy().to_string();
        let name = entry.file_name().to_string_lossy().to_string();
        if entry.file_type().is_dir() {
            if depth <= 4 {
                out.push(Entry { name, path, depth: depth - 1, is_dir: true });
            }
        } else if is_md_file(&name) {
            out.push(Entry { name, path, depth: depth - 1, is_dir: false });
        }
    }
    out
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("{}: {}", path, e))
}

#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, content).map_err(|e| format!("{}: {}", path, e))
}

/// 图片保存到 folder/assets/ 下，返回相对路径 "assets/<name>"
#[tauri::command]
fn write_image(folder: String, name: String, data: Vec<u8>) -> Result<String, String> {
    let dir = Path::new(&folder).join("assets");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let safe_name = name.replace(['/', '\\', ':', '*'], "-");
    let file_path = dir.join(&safe_name);
    fs::write(&file_path, data).map_err(|e| e.to_string())?;
    Ok(format!("assets/{}", safe_name))
}

#[tauri::command]
fn exit_app(app: AppHandle) {
    app.exit(0);
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            pick_folder,
            pick_file,
            pick_save_file,
            list_md,
            read_file,
            write_file,
            write_image,
            exit_app
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // 交给前端确认未保存修改
                api.prevent_close();
                let _ = window.emit("close-requested", ());
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
