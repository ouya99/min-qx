const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  openExplorer: async (channel, data) => {
    console.log(data);
    const result = await ipcRenderer.invoke("open-explorer", data);
  },
  closeExplorer: async (channel, data) => {
    const result = await ipcRenderer.invoke("close-explorer", "a", "b");
  },
  openQxView: async (channel, data) => {
    const result = await ipcRenderer.invoke("open-qx-view", "a", "b");
  },
  closeQxView: async (channel, data) => {
    const result = await ipcRenderer.invoke("close-qx-view", "a", "b");
  },
  send: (channel, data) => {
    // whitelist channels
    let validChannels = ["toMain"];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    let validChannels = ["fromMain"];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
});
