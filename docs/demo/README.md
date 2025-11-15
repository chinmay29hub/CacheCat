# CacheCat Demo Site

This demo site helps you test all storage types supported by the CacheCat Chrome Extension.

## How to Use

1. **Install Live Server Extension** (if not already installed):
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
   - Search for "Live Server" by Ritwick Dey
   - Click Install

2. **Open the demo site:**
   - ⚠️ **Important**: For Cache Storage refetch to work, you MUST serve via HTTP (not file://)
   - In VS Code, navigate to the `docs/demo/` folder
   - Right-click on `index.html`
   - Select **"Open with Live Server"**
   - The demo site will open in your default browser at `http://127.0.0.1:5500/docs/demo/` (or similar port)

3. **Create storage data:**
   - Click individual buttons to create specific storage types
   - Or click "Create All Storage Types" to populate everything at once

4. **Test with CacheCat:**
   - Click the CacheCat extension icon while on this page
   - The dashboard will open showing all the created storage data
   - You can view, edit, and manage all storage types

## Storage Types Included

- **Cookies**: 5 sample cookies with different attributes (user_id, session_token, theme, language, preferences)
- **Local Storage**: 5 items including strings, objects, and arrays (username, email, settings, lastLogin, favorites)
- **Session Storage**: 5 items that persist only for the session (sessionId, pageViews, cart, tempData, userActivity)
- **IndexedDB**: 3 databases with sample records:
  - UsersDB: 3 user records
  - ProductsDB: 3 products + 2 categories
  - NotesDB: 3 notes + 3 tags
- **Cache Storage**: 3 caches with various resource types:
  - app-cache-v1: 3 API endpoints
  - images-cache-v1: 2 image files
  - static-assets-v1: 2 static files (styles.css, demo-api.json)

## Testing Cache Storage Refetch

To properly test the **Refetch** functionality in Cache Storage:

1. **Start Live Server** (if not already running):
   - Right-click on `index.html` in the `docs/demo/` folder
   - Select **"Open with Live Server"**
   - The demo site will open in your browser

2. **Create cache storage**:
   - On the demo page, click "Create Cache Storage"
   - Wait for the success message

3. **Test refetch**:
   - Open CacheCat dashboard (click the extension icon)
   - Go to Cache Storage view
   - Select `static-assets-v1` cache
   - Find `styles.css` entry
   - Click the 🔄 refetch button
   - The cache will fetch the latest version of `styles.css` from the server

4. **Test updating and refetching**:
   - In VS Code, modify `docs/demo/styles.css` file (change colors, add styles, etc.)
   - Live Server will automatically reload the page
   - In the CacheCat dashboard, click 🔄 refetch on `styles.css` again
   - You should see the updated content in the cache

**Note**: Live Server automatically reloads the browser when you save files, making it perfect for testing cache refetch functionality!

## Features

- Clean, modern UI with gradient background
- Individual buttons for each storage type
- "Create All" button for quick setup
- Status indicators showing success/error states
- Info boxes displaying what was created
