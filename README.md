# CacheCat 🐱

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-CacheCat-4285F4?logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/cachecat/kkfchdmglcngekkddkeljllfgdpbodgd)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

[![Available in the Chrome Web Store](https://developer.chrome.com/static/docs/webstore/branding/image/HRs9MPufa1J1h5glNhut.png)](https://chromewebstore.google.com/detail/cachecat/kkfchdmglcngekkddkeljllfgdpbodgd)

<a href="https://www.producthunt.com/products/cachecat?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-cachecat" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1040153&theme=light&t=1763615107572" alt="CacheCat - Unified&#0032;dashboard&#0032;for&#0032;all&#0032;website&#0032;storage&#0032;management | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>

A powerful Chrome Extension (Manifest V3) that provides a full-tab dashboard to view, edit, and manage website storage. Perfect for developers, QA testers, and power users.

## ✨ Features

- **Complete Storage Management**: View and edit Cookies, Local Storage, Session Storage, IndexedDB, and Cache Storage
- **Modern Dashboard**: Beautiful, intuitive interface with light/dark theme support
- **Developer-Friendly**: Perfect for debugging, testing, and managing web application storage
- **No DevTools Required**: Standalone dashboard that works independently
- **Multiple Dashboards**: Open multiple dashboards for different websites simultaneously

## 🚀 Quick Start

### Installation

**Option 1: Install from Chrome Web Store (Recommended)**

1. Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/cachecat/kkfchdmglcngekkddkeljllfgdpbodgd)
2. Click "Add to Chrome"
3. Confirm installation
4. Done! The extension is ready to use.

**Option 2: Manual Installation (For Development)**

1. **Clone the repository**:

   ```bash
   git clone https://github.com/chinmay29hub/CacheCat.git
   cd CacheCat
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Build the extension**:

   ```bash
   npm run build
   ```

4. **Load in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `dist/` directory

### Usage

1. Navigate to a website you want to inspect (e.g., `https://github.com`)
2. Click the CacheCat extension icon in your toolbar
3. Dashboard opens automatically attached to that website
4. Navigate between storage types using the left sidebar:
   - 🍪 Cookies
   - 💾 Local Storage
   - 📝 Session Storage
   - 🗄️ IndexedDB
   - ⚡ Cache Storage

## 📋 What You Can Do

### Cookies

- View all cookies with full details (name, value, domain, path, expiry, flags)
- Add, edit, and delete cookies
- Mask/unmask sensitive values
- HttpOnly cookies visible and editable

### Local Storage

- Key/value table with inline editing
- JSON pretty-view and validation
- Import/Export JSON
- Clear all with confirmation

### Session Storage

- Same features as Local Storage
- Explicitly tied to the attached tab
- Labeled "This tab only"

### IndexedDB

- Database → Object Store → Index hierarchy
- Paginated record listing
- Search by key or JSON path
- CRUD operations on records
- Export store (JSON array)
- Clear store with confirmation

### Cache Storage

- List all caches
- View entries with request/response details
- Preview response headers and body
- Delete individual entries
- Refetch and replace entries
- Delete entire cache with confirmation

## 🛠️ Development

### Recommended Workflow

1. **Start watch mode** (rebuilds on file changes):

   ```bash
   npm run dev
   ```

2. **Load extension in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" → Select `dist/` folder
   - **Keep this tab open** for quick reloads

3. **Make changes** to files in `src/`

4. **Reload extension** after each build:
   - Click the reload icon (🔄) on the CacheCat extension card
   - Or use keyboard shortcut: `Ctrl+R` (Windows/Linux) or `Cmd+R` (Mac)

5. **Test changes**:
   - Open a test website (e.g., `github.com`)
   - Click the extension icon
   - Verify your changes work

### Development Tips

**Fast Iteration:**

- Keep `npm run dev` running in a terminal
- Keep `chrome://extensions/` tab open for quick reloads
- Use browser DevTools for debugging

**Debugging:**

- **Dashboard**: Right-click dashboard tab → "Inspect" (React DevTools recommended)
- **Background**: `chrome://extensions/` → Find CacheCat → Click "service worker" link
- **Agent/Content**: Open DevTools on the target website → Check Console

**Code Quality:**

```bash
# Check for errors
npm run lint

# Auto-fix issues
npm run lint -- --fix

# Format code
npm run format
```

### Scripts

- `npm run dev` - Watch mode (auto-rebuild on changes)
- `npm run build` - Production build
- `npm run lint` - Check code quality
- `npm run format` - Format code with Prettier

For detailed development and contribution guide, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## 📁 Project Structure

```
CacheCat/
├── src/
│   ├── background/     # Service worker
│   ├── content/        # Content script bridge
│   ├── agent/          # Page context script
│   └── dashboard/       # React dashboard app
├── icons/              # Extension icons (PNG)
├── dist/               # Build output
├── manifest.json       # Extension manifest
└── vite.config.js      # Build configuration
```

## 🔧 Tech Stack

- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Chrome Extension APIs** - Storage access

## 📝 Permissions

CacheCat requires the following permissions to function:

- **`host_permissions: ["<all_urls>"]`** - Access storage on any website you want to inspect
- **`permissions: ["cookies", "scripting", "activeTab", "alarms"]`** - Read/modify cookies, inject scripts, access active tab, schedule background tasks

### Privacy & Security

🔒 **100% Local Operation** - All data stays on your device. No collection, no transmission, no tracking.

- ✅ No data is collected or transmitted
- ✅ No external API calls
- ✅ No analytics or tracking
- ✅ All operations happen locally in your browser

**Why these permissions?**

- Storage access is only used when you explicitly click the extension icon on a website
- All operations are performed locally - nothing leaves your computer
- Perfect for developers debugging their own applications

See our [Privacy Policy](https://cachecat.vercel.app/privacy-policy.html) for complete privacy details.

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on:

- Development setup
- Code style guidelines
- Pull request process
- Testing requirements

Contributions of all kinds are welcome - bug fixes, features, documentation, and more!

## 📄 License

MIT
