const { contextBridge, ipcRenderer, webFrame } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  openEntitiesView: async (channel, data) => {
    const result = await ipcRenderer.invoke("open-entities-view", data);
  },
  closeEntitiesView: async (channel, data) => {
    const result = await ipcRenderer.invoke("close-entities-view", "a", "b");
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
