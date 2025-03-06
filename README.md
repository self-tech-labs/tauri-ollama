# Ollama Document Anonymization

A desktop application that guides legal professionals through using Ollama for document anonymization. This application provides a step-by-step tutorial for installing Ollama, downloading a lightweight AI model, and using it to anonymize legal documents - all while ensuring data privacy by processing everything locally.

## Features

- **Multi-step Tutorial Flow**: Guides users through the entire process
- **System Compatibility Check**: Detects OS and architecture
- **Ollama Installation Guide**: Provides OS-specific installation instructions
- **Model Selection**: Recommends models based on system capabilities
- **Document Anonymization**: Processes documents locally with no data sharing
- **Privacy-Focused**: All processing happens on your device

## Privacy & Security

- **Complete Privacy**: All processing happens locally on your computer
- **No Data Sharing**: Your documents never leave your device
- **Advanced AI**: Uses state-of-the-art language models for accurate anonymization
- **Easy to Use**: Step-by-step guidance for non-technical users

## Technical Details

- Built with Tauri, React, and TypeScript
- Uses Chakra UI for the interface
- Integrates with the Ollama API for local AI processing
- Cross-platform support (Windows, macOS, Linux)

## Getting Started

### Prerequisites

- Node.js and npm
- Rust and Cargo

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run tauri dev
   ```

### Building

To build the application for production:

```
npm run tauri build
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Tauri](https://tauri.app/) for the framework
- [Ollama](https://ollama.com/) for the local AI capabilities
- [Chakra UI](https://chakra-ui.com/) for the UI components
