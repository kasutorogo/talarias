#!/bin/bash
# Template Launcher - macOS installer
# Run: bash install-mac.sh

set -e

echo "=== Template Launcher - macOS Installer ==="
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
  echo "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  # Add Homebrew to PATH for Apple Silicon
  if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
else
  echo "Homebrew: OK"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Installing Node.js..."
  brew install node
else
  echo "Node.js: OK ($(node -v))"
fi

# Install dependencies
echo "Installing dependencies..."
cd "$(dirname "$0")"
npm install

echo ""
echo "=== Installation complete ==="
echo ""
echo "To start the app, run:"
echo "  cd $(pwd) && npm start"
echo ""
echo "Shortcut: Alt+Shift+Z (brings the app to front)"
echo ""
