const { app, BrowserWindow, globalShortcut } = require("electron");
const path = require("path");

function createWindow() {
    const isDev = !app.isPackaged;
    const win = new BrowserWindow({
        width: 1200,
        height: 1000,
        title: "Min QX",
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true,
        },
    });
    blockZoom(win);
    // win.webContents.openDevTools();

    if (isDev) {
        // Load Vite dev server in development
        win.loadURL("http://localhost:5173");
        win.webContents.openDevTools();
    } else {
        // Production mode: Load the built index.html
        const indexPath = path.join(__dirname, "../dist/index.html");
        win.loadFile(indexPath);
    }

    // const curSession = win.webContents.session;

    // // If using method B for the session you should first construct the BrowserWindow
    // const filter = { urls: ["*://*.api.qubic.org/*"] };

    // curSession.webRequest.onHeadersReceived(filter, (details, callback) => {
    //   details.responseHeaders["Access-Control-Allow-Origin"] = [
    //     "http://localhost:5173",
    //   ];
    //   callback({ responseHeaders: details.responseHeaders });
    // });
}

app.whenReady().then(() => {
    createWindow();

    // Block shortcut combinations
    blockShortcutCombination();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

function blockShortcutCombination() {
    // Block specific shortcuts globally
    const blockedCombinations = [
        "CommandOrControl+Shift+I", // Block dev tools

        "CommandOrControl++", // Block zoom in
        "CommandOrControl+-", // Block zoom out
    ];

    blockedCombinations.forEach((combination) => {
        const success = globalShortcut.register(combination, () => {
            console.log(`Blocked combination: ${combination}`);
        });
        if (!success) {
            console.error(`Failed to block combination: ${combination}`);
        }
    });
}

function blockZoom(window) {
    window.webContents.on("before-input-event", (event, input) => {
        if (
            (input.control || input.meta) && // Control for Windows/Linux, Command (meta) for macOS
            (input.key === "+" || input.key === "-" || input.key === "0")
        ) {
            event.preventDefault();
            console.log(`Blocked zoom action: ${input.key}`);
        }
    });
}
