# Contributing to CacheCat

Thank you for your interest in contributing to CacheCat! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

We welcome contributions of all kinds:

- 🐛 Bug reports
- 💡 Feature suggestions
- 📝 Documentation improvements
- 🔧 Code contributions
- 🎨 UI/UX improvements
- 🧪 Testing improvements

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Code Style](#code-style)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Architecture](#architecture)

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Respect different viewpoints and experiences

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- Chrome/Chromium browser
- Code editor (VS Code recommended)
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/CacheCat.git
cd CacheCat
```

3. Add upstream remote:

```bash
git remote add upstream https://github.com/chinmay29hub/CacheCat.git
```

## 🛠️ Development Setup

### Initial Setup

```bash
# Install dependencies
npm install

# Build once to create dist/
npm run build
```

### Load Extension in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist/` folder
5. **Keep this tab open** - you'll reload here frequently

## 🔄 Development Workflow

### Daily Development

1. **Start watch mode** (rebuilds on file changes):

```bash
npm run dev
```

2. **Make changes** to files in `src/`

3. **Reload extension** after each build:
   - Go to `chrome://extensions/`
   - Click the reload icon (🔄) on the CacheCat extension card
   - Or use keyboard shortcut: `Ctrl+R` (Windows/Linux) or `Cmd+R` (Mac)

4. **Test changes**:
   - Open a test website (e.g., `github.com`)
   - Click the extension icon
   - Verify your changes work

### Reloading Strategy

**After code changes:**

- **Dashboard changes**: Reload extension → Reload dashboard tab
- **Background script changes**: Reload extension → Background service worker auto-restarts
- **Agent/Content script changes**: Reload extension → Reload target website tab

**Quick reload shortcut:**

- In `chrome://extensions/`, focus the extension card and press `R` (or click reload icon)

## 🐛 Debugging

### Dashboard (React App)

1. Open dashboard tab
2. Right-click → "Inspect"
3. Use React DevTools extension for component inspection
4. Console shows React errors and logs

**React DevTools:**

- Install [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) extension
- Inspect component tree, props, state, and hooks

### Background Script (Service Worker)

1. Go to `chrome://extensions/`
2. Find CacheCat extension
3. Click "service worker" link (opens DevTools)
4. Console shows background script logs
5. **Note**: Service worker may sleep - click "service worker" again to wake it

**Common Issues:**

- Service worker stopped: Click "service worker" link to restart
- Changes not reflecting: Reload extension after rebuild

### Agent Script (Page Context)

1. Open DevTools on the target website
2. Agent script runs in page context
3. Check Console for agent messages
4. Look for `__CACHECAT_AGENT__` in page context

**Testing Agent:**

```javascript
// In website console
window.__CACHECAT_AGENT__; // Should exist if agent is injected
```

### Content Script (Bridge)

1. Open DevTools on the target website
2. Content script logs appear in website's console
3. Messages between agent and background are logged here

## ✏️ Making Changes

### Before You Start

1. **Check existing issues** to see if someone is already working on it
2. **Create an issue** for significant changes to discuss the approach
3. **Fork and create a branch** from `main`:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### Common Development Tasks

#### Adding a New Storage View

1. Create component in `src/dashboard/views/`
2. Add route in `src/dashboard/App.jsx`
3. Add nav item in `src/dashboard/components/Sidebar.jsx`
4. Rebuild and test

#### Modifying Background Script

1. Edit `src/background/background.js`
2. Rebuild (`npm run dev` auto-rebuilds)
3. Reload extension in Chrome
4. Background service worker restarts automatically

#### Styling Changes

1. Edit Tailwind classes in components
2. Or modify `src/dashboard/index.css`
3. Rebuild and reload dashboard tab

#### Adding New Chrome API

1. Check if permission needed in `manifest.json`
2. Use API in appropriate script (background/agent/content)
3. Rebuild and reload extension

## 📤 Submitting Changes

### Before Submitting

1. **Update your fork:**

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

2. **Run linting and formatting:**

```bash
# Check for errors
npm run lint

# Auto-fix issues
npm run lint -- --fix

# Format code
npm run format
```

3. **Test your changes:**
   - Extension loads without errors
   - Dashboard opens correctly
   - Can attach to a website
   - Storage data loads correctly
   - CRUD operations work
   - Theme toggle works
   - No console errors

### Commit Messages

Write clear, descriptive commit messages:

```
feat: Add export functionality to Local Storage view
fix: Resolve IndexedDB pagination issue
docs: Update README with new features
style: Format code with Prettier
refactor: Simplify message passing logic
test: Add tests for cookie operations
```

### Pull Request Process

1. **Push your branch:**

```bash
git push origin feature/your-feature-name
```

2. **Create a Pull Request** on GitHub:
   - Provide a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - Explain what changed and why

3. **Wait for review:**
   - Address any feedback
   - Make requested changes
   - Keep the PR updated with main branch

## 🎨 Code Style

### JavaScript/React

- Use ES6+ features
- Use functional components with hooks
- Follow React best practices
- Use meaningful variable and function names
- Add comments for complex logic

### Formatting

We use Prettier for code formatting:

```bash
npm run format
```

### Linting

We use ESLint for code quality:

```bash
npm run lint
npm run lint -- --fix  # Auto-fix issues
```

### Best Practices

1. **Always use watch mode** (`npm run dev`) during development
2. **Reload extension** after each build
3. **Check console** for errors regularly
4. **Test on multiple websites** to catch edge cases
5. **Use React DevTools** for component debugging
6. **Format code** before committing (`npm run format`)
7. **Lint code** before committing (`npm run lint`)

## 🧪 Testing

### Manual Testing Checklist

After making changes, test:

- [ ] Extension loads without errors
- [ ] Dashboard opens when clicking extension icon
- [ ] Can attach to a website
- [ ] Storage data loads correctly
- [ ] CRUD operations work
- [ ] Theme toggle works
- [ ] No console errors
- [ ] Multiple dashboards work independently

### Testing Different Storage Types

- Test on websites with various storage types
- Test with empty storage
- Test with large amounts of data
- Test edge cases (special characters, very long values, etc.)

## 📁 Project Structure

```
CacheCat/
├── src/
│   ├── background/          # Service worker
│   │   └── background.js   # Handles routing and message passing
│   ├── content/             # Content script bridge
│   │   └── content.js       # Bridge between background and agent
│   ├── agent/               # Page context script
│   │   └── agent.js         # Injected into page - storage access
│   └── dashboard/           # React app
│       ├── components/      # Reusable UI components
│       ├── contexts/       # React contexts (Theme, Attach)
│       ├── views/           # Main views (Cookies, LocalStorage, etc.)
│       ├── App.jsx          # Main app component
│       └── main.jsx         # Entry point
├── icons/                   # Extension icons (PNG)
├── dist/                     # Build output (gitignored)
├── docs/                     # Documentation and demo site
│   └── demo/                # Demo site for testing
├── manifest.json            # Extension manifest
├── vite.config.js           # Build configuration
└── package.json             # Dependencies and scripts
```

## 🏗️ Architecture

### Message Flow

1. **Dashboard → Background**: `chrome.runtime.sendMessage`
2. **Background → Agent**: `chrome.tabs.sendMessage` (via content script)
3. **Agent → Content Script**: `window.postMessage`
4. **Content Script → Background**: `chrome.runtime.sendMessage`

### Storage Access

- **Cookies**: Chrome's `chrome.cookies` API (background script)
- **Local/Session Storage**: Agent script (page context)
- **IndexedDB**: Agent script (page context)
- **Cache Storage**: Agent script (page context)

### Dashboard-to-Tab Mapping

Each dashboard is mapped to a specific website tab:

- When extension icon is clicked, dashboard tab ID is mapped to website tab ID
- All storage operations are routed to the correct tab
- Multiple dashboards can view different websites simultaneously

## 🐛 Troubleshooting

### Extension Won't Load

- Check `dist/` folder exists and has all files
- Verify `manifest.json` is in `dist/`
- Check browser console for errors
- Ensure all required files are present

### Changes Not Appearing

- Make sure you reloaded the extension
- For dashboard changes, reload the dashboard tab too
- Check that build completed successfully
- Verify you're editing files in `src/`, not `dist/`

### Service Worker Not Updating

- Click "service worker" link in extensions page
- Or unload and reload the extension
- Check service worker console for errors

### Storage Data Not Showing

- Verify website has storage data
- Check agent script is injected (look in page console)
- Verify background script is running (check service worker console)
- Check for CORS or permission errors

### Build Errors

- Run `npm run lint` to check for code issues
- Check terminal for build errors
- Verify all dependencies are installed (`npm install`)
- Clear `dist/` and rebuild

## 📚 Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## ❓ Questions?

- Open an issue on GitHub
- Check existing issues and discussions
- Review the codebase and documentation

Thank you for contributing to CacheCat! 🐱
