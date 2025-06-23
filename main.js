const { app, BrowserWindow, safeStorage, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

const STORAGE_PATH = path.join(app.getPath('userData'), 'form-data.dat');

ipcMain.handle('save-form-data', async (event, formData) => {
    try {
        if (safeStorage.isEncryptionAvailable()) {
            const dataString = JSON.stringify(formData);
            const encrypted = safeStorage.encryptString(dataString);
            fs.writeFileSync(STORAGE_PATH, encrypted);
            return { success: true };
        }
        return { success: false, error: 'Encryption not available' };
    } catch (error) {
        console.error('Save error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('load-form-data', async () => {
    try {
        if (safeStorage.isEncryptionAvailable() && fs.existsSync(STORAGE_PATH)) {
            const encrypted = fs.readFileSync(STORAGE_PATH);
            const decrypted = safeStorage.decryptString(encrypted);
            return { success: true, data: JSON.parse(decrypted) };
        }
        return { success: true, data: {} };
    } catch (error) {
        console.error('Load error:', error);
        return { success: false, error: error.message };
    }
});

function createWindow() {
    const win = new BrowserWindow({
        width: 600,
        height: 720,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: false, // Disables CORS restrictions
            preload: path.join(__dirname, 'preload.js')
        },
    });

    win.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});