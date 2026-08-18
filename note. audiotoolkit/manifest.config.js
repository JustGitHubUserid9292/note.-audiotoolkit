import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
    manifest_version: 3,

    name: "note. Audio ToolKit",
    version: "1.0.0",

    permissions: [
        "tabCapture",
        "offscreen",
        "storage"
    ],

    action: {
        default_popup: "index.html"
    },

    background: {
        service_worker: "src/background/background.js",
        type: "module"
    }
});