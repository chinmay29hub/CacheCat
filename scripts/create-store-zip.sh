#!/bin/bash

# Script to create Chrome Web Store zip file
# Usage: ./scripts/create-store-zip.sh

set -e

echo "📦 Creating Chrome Web Store zip file..."
echo ""

# Check if dist folder exists
if [ ! -d "dist" ]; then
  echo "❌ Error: dist/ folder not found!"
  echo "   Run 'npm run build' first"
  exit 1
fi

# Verify required files exist
echo "🔍 Verifying required files..."
REQUIRED_FILES=("manifest.json" "background.js" "content.js" "agent.js" "dashboard.html")
MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "dist/$file" ]; then
    MISSING_FILES+=("$file")
  fi
done

if [ ${#MISSING_FILES[@]} -ne 0 ]; then
  echo "❌ Error: Missing required files:"
  for file in "${MISSING_FILES[@]}"; do
    echo "   - $file"
  done
  echo "   Run 'npm run build' first"
  exit 1
fi

# Check for icons folder
if [ ! -d "dist/icons" ]; then
  echo "❌ Error: dist/icons/ folder not found!"
  exit 1
fi

# Check for assets folder
if [ ! -d "dist/assets" ]; then
  echo "❌ Error: dist/assets/ folder not found!"
  exit 1
fi

echo "✅ All required files found"
echo ""

# Remove old zip if exists
if [ -f "cachecat-extension.zip" ]; then
  echo "🗑️  Removing old zip file..."
  rm cachecat-extension.zip
fi

# Store current directory
PROJECT_ROOT=$(pwd)

# Change to dist directory
cd dist

# Create zip file (exclude src folder and system files)
echo "📝 Creating zip file (excluding src/, system files, and source maps)..."
if zip -r ../cachecat-extension.zip . \
  -x "src/*" \
  -x "src/**/*" \
  -x ".DS_Store" \
  -x "Thumbs.db" \
  -x "*.map" \
  -x ".git/*" \
  -x ".git/**/*" \
  > /dev/null 2>&1; then
  echo "✅ Zip file created"
else
  echo "❌ Error: Failed to create zip file"
  cd "$PROJECT_ROOT"
  exit 1
fi

# Go back to project root
cd "$PROJECT_ROOT"

# Verify zip was created
if [ ! -f "cachecat-extension.zip" ]; then
  echo "❌ Error: Zip file was not created"
  exit 1
fi

# Get zip file size
SIZE=$(du -h cachecat-extension.zip | cut -f1)

# List files in zip for verification
echo ""
echo "📋 Verifying zip contents..."
# Parse unzip -l output: skip header (3 lines), skip footer (2 lines), get filename (4th column)
ZIP_FILES=$(unzip -l cachecat-extension.zip 2>/dev/null | awk 'NR>3 && NF>=4 && $4!="Name" && $4!="----" && $4!="" {print $4}' | grep -v "^$" || true)

# Check for unwanted files
UNWANTED_FOUND=0
if echo "$ZIP_FILES" | grep -q "^src/"; then
  echo "⚠️  Warning: src/ folder found in zip!"
  UNWANTED_FOUND=1
fi

if echo "$ZIP_FILES" | grep -q "\.map$"; then
  echo "⚠️  Warning: Source map files found in zip!"
  UNWANTED_FOUND=1
fi

# Verify required files are in zip
echo ""
echo "✅ Verifying required files in zip..."
for file in "${REQUIRED_FILES[@]}"; do
  if echo "$ZIP_FILES" | grep -qE "^$file$|^$file/"; then
    echo "   ✓ $file"
  else
    echo "   ✗ $file (MISSING!)"
    UNWANTED_FOUND=1
  fi
done

# Check for icons (exclude directory entry, count actual files)
ICON_FILES=$(echo "$ZIP_FILES" | grep "^icons/" | grep -v "^icons/$" || true)
ICON_COUNT=$(echo "$ICON_FILES" | grep -c . || echo "0")
if [ "$ICON_COUNT" -ge 3 ]; then
  echo "   ✓ icons/ ($ICON_COUNT files)"
else
  echo "   ✗ icons/ (Expected at least 3 files, found $ICON_COUNT)"
  UNWANTED_FOUND=1
fi

# Check for assets (exclude directory entry, count actual files)
ASSET_FILES=$(echo "$ZIP_FILES" | grep "^assets/" | grep -v "^assets/$" || true)
ASSET_COUNT=$(echo "$ASSET_FILES" | grep -c . || echo "0")
if [ "$ASSET_COUNT" -ge 1 ]; then
  echo "   ✓ assets/ ($ASSET_COUNT files)"
else
  echo "   ✗ assets/ (Expected at least 1 file, found $ASSET_COUNT)"
  UNWANTED_FOUND=1
fi

echo ""
if [ $UNWANTED_FOUND -eq 1 ]; then
  echo "⚠️  Warnings found! Please review the zip file before uploading."
  echo ""
fi

echo "✅ Chrome Web Store zip created successfully!"
echo "📦 File: $(pwd)/cachecat-extension.zip"
echo "📊 Size: $SIZE"
echo ""
# Count total files (excluding directory entries)
TOTAL_FILES=$(echo "$ZIP_FILES" | grep -v "/$" | wc -l | tr -d ' ')

echo "📝 Summary:"
if [ $UNWANTED_FOUND -eq 0 ]; then
  echo "   - Required files: ✓"
else
  echo "   - Required files: ⚠️  (see warnings above)"
fi
echo "   - Icons: $ICON_COUNT files"
echo "   - Assets: $ASSET_COUNT files"
echo "   - Total files in zip: $TOTAL_FILES"
echo ""
echo "🚀 Ready to upload to Chrome Web Store!"

