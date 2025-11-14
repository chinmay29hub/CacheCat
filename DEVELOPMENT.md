# Development Guide

Complete guide for developing CacheCat Chrome Extension.

## Prerequisites

- Node.js 20+ and npm
- Chrome/Chromium browser
- Code editor (VS Code recommended)

## Initial Setup

```bash
# Install dependencies
npm install

# Build once to create dist/
npm run build
```

## Daily Development Workflow

### 1. Start Watch Mode

**Terminal 1 - Watch Mode:**

```bash
npm run dev
```

This watches for file changes and automatically rebuilds.

### 2. Load Extension in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist/` folder
5. **Keep this tab open** - you'll reload here frequently

### 3. Development Cycle

1. Make changes to files in `src/`
2. Wait for build to complete (watch mode shows "✓ built")
3. Go to `chrome://extensions/` and click reload icon (🔄) on CacheCat
4. Test your changes

## Reloading Strategy

**After code changes:**

- **Dashboard changes**: Reload extension → Reload dashboard tab
- **Background script changes**: Reload extension → Background service worker auto-restarts
- **Agent/Content script changes**: Reload extension → Reload target website tab

**Quick reload shortcut:**

- In `chrome://extensions/`, focus the extension card and press `R` (or click reload icon)

## Debugging

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

## File Structure

```
src/
├── background/background.js    # Service worker - handles routing
├── content/content.js          # Bridge between background and agent
├── agent/agent.js             # Injected into page - storage access
└── dashboard/                 # React app
    ├── components/            # Reusable UI components
    ├── contexts/             # React contexts (Theme, Attach)
    ├── views/                # Main views (Cookies, LocalStorage, etc.)
    ├── App.jsx               # Main app component
    └── main.jsx              # Entry point
```

## Common Development Tasks

### Adding a New Storage View

1. Create component in `src/dashboard/views/`
2. Add route in `src/dashboard/App.jsx`
3. Add nav item in `src/dashboard/components/Sidebar.jsx`
4. Rebuild and test

### Modifying Background Script

1. Edit `src/background/background.js`
2. Rebuild (`npm run dev` auto-rebuilds)
3. Reload extension in Chrome
4. Background service worker restarts automatically

### Styling Changes

1. Edit Tailwind classes in components
2. Or modify `src/dashboard/index.css`
3. Rebuild and reload dashboard tab

### Adding New Chrome API

1. Check if permission needed in `manifest.json`
2. Use API in appropriate script (background/agent/content)
3. Rebuild and reload extension

## Development vs Production Builds

**Development (`npm run dev`):**

- Watch mode enabled
- Auto-rebuilds on file changes
- Console logs preserved
- Source maps available

**Production (`npm run build`):**

- Single build
- Minified with Terser
- Optimized for size
- Console logs preserved (for debugging)

## Testing Checklist

After making changes, test:

- [ ] Extension loads without errors
- [ ] Dashboard opens when clicking extension icon
- [ ] Can attach to a website
- [ ] Storage data loads correctly
- [ ] CRUD operations work
- [ ] Theme toggle works
- [ ] No console errors
- [ ] Multiple dashboards work independently

## Troubleshooting

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

## Code Quality

### Linting

```bash
# Check for errors
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### Formatting

```bash
# Format all code
npm run format
```

### Best Practices

1. **Always use watch mode** (`npm run dev`) during development
2. **Reload extension** after each build
3. **Check console** for errors regularly
4. **Test on multiple websites** to catch edge cases
5. **Use React DevTools** for component debugging
6. **Format code** before committing (`npm run format`)
7. **Lint code** before committing (`npm run lint`)

## Performance Tips

**Fast rebuilds:**

- Only edit files in `src/` (not `dist/`)
- Use watch mode (`npm run dev`) instead of manual builds
- Keep Chrome extension tab open for quick reloads

**Debugging performance:**

- Use Chrome DevTools Performance tab
- Check React DevTools Profiler for component renders
- Monitor network tab for message passing

## Architecture Notes

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

## Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
