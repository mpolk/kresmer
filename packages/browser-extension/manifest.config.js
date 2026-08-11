import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  "manifest_version": 3,
  "name": "Kresmer",
  "version": "0.0.1",
  "permissions": ["declarativeNetRequest", "tabs"],
  "host_permissions": [
    "<all_urls>",
    "file:///*"
  ],
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'unsafe-eval'; object-src 'self';"
  },
});
