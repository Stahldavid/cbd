#!/bin/bash
set -e
echo "Installing pnpm globally..."
npm install -g pnpm
echo "Installing curaai dependencies..."
cd curaai && pnpm install
echo "Setup complete!"
