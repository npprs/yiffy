const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    saveFormData: (data) => ipcRenderer.invoke('save-form-data', data),
    loadFormData: () => ipcRenderer.invoke('load-form-data'),
    clearFormData: () => ipcRenderer.invoke('clear-form-data')
});