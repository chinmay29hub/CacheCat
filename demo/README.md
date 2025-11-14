# CacheCat Demo Site

This demo site helps you test all storage types supported by the CacheCat Chrome Extension.

## How to Use

1. **Open the demo site:**
   - ⚠️ **Important**: For Cache Storage refetch to work, you MUST serve via HTTP (not file://)
   - Serve it with a local server:
     ```bash
     # Using Python 3 (from project root)
     cd demo
     python3 -m http.server 8000
     # Then visit http://localhost:8000/
     ```
   - Or from project root:
     ```bash
     python3 -m http.server 8000
     # Then visit http://localhost:8000/demo/
     ```

2. **Create storage data:**
   - Click individual buttons to create specific storage types
   - Or click "Create All Storage Types" to populate everything at once

3. **Test with CacheCat:**
   - Click the CacheCat extension icon while on this page
   - The dashboard will open showing all the created storage data
   - You can view, edit, and manage all storage types

## Storage Types Included

- **Cookies**: 5 sample cookies with different attributes
- **Local Storage**: 5 items including strings, objects, and arrays
- **Session Storage**: 5 items that persist only for the session
- **IndexedDB**: 3 databases (2 with inline keys, 1 with out-of-line keys) with multiple object stores and records
- **Cache Storage**: 3 caches with various resource types (JSON, images, static assets)

## Testing Cache Storage Refetch

To properly test the **Refetch** functionality in Cache Storage:

1. **Serve the demo via HTTP** (required for fetch to work):
   ```bash
   cd demo
   python3 -m http.server 8000
   ```

2. **Create cache storage**:
   - Open http://localhost:8000/
   - Click "Create Cache Storage"

3. **Test refetch**:
   - Open CacheCat dashboard
   - Go to Cache Storage view
   - Select `static-assets-v1` cache
   - Find `styles.css` entry
   - Click the 🔄 refetch button
   - The cache will fetch the latest version of `styles.css` from the server

4. **Test updating and refetching**:
   - Modify `demo/styles.css` file (change colors, add styles, etc.)
   - In the dashboard, click 🔄 refetch on `styles.css` again
   - You should see the updated content in the cache

## Features

- Clean, modern UI with gradient background
- Individual buttons for each storage type
- "Create All" button for quick setup
- Status indicators showing success/error states
- Info boxes displaying what was created

