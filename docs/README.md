# GitHub Pages Setup

This directory contains the files for GitHub Pages hosting.

## Structure

- `index.html` - Landing page with links to demo and privacy policy
- `privacy-policy.html` - Privacy policy page (required for Chrome Web Store)
- `demo/` - Demo site for testing the extension

## URLs

After enabling GitHub Pages, your site will be available at:

- **Landing Page**: `https://chinmay29hub.github.io/CacheCat/`
- **Demo Site**: `https://chinmay29hub.github.io/CacheCat/demo/`
- **Privacy Policy**: `https://chinmay29hub.github.io/CacheCat/privacy-policy.html`

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select:
   - **Branch**: `main`
   - **Folder**: `/docs`
4. Click **Save**

### 2. Deployment

Simply commit and push changes:

```bash
git add docs/
git commit -m "Update GitHub Pages"
git push
```

GitHub Pages will automatically deploy from the `docs/` directory.

## Chrome Web Store

The `manifest.json` includes the privacy policy URL:

```json
"privacy_policy": "https://chinmay29hub.github.io/CacheCat/privacy-policy.html"
```

This is all you need for Chrome Web Store submission! ✅
