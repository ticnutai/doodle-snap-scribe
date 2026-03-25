const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let win = null;
let tray = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

  // Minimize to tray instead of closing
  win.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      win.hide();
    }
  });
}

function createTray() {
  // Create a 16x16 simple icon programmatically
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAWklEQVQ4y2P4////ZwYKABMDhcCogYMCMIIddODAAQYGBgaG//8ZGP7/Z2BgYPj/H8r+D2X/h7JB4v//IzQgq0NxAbIBjIyMcA0MDIwMDAwMjIwQNiMjIwMA8KQZF8RmbCgAAAAASUVORK5CYII='
  );

  tray = new Tray(icon);
  tray.setToolTip('ScreenCraft');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'פתח את ScreenCraft',
      click: () => {
        if (win) {
          win.show();
          win.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'יציאה',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (win) {
      win.show();
      win.focus();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (win) {
    win.show();
  } else {
    createWindow();
  }
});
