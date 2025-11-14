# Privacy Policy

**Last Updated:** November 2024

## Data Collection & Usage

CacheCat **does NOT collect, store, or transmit any user data**. All operations are performed locally on your device.

### What We Access

CacheCat accesses website storage data (Cookies, Local Storage, Session Storage, IndexedDB, Cache Storage) **only when you explicitly attach to a website** by clicking the extension icon.

### What We Do With Your Data

- **View**: Display storage data in the dashboard
- **Edit**: Allow you to modify storage data locally
- **Delete**: Allow you to delete storage data locally

### What We DON'T Do

- ❌ **No data collection** - We don't collect any information
- ❌ **No data transmission** - Nothing is sent to external servers
- ❌ **No analytics** - No tracking or analytics
- ❌ **No third-party services** - No external API calls
- ❌ **No data storage** - We don't store your data anywhere

### Permissions Explained

**`host_permissions: ["<all_urls>"]`**

- **Why needed**: To access storage on websites you want to inspect
- **When used**: Only when you click the extension icon on a specific website
- **Scope**: Limited to storage operations only

**`permissions: ["cookies", "scripting", "activeTab"]`**

- **cookies**: Read and modify cookies (required for cookie management)
- **scripting**: Inject scripts to access storage APIs (required for Local Storage, IndexedDB, etc.)
- **activeTab**: Access the currently active tab (required to attach to websites)

### Local-Only Operation

All operations happen entirely on your device:

- Storage data is read from your browser
- Modifications are made locally
- No network requests are made
- No data leaves your computer

### Open Source

CacheCat is open source. You can review the code to verify our privacy claims:

- GitHub: https://github.com/chinmay29hub/CacheCat

### Contact

If you have privacy concerns, please open an issue on GitHub.
