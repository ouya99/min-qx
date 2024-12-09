const { app, BrowserWindow, ipcMain, WebContentsView } = require("electron");
const path = require("path");

function createWindow() {
  const isDev = !app.isPackaged;
  const win = new BrowserWindow({
    width: 1200,
    height: 1000,
    title: "Min QX",
    autoHideMenuBar: true,
    resizable: false, // Prevent resizing
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      //   sandbox: false,
    },
  });

  const entitiesView = new WebContentsView();

  if (isDev) {
    // Load Vite dev server in development
    win.loadURL("http://localhost:5173");
    // win.webContents.openDevTools();
  } else {
    // Production mode: Load the built index.html
    const indexPath = path.join(__dirname, "../dist/index.html");
    win.loadFile(indexPath);
  }

  ipcMain.handle("open-entities-view", async (event, ...args) => {
    // Put your URL in here
    const url = `https://qx.qubic.org/entities/${args[0]}`;
    entitiesView.webContents.loadURL(url);

    // This expands the WebContentsView to the max bounds of the BaseWindow parent.
    // qxInfo.setBounds(win.getBounds());
    entitiesView.setBounds({
      x: 0,
      y: 240,
      width: win.getBounds().width,
      height: win.getBounds().height,
    });

    win.webContents.setZoomLevel(0);
    // Now add it to the BaseWindow parent
    win.contentView.addChildView(entitiesView);
    return;
  });

  ipcMain.handle("close-entities-view", async (event, ...args) => {
    // Now add it to the BaseWindow parent
    win.contentView.removeChildView(entitiesView);
    return;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
  // if (process.platform !== "darwin") {
  //   app.quit();
  // }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
