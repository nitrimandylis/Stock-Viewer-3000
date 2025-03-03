// Preload script
const { contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Add any API functions here that the renderer process needs
  // For example:
  // send: (channel, data) => {
  //   ipcRenderer.send(channel, data);
  // },
  // receive: (channel, func) => {
  //   ipcRenderer.on(channel, (event, ...args) => func(...args));
  // }
});