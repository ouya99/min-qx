const { app, BrowserWindow, session } = require("electron");
const path = require("path");

function createWindow() {
    const isDev = !app.isPackaged;
    const win = new BrowserWindow({
        width: 1200,
        height: 1000,
        title: "Min QX",
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true,
        },
    });
    win.webContents.setZoomFactor(1);
    win.webContents.on("did-finish-load", () => {
        win.webContents.setZoomFactor(1);
    });

    win.webContents.on("zoom-changed", (event, zoomDirection) => {
        win.webContents.setZoomFactor(1);
    });
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

app.whenReady().then(createWindow);

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
