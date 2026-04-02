#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use regex::Regex;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
    sync::Mutex,
    time::Duration,
};
use tauri::{
    AppHandle, Emitter, LogicalSize, Manager, State, WebviewWindowBuilder, Window, Wry,
    menu::{MenuBuilder, SubmenuBuilder},
};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

const APP_NAME: &str = "Talarias";
const APP_VERSION: &str = env!("CARGO_PKG_VERSION");
const UI_LOCALE: &str = match option_env!("TALARIAS_LOCALE") {
    Some(locale) => locale,
    None => "en",
};
const DEFAULT_MAIN_SHORTCUT: &str = "Alt+Shift+Z";
const WIN_WIDTH: f64 = 580.0;
const BASE_HEIGHT: f64 = 138.0;
const RESULT_ITEM_HEIGHT: f64 = 50.0;
const MAX_VISIBLE_RESULTS: usize = 7;
const EDITOR_HEIGHT: f64 = 526.0;

#[derive(Default)]
struct AppState {
    bindings: Mutex<HashMap<String, Binding>>,
    aliases: Mutex<HashMap<String, String>>,
    main_shortcut: Mutex<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Binding {
    id: String,
    title: String,
    category: String,
    body: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct TemplateItem {
    id: String,
    title: String,
    body: String,
    path: String,
    relative_path: String,
    category: String,
    preview: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct GenericResponse {
    ok: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct LoadTemplatesResponse {
    ok: bool,
    templates: Vec<TemplateItem>,
    root_dir: String,
    error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ShortcutValidationResponse {
    valid: bool,
    error: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct TemplatesRootInfo {
    path: String,
    custom: bool,
    fallback: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ChooseTemplatesRootResponse {
    ok: bool,
    canceled: bool,
    path: String,
    custom: bool,
    fallback: bool,
    error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
struct AboutMetadata {
    name: String,
    version: String,
    locale: String,
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        handle_global_shortcut(app, shortcut);
                    }
                })
                .build(),
        )
        .manage(AppState::default())
        .setup(|app| {
            initialize_state(app.handle());
            build_app_menu(app.handle())?;
            register_all_shortcuts(app.handle())?;

            if welcome_should_show(app.handle()) {
                let handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    tokio::time::sleep(Duration::from_millis(450)).await;
                    let _ = show_welcome_window(&handle);
                });
            }

            show_launcher(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_templates,
            list_folders,
            get_ui_locale,
            get_templates_root,
            set_templates_root,
            choose_templates_root,
            get_selected_folder,
            set_selected_folder,
            copy_text,
            resize_window,
            validate_shortcut,
            save_binding,
            remove_binding,
            get_bindings,
            save_alias,
            get_aliases,
            get_main_shortcut,
            save_main_shortcut,
            dismiss_welcome,
            get_theme,
            set_theme,
            close_current_window,
            get_about_metadata,
            show_about_window_command,
            get_platform
        ])
        .run(tauri::generate_context!())
        .expect("error while running Talarias");
}

fn data_dir(app: &AppHandle<Wry>) -> PathBuf {
    app.path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..").join(".talarias-data"))
}

fn data_path(app: &AppHandle<Wry>, name: &str) -> PathBuf {
    data_dir(app).join(name)
}

fn ensure_parent(path: &Path) {
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
}

fn load_json<T>(path: &Path) -> T
where
    T: DeserializeOwned + Default,
{
    fs::read_to_string(path)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default()
}

fn save_json<T: Serialize>(path: &Path, value: &T) -> Result<(), String> {
    ensure_parent(path);
    let raw = serde_json::to_string_pretty(value).map_err(|err| err.to_string())?;
    fs::write(path, raw).map_err(|err| err.to_string())
}

fn load_text(path: &Path) -> String {
    fs::read_to_string(path)
        .map(|value| value.trim().to_string())
        .unwrap_or_default()
}

fn save_text(path: &Path, value: &str) -> Result<(), String> {
    ensure_parent(path);
    fs::write(path, value.trim()).map_err(|err| err.to_string())
}

fn bundled_templates_dir(app: &AppHandle<Wry>) -> PathBuf {
    if let Ok(resource_dir) = app.path().resource_dir() {
        let bundled = resource_dir.join("templates");
        if bundled.exists() {
            return bundled;
        }
    }

    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("templates")
}

fn get_saved_templates_root(app: &AppHandle<Wry>) -> String {
    load_text(&data_path(app, "templates-root"))
}

fn templates_root_info(app: &AppHandle<Wry>) -> TemplatesRootInfo {
    let saved_path = get_saved_templates_root(app);
    let custom = !saved_path.is_empty();
    let exists = custom && Path::new(&saved_path).is_dir();

    if exists {
        return TemplatesRootInfo {
            path: saved_path,
            custom: true,
            fallback: false,
        };
    }

    TemplatesRootInfo {
        path: bundled_templates_dir(app).display().to_string(),
        custom: false,
        fallback: true,
    }
}

fn templates_root_dir(app: &AppHandle<Wry>) -> PathBuf {
    PathBuf::from(templates_root_info(app).path)
}

fn ui_text(key: &str) -> String {
    match (UI_LOCALE, key) {
        ("ja", "folder_not_found") => "フォルダが見つかりません".to_string(),
        ("ja", "reserved_system_shortcut") => "このショートカットはシステムで予約されています".to_string(),
        ("ja", "used_by_hammerspoon") => "このショートカットはHammerspoonで使用中です".to_string(),
        ("ja", "invalid_shortcut_format") => "ショートカットの形式が無効です".to_string(),
        ("ja", "empty") => "空です".to_string(),
        ("ja", "cannot_register_shortcut") => "このショートカットは登録できません".to_string(),
        ("ja", "choose_templates_folder_title") => format!("{APP_NAME} のテンプレートフォルダを選択"),
        ("en", "folder_not_found") => "Folder not found".to_string(),
        ("en", "reserved_system_shortcut") => "Reserved system shortcut".to_string(),
        ("en", "used_by_hammerspoon") => "Used by Hammerspoon".to_string(),
        ("en", "invalid_shortcut_format") => "Invalid shortcut format".to_string(),
        ("en", "empty") => "Empty".to_string(),
        ("en", "cannot_register_shortcut") => "Cannot register this shortcut".to_string(),
        ("en", "choose_templates_folder_title") => format!("Choose {APP_NAME} Templates Folder"),
        _ => key.to_string(),
    }
}

fn already_bound_to(title: &str) -> String {
    if UI_LOCALE == "ja" {
        format!("すでに割り当て済みです: {title}")
    } else {
        format!("Already bound to: {title}")
    }
}

fn normalize_shortcut(input: &str) -> String {
    input.trim().to_string()
}

fn parse_shortcut(input: &str) -> Result<Shortcut, String> {
    input
        .parse::<Shortcut>()
        .map_err(|_| ui_text("invalid_shortcut_format"))
}

fn system_shortcuts(main_shortcut: &str) -> Vec<String> {
    vec![
        normalize_shortcut(main_shortcut),
        "CommandOrControl+C".into(),
        "CommandOrControl+V".into(),
        "CommandOrControl+X".into(),
        "CommandOrControl+A".into(),
        "CommandOrControl+Z".into(),
        "CommandOrControl+Q".into(),
        "CommandOrControl+W".into(),
        "CommandOrControl+Tab".into(),
        "CommandOrControl+S".into(),
        "Alt+Tab".into(),
        "Alt+F4".into(),
    ]
}

fn parse_hammerspoon_hotkeys() -> Vec<String> {
    let home = match std::env::var_os("HOME") {
        Some(home) => PathBuf::from(home),
        None => return Vec::new(),
    };
    let init_path = home.join(".hammerspoon").join("init.lua");
    let lua = match fs::read_to_string(init_path) {
        Ok(lua) => lua,
        Err(_) => return Vec::new(),
    };

    let mod_map = [
        ("cmd", "Command"),
        ("alt", "Alt"),
        ("shift", "Shift"),
        ("ctrl", "Control"),
    ];
    let direct_re = Regex::new(r#"hs\.hotkey\.bind\(\s*\{([^}]*)\}\s*,\s*"([^"]+)""#).unwrap();
    let var_mod_re = Regex::new(r#"local\s+(\w+)\s*=\s*\{([^}]*)\}"#).unwrap();
    let var_key_re = Regex::new(r#"local\s+(\w+)\s*=\s*"([^"]+)""#).unwrap();
    let var_bind_re = Regex::new(r#"hs\.hotkey\.bind\(\s*(\w+)\s*,\s*(\w+)\s*,"#).unwrap();

    let mut hotkeys = Vec::new();

    for captures in direct_re.captures_iter(&lua) {
        if let Some(shortcut) = format_hammerspoon_shortcut(&captures[1], &captures[2], &mod_map) {
            hotkeys.push(shortcut);
        }
    }

    let mut var_mods = HashMap::new();
    let mut var_keys = HashMap::new();

    for captures in var_mod_re.captures_iter(&lua) {
        var_mods.insert(captures[1].to_string(), captures[2].to_string());
    }

    for captures in var_key_re.captures_iter(&lua) {
        var_keys.insert(captures[1].to_string(), captures[2].to_string());
    }

    for captures in var_bind_re.captures_iter(&lua) {
        let Some(mods) = var_mods.get(&captures[1].to_string()) else {
            continue;
        };
        let Some(key) = var_keys.get(&captures[2].to_string()) else {
            continue;
        };
        if let Some(shortcut) = format_hammerspoon_shortcut(mods, key, &mod_map) {
            hotkeys.push(shortcut);
        }
    }

    hotkeys
}

fn format_hammerspoon_shortcut(
    mods_src: &str,
    key_src: &str,
    mod_map: &[(&str, &str)],
) -> Option<String> {
    let mut mods = Vec::new();
    for (lua_name, display_name) in mod_map {
        if mods_src.contains(&format!("\"{lua_name}\"")) {
            mods.push((*display_name).to_string());
        }
    }

    if mods.is_empty() {
        return None;
    }

    let mut key = key_src.to_string();
    if key.len() == 1 {
        key = key.to_uppercase();
    } else if key.to_lowercase().starts_with('f') {
        key = key.to_uppercase();
    }

    mods.push(key);
    Some(mods.join("+"))
}

fn clean_template_content(raw: &str) -> String {
    let mut text = raw.replace("\r\n", "\n").trim_start_matches('\u{feff}').to_string();
    if let Some(rest) = text.strip_prefix("# ") {
        if let Some(idx) = rest.find('\n') {
            text = rest[idx + 1..].trim_start_matches('\n').to_string();
        }
    }
    if let Some(idx) = Regex::new(r"(?im)^##\s+Relacionado\b")
        .unwrap()
        .find(&text)
        .map(|m| m.start())
    {
        text.truncate(idx);
    }
    text.trim().to_string()
}

fn walk_template_files(dir: &Path, output: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            walk_template_files(&path, output);
            continue;
        }

        let Some(ext) = path.extension().and_then(|value| value.to_str()) else {
            continue;
        };
        if ["md", "txt"].contains(&ext.to_lowercase().as_str()) {
            output.push(path);
        }
    }
}

fn load_templates_from_dir(dir: &Path) -> Vec<TemplateItem> {
    let mut files = Vec::new();
    walk_template_files(dir, &mut files);

    files
        .into_iter()
        .filter_map(|file_path| {
            let raw = fs::read_to_string(&file_path).ok()?;
            let ext = file_path
                .extension()
                .and_then(|value| value.to_str())
                .unwrap_or_default()
                .to_lowercase();
            let body = if ext == "txt" {
                raw.trim().to_string()
            } else {
                clean_template_content(&raw)
            };
            if body.is_empty() {
                return None;
            }

            let title = file_path
                .file_stem()
                .and_then(|value| value.to_str())
                .unwrap_or_default()
                .to_string();
            let relative_path = file_path
                .strip_prefix(dir)
                .ok()?
                .to_string_lossy()
                .replace('\\', "/");
            let category = Path::new(&relative_path)
                .parent()
                .and_then(|value| value.iter().next())
                .map(|value| value.to_string_lossy().to_string())
                .unwrap_or_default();
            let preview = body.replace('\n', " ").chars().take(120).collect::<String>();

            Some(TemplateItem {
                id: relative_path.clone(),
                title,
                body,
                path: file_path.display().to_string(),
                relative_path,
                category,
                preview,
            })
        })
        .collect()
}

fn list_template_folders(app: &AppHandle<Wry>) -> Vec<String> {
    let root = templates_root_dir(app);
    let Ok(entries) = fs::read_dir(root) else {
        return Vec::new();
    };

    let mut folders: Vec<String> = entries
        .flatten()
        .filter(|entry| entry.path().is_dir())
        .filter_map(|entry| entry.file_name().into_string().ok())
        .collect();
    folders.sort();
    folders
}

fn initialize_state(app: &AppHandle<Wry>) {
    let state = app.state::<AppState>();
    *state.bindings.lock().unwrap() = load_json(&data_path(app, "bindings.json"));
    *state.aliases.lock().unwrap() = load_json(&data_path(app, "aliases.json"));

    let saved_shortcut = load_text(&data_path(app, "main-shortcut"));
    *state.main_shortcut.lock().unwrap() = if saved_shortcut.is_empty() {
        DEFAULT_MAIN_SHORTCUT.to_string()
    } else {
        saved_shortcut
    };
}

fn welcome_should_show(app: &AppHandle<Wry>) -> bool {
    !data_path(app, "welcome-dismissed").exists()
}

fn show_launcher(app: &AppHandle<Wry>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_always_on_top(true);
        let _ = window.set_focus();
        let _ = window.set_always_on_top(false);
        let _ = window.emit("launcher-opened", ());
    }
}

fn show_welcome_window(app: &AppHandle<Wry>) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("welcome") {
        let _ = window.show();
        let _ = window.set_focus();
        return Ok(());
    }

    WebviewWindowBuilder::new(app, "welcome", tauri::WebviewUrl::App("welcome.html".into()))
        .title(if UI_LOCALE == "ja" {
            format!("{APP_NAME} へようこそ")
        } else {
            format!("{APP_NAME} Welcome")
        })
        .inner_size(720.0, 820.0)
        .resizable(false)
        .minimizable(false)
        .maximizable(false)
        .always_on_top(true)
        .build()?;

    Ok(())
}

fn show_about_window(app: &AppHandle<Wry>) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("about") {
        let _ = window.show();
        let _ = window.set_focus();
        return Ok(());
    }

    WebviewWindowBuilder::new(app, "about", tauri::WebviewUrl::App("about.html".into()))
        .title(if UI_LOCALE == "ja" {
            format!("{APP_NAME} について")
        } else {
            format!("About {APP_NAME}")
        })
        .inner_size(360.0, 250.0)
        .resizable(false)
        .minimizable(false)
        .maximizable(false)
        .build()?;

    Ok(())
}

#[cfg(target_os = "macos")]
fn build_app_menu(app: &AppHandle<Wry>) -> tauri::Result<()> {
    let app_menu = SubmenuBuilder::new(app, APP_NAME)
        .text("about", format!("About {APP_NAME}"))
        .separator()
        .services()
        .separator()
        .hide()
        .hide_others()
        .show_all()
        .separator()
        .quit()
        .build()?;

    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .build()?;

    let window_menu = SubmenuBuilder::new(app, "Window")
        .minimize()
        .maximize()
        .separator()
        .close_window()
        .build()?;

    let menu = MenuBuilder::new(app)
        .items(&[&app_menu, &edit_menu, &window_menu])
        .build()?;
    app.set_menu(menu)?;
    app.on_menu_event(move |app_handle, event| {
        if event.id().0 == "about" {
            let _ = show_about_window(app_handle);
        }
    });
    Ok(())
}

#[cfg(not(target_os = "macos"))]
fn build_app_menu(_app: &AppHandle<Wry>) -> tauri::Result<()> {
    Ok(())
}

fn handle_global_shortcut(app: &AppHandle<Wry>, triggered: &Shortcut) {
    let state = app.state::<AppState>();
    let main_shortcut = state.main_shortcut.lock().unwrap().clone();

    if parse_shortcut(&main_shortcut)
        .map(|shortcut| shortcut == *triggered)
        .unwrap_or(false)
    {
        show_launcher(app);
        return;
    }

    let bindings = state.bindings.lock().unwrap().clone();
    let binding = bindings
        .iter()
        .find(|(shortcut, _)| {
            parse_shortcut(shortcut)
                .map(|parsed| parsed == *triggered)
                .unwrap_or(false)
        })
        .map(|(_, binding)| binding.clone());

    if let Some(binding) = binding {
        let _ = app.clipboard().write_text(binding.body.clone());
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.emit("binding-copied", binding.title);
        }
    }
}

fn register_all_shortcuts(app: &AppHandle<Wry>) -> Result<(), String> {
    let state = app.state::<AppState>();
    let main_shortcut = state.main_shortcut.lock().unwrap().clone();
    let bindings = state.bindings.lock().unwrap().clone();
    let manager = app.global_shortcut();

    let _ = manager.unregister_all();

    let parsed_main = parse_shortcut(&main_shortcut)?;
    manager
        .register(parsed_main)
        .map_err(|err| err.to_string())?;

    for shortcut in bindings.keys() {
        if let Ok(parsed) = parse_shortcut(shortcut) {
            let _ = manager.register(parsed);
        }
    }

    Ok(())
}

#[tauri::command]
async fn load_templates(app: AppHandle<Wry>, folder: Option<String>) -> LoadTemplatesResponse {
    let root_dir = templates_root_dir(&app);
    let dir = folder
        .filter(|value| !value.is_empty())
        .map(|folder| root_dir.join(folder))
        .unwrap_or_else(|| root_dir.clone());

    match dir.try_exists() {
        Ok(true) => LoadTemplatesResponse {
            ok: true,
            templates: load_templates_from_dir(&dir),
            root_dir: root_dir.display().to_string(),
            error: None,
        },
        Ok(false) | Err(_) => LoadTemplatesResponse {
            ok: false,
            templates: Vec::new(),
            root_dir: root_dir.display().to_string(),
            error: Some(ui_text("folder_not_found")),
        },
    }
}

#[tauri::command]
async fn list_folders(app: AppHandle<Wry>) -> Vec<String> {
    list_template_folders(&app)
}

#[tauri::command]
async fn get_ui_locale() -> String {
    UI_LOCALE.to_string()
}

#[tauri::command]
async fn get_templates_root(app: AppHandle<Wry>) -> TemplatesRootInfo {
    templates_root_info(&app)
}

#[tauri::command]
async fn set_templates_root(app: AppHandle<Wry>, folder: Option<String>) -> Result<TemplatesRootInfo, String> {
    let Some(folder) = folder.filter(|value| !value.trim().is_empty()) else {
        save_text(&data_path(&app, "templates-root"), "")?;
        return Ok(templates_root_info(&app));
    };

    let resolved = PathBuf::from(folder.trim());
    if !resolved.is_dir() {
        return Err(ui_text("folder_not_found"));
    }

    save_text(&data_path(&app, "templates-root"), &resolved.display().to_string())?;
    Ok(templates_root_info(&app))
}

#[tauri::command]
async fn choose_templates_root(window: Window, app: AppHandle<Wry>) -> ChooseTemplatesRootResponse {
    let current = templates_root_dir(&app);
    let result = window
        .dialog()
        .file()
        .set_title(ui_text("choose_templates_folder_title"))
        .set_directory(&current)
        .set_can_create_directories(true)
        .blocking_pick_folder();

    let Some(folder) = result.and_then(|path| path.into_path().ok()) else {
        let info = templates_root_info(&app);
        return ChooseTemplatesRootResponse {
            ok: false,
            canceled: true,
            path: info.path,
            custom: info.custom,
            fallback: info.fallback,
            error: None,
        };
    };

    let save_result = save_text(&data_path(&app, "templates-root"), &folder.display().to_string());
    let info = templates_root_info(&app);
    ChooseTemplatesRootResponse {
        ok: save_result.is_ok(),
        canceled: false,
        path: info.path,
        custom: info.custom,
        fallback: info.fallback,
        error: save_result.err(),
    }
}

#[tauri::command]
async fn get_selected_folder(app: AppHandle<Wry>) -> String {
    load_text(&data_path(&app, "selected-folder"))
}

#[tauri::command]
async fn set_selected_folder(app: AppHandle<Wry>, folder: Option<String>) -> Result<GenericResponse, String> {
    save_text(&data_path(&app, "selected-folder"), folder.as_deref().unwrap_or(""))?;
    Ok(GenericResponse { ok: true })
}

#[tauri::command]
async fn copy_text(app: AppHandle<Wry>, text: String) -> Result<GenericResponse, String> {
    app.clipboard()
        .write_text(text)
        .map_err(|err| err.to_string())?;
    Ok(GenericResponse { ok: true })
}

#[tauri::command]
async fn resize_window(window: Window, result_count: usize, editor_open: bool) -> Result<(), String> {
    let mut height = BASE_HEIGHT;
    if result_count > 0 && !editor_open {
        height += (result_count.min(MAX_VISIBLE_RESULTS) as f64) * RESULT_ITEM_HEIGHT + 2.0;
    }
    if editor_open {
        height = EDITOR_HEIGHT;
    }

    window
        .set_size(LogicalSize::new(WIN_WIDTH, height))
        .map_err(|err| err.to_string())
}

#[tauri::command]
fn validate_shortcut(
    app: AppHandle<Wry>,
    state: State<'_, AppState>,
    shortcut: String,
    current_template_id: Option<String>,
) -> ShortcutValidationResponse {
    let shortcut = normalize_shortcut(&shortcut);
    if shortcut.is_empty() {
        return ShortcutValidationResponse {
            valid: false,
            error: String::new(),
        };
    }

    let main_shortcut = state.main_shortcut.lock().unwrap().clone();
    if system_shortcuts(&main_shortcut).contains(&shortcut) {
        return ShortcutValidationResponse {
            valid: false,
            error: ui_text("reserved_system_shortcut"),
        };
    }

    let hammerspoon = parse_hammerspoon_hotkeys();
    if hammerspoon.contains(&shortcut) {
        return ShortcutValidationResponse {
            valid: false,
            error: ui_text("used_by_hammerspoon"),
        };
    }

    let bindings = state.bindings.lock().unwrap();
    if let Some(binding) = bindings.get(&shortcut) {
        if Some(binding.id.clone()) != current_template_id {
            return ShortcutValidationResponse {
                valid: false,
                error: already_bound_to(&binding.title),
            };
        }
    }
    drop(bindings);

    let parsed = match parse_shortcut(&shortcut) {
        Ok(parsed) => parsed,
        Err(error) => {
            return ShortcutValidationResponse {
                valid: false,
                error,
            }
        }
    };

    let manager = app.global_shortcut();
    let is_valid = manager.register(parsed.clone()).is_ok();
    let _ = manager.unregister(parsed);
    let _ = register_all_shortcuts(&app);

    if is_valid {
        ShortcutValidationResponse {
            valid: true,
            error: String::new(),
        }
    } else {
        ShortcutValidationResponse {
            valid: false,
            error: ui_text("invalid_shortcut_format"),
        }
    }
}

#[tauri::command]
async fn save_binding(
    app: AppHandle<Wry>,
    state: State<'_, AppState>,
    shortcut: String,
    template_data: Binding,
) -> Result<GenericResponse, String> {
    let shortcut = normalize_shortcut(&shortcut);
    let mut bindings = state.bindings.lock().unwrap();
    bindings.retain(|_, value| value.id != template_data.id);
    bindings.insert(shortcut, template_data);
    save_json(&data_path(&app, "bindings.json"), &*bindings)?;
    drop(bindings);
    register_all_shortcuts(&app)?;
    Ok(GenericResponse { ok: true })
}

#[tauri::command]
async fn remove_binding(
    app: AppHandle<Wry>,
    state: State<'_, AppState>,
    template_id: String,
) -> Result<GenericResponse, String> {
    let mut bindings = state.bindings.lock().unwrap();
    bindings.retain(|_, value| value.id != template_id);
    save_json(&data_path(&app, "bindings.json"), &*bindings)?;
    drop(bindings);
    register_all_shortcuts(&app)?;
    Ok(GenericResponse { ok: true })
}

#[tauri::command]
fn get_bindings(state: State<'_, AppState>) -> HashMap<String, Binding> {
    state.bindings.lock().unwrap().clone()
}

#[tauri::command]
async fn save_alias(
    app: AppHandle<Wry>,
    state: State<'_, AppState>,
    template_id: String,
    alias: String,
) -> Result<GenericResponse, String> {
    let mut aliases = state.aliases.lock().unwrap();
    if alias.trim().is_empty() {
        aliases.remove(&template_id);
    } else {
        aliases.insert(template_id, alias.trim().to_string());
    }
    save_json(&data_path(&app, "aliases.json"), &*aliases)?;
    Ok(GenericResponse { ok: true })
}

#[tauri::command]
fn get_aliases(state: State<'_, AppState>) -> HashMap<String, String> {
    state.aliases.lock().unwrap().clone()
}

#[tauri::command]
fn get_main_shortcut(state: State<'_, AppState>) -> String {
    state.main_shortcut.lock().unwrap().clone()
}

#[tauri::command]
async fn save_main_shortcut(
    app: AppHandle<Wry>,
    state: State<'_, AppState>,
    shortcut: String,
) -> Result<GenericResponse, String> {
    let shortcut = normalize_shortcut(&shortcut);
    if shortcut.is_empty() {
        return Err(ui_text("empty"));
    }

    let parsed = parse_shortcut(&shortcut)?;
    let manager = app.global_shortcut();
    manager
        .register(parsed.clone())
        .map_err(|_| ui_text("cannot_register_shortcut"))?;
    let _ = manager.unregister(parsed);

    *state.main_shortcut.lock().unwrap() = shortcut.clone();
    save_text(&data_path(&app, "main-shortcut"), &shortcut)?;
    register_all_shortcuts(&app)?;
    Ok(GenericResponse { ok: true })
}

#[tauri::command]
async fn dismiss_welcome(app: AppHandle<Wry>) -> Result<GenericResponse, String> {
    save_text(&data_path(&app, "welcome-dismissed"), "1")?;
    Ok(GenericResponse { ok: true })
}

#[tauri::command]
async fn get_theme(app: AppHandle<Wry>) -> String {
    let theme = load_text(&data_path(&app, "theme"));
    if theme.is_empty() {
        "dark".to_string()
    } else {
        theme
    }
}

#[tauri::command]
async fn set_theme(app: AppHandle<Wry>, theme: String) -> Result<GenericResponse, String> {
    save_text(&data_path(&app, "theme"), &theme)?;
    Ok(GenericResponse { ok: true })
}

#[tauri::command]
async fn close_current_window(window: Window) -> Result<(), String> {
    window.close().map_err(|err| err.to_string())
}

#[tauri::command]
async fn get_about_metadata() -> AboutMetadata {
    AboutMetadata {
        name: APP_NAME.to_string(),
        version: APP_VERSION.to_string(),
        locale: UI_LOCALE.to_string(),
    }
}

#[tauri::command]
async fn show_about_window_command(app: AppHandle<Wry>) -> Result<(), String> {
    show_about_window(&app).map_err(|err| err.to_string())
}

#[tauri::command]
async fn get_platform() -> String {
    std::env::consts::OS.to_string()
}
