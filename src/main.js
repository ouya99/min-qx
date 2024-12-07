const {
  app,
  BrowserWindow,
  session,
  ipcMain,
  WebContentsView,
} = require("electron");
const path = require("path");

function createWindow() {
  const isDev = !app.isPackaged;
  const win = new BrowserWindow({
    width: 1200,
    height: 1000,
    title: "Min QX",
    resizable: false, // Prevent resizing
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      //   sandbox: false,
    },
  });

  const qxView = new WebContentsView();
  const qubicExplorer = new WebContentsView();

  // win.webContents.openDevTools();

  if (isDev) {
    // Load Vite dev server in development
    win.loadURL("http://localhost:5173");
    // win.webContents.openDevTools();
  } else {
    // Production mode: Load the built index.html
    const indexPath = path.join(__dirname, "../dist/index.html");
    win.loadFile(indexPath);
  }

  ipcMain.handle("open-explorer", async (event, ...args) => {
    // Put your URL in here
    const url = `https://explorer.qubic.org/network/address/${args[0]}`;
    qubicExplorer.webContents.loadURL(url);

    // This expands the WebContentsView to the max bounds of the BaseWindow parent.
    // qxInfo.setBounds(win.getBounds());
    qubicExplorer.setBounds({
      x: win.getBounds().x - 250,
      y: win.getBounds().y + 205,
      width: win.getBounds().width,
      height: win.getBounds().height,
    });

    // Now add it to the BaseWindow parent
    win.contentView.addChildView(qubicExplorer);
    return;
  });

  ipcMain.handle("close-explorer", async (event, ...args) => {
    // Now add it to the BaseWindow parent
    win.contentView.removeChildView(qubicExplorer);
    return;
  });

  ipcMain.handle("open-qx-view", async (event, ...args) => {
    // Put your URL in here
    qxView.webContents.loadURL("https://qx.qubic.org/");

    // This expands the WebContentsView to the max bounds of the BaseWindow parent.
    // qxInfo.setBounds(win.getBounds());
    qxView.setBounds({
      x: win.getBounds().x - 250,
      y: win.getBounds().y + 205,
      width: win.getBounds().width,
      height: win.getBounds().height,
    });

    // Now add it to the BaseWindow parent
    win.contentView.addChildView(qxView);
    return;
  });

  ipcMain.handle("close-qx-view", async (event, ...args) => {
    // Now add it to the BaseWindow parent
    win.contentView.removeChildView(qxView);
    return;
  });

  //   ipcMain.on("web-contents-view-action", (event, action, url) => {
  //     if (action === "load-url") {
  //       webContentsView.loadURL(url);
  //     }
  //     const view = new WebContentsView();

  //     // Put your URL in here
  //     view.webContents.loadURL("https://bapbap.gg");

  //     // This expands the WebContentsView to the max bounds of the BaseWindow parent.
  //     view.setBounds(mainWindow.getBounds());

  //     // Now add it to the BaseWindow parent
  //     mainWindow.contentView.addChildView(view);
  //   });

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
