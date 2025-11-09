#!/bin/bash

# Example: Using diblob-visualizer CLI
# 
# This demonstrates the different ways to use the CLI mode

echo "=== Diblob Visualizer CLI Examples ==="
echo ""

echo "1. Start with default settings (port 3000, localhost):"
echo "   npx diblob-visualizer"
echo ""

echo "2. Start on a custom port:"
echo "   npx diblob-visualizer --port 8080"
echo ""

echo "3. Bind to all interfaces:"
echo "   npx diblob-visualizer --host 0.0.0.0 --port 3000"
echo ""

echo "4. Disable CORS:"
echo "   npx diblob-visualizer --no-cors"
echo ""

echo "5. Show help:"
echo "   npx diblob-visualizer --help"
echo ""

echo "=== Installation ==="
echo ""
echo "Global installation:"
echo "   npm install -g @speajus/diblob-visualizer"
echo "   diblob-visualizer --port 8080"
echo ""

echo "Local installation:"
echo "   npm install @speajus/diblob-visualizer"
echo "   npx diblob-visualizer"
echo ""

echo "=== Usage Notes ==="
echo ""
echo "The CLI mode serves a standalone visualizer interface."
echo "It's useful for:"
echo "  - Quick visualization without setting up a server"
echo "  - Development and debugging"
echo "  - Sharing visualizations with team members"
echo ""
echo "The visualizer will be available at http://localhost:<port>"
echo ""

