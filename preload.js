const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  processExcel: (filePath) => ipcRenderer.invoke('excel:process', filePath)
});
