import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { registerMediaSchemeAsPrivileged, registerMediaProtocolHandler } from './services/mediaProtocol'
import { registerIpcHandlers } from './services/ipc'

// Must run before the app is ready, or Electron won't treat our custom
// scheme as capable of things like fetch() and CORS the way a normal
// http(s) origin can.
registerMediaSchemeAsPrivileged()

// The main process is the only part of StickerVault allowed to touch the
// operating system directly (windows, files, clipboard). The UI (renderer)
// never gets that access itself — it can only ask for it through the
// preload bridge. This split is what keeps the app secure.
function createMainWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: '#111114',
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#111114',
      symbolColor: '#e4e4e7',
      height: 48
    },
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      // contextIsolation keeps renderer code from ever reaching Node.js
      // APIs directly — it must go through preload. Our preload script is
      // built as an ES module (package.json has "type": "module"), and
      // Electron's sandboxed preload context can only load CommonJS, so we
      // turn the sandbox off for this one script. contextIsolation is what
      // actually enforces the renderer/Node boundary; sandbox is a second,
      // stricter OS-level layer this app doesn't otherwise depend on.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // Wait to show the window until the page has actually rendered, so the
  // user never sees a blank white flash on launch.
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Any link the renderer tries to open in a "new window" should instead
  // open in the user's normal browser, not a second Electron window.
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // electron-vite injects this URL while running `npm run dev` and serves
  // the renderer from Vite's dev server (with hot reload). In a packaged
  // build there is no dev server, so we load the built HTML file instead.
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerMediaProtocolHandler()
  registerIpcHandlers()
  createMainWindow()

  app.on('activate', () => {
    // On Windows/Linux this never fires (there's no dock), but it's the
    // correct cross-platform behavior if StickerVault ever supports macOS.
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
