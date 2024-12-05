const { app, BrowserWindow } = require("electron");
const path = require("path");
const isDev = !app.isPackaged;

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1200,
    height: 1000,
    title: "Min QX",
    webPreferences: {
      nodeIntegration: false, // For security
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      webSecurity: true
    },
  });

  // Load the appropriate URL
  if (isDev) {
    // Dev mode: Load from Vite dev server
    win.loadURL("http://localhost:5173");
    // Open DevTools automatically in development
    win.webContents.openDevTools();
  } else {
    // Production: Load local files
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  // Prevent title changes
  win.on('page-title-updated', (e) => {
    e.preventDefault();
  });
}

// When Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('An uncaught error occurred:', error);
});