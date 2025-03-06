use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    os: String,
    arch: String,
    ollama_installed: bool,
    ollama_running: bool,
}

// Command to get system information
#[tauri::command]
fn get_system_info() -> SystemInfo {
    let os = std::env::consts::OS.to_string();
    let arch = std::env::consts::ARCH.to_string();
    
    // Check if Ollama is installed
    let ollama_installed = match os.as_str() {
        "macos" => Command::new("sh")
            .arg("-c")
            .arg("which ollama")
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false),
        "linux" => Command::new("sh")
            .arg("-c")
            .arg("which ollama")
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false),
        "windows" => Command::new("cmd")
            .arg("/C")
            .arg("where ollama")
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false),
        _ => false,
    };
    
    // Check if Ollama is running
    let ollama_running = match os.as_str() {
        "macos" | "linux" => Command::new("sh")
            .arg("-c")
            .arg("pgrep -x ollama")
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false),
        "windows" => Command::new("cmd")
            .arg("/C")
            .arg("tasklist | findstr ollama")
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false),
        _ => false,
    };
    
    SystemInfo {
        os,
        arch,
        ollama_installed,
        ollama_running,
    }
}

// Command to check if Ollama API is accessible
#[tauri::command]
async fn check_ollama_api() -> bool {
    let client = reqwest::Client::new();
    let response = client
        .get("http://localhost:11434/api/version")
        .send()
        .await;
    
    match response {
        Ok(res) => res.status().is_success(),
        Err(_) => false,
    }
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_system_info,
            check_ollama_api
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
