const path = require("node:path");
const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage } = require("electron");

let controlWindow;
let reminderWindow;
let tray;
let quitting = false;

app.commandLine.appendSwitch("disable-background-timer-throttling");

function htmlPath() {
  return path.join(__dirname, "..", "dist", "lantern-reminder.html");
}

function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 1080,
    height: 760,
    minWidth: 760,
    minHeight: 620,
    title: "Unicorn pig（by lantern）",
    backgroundColor: "#f5effb",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });
  controlWindow.loadFile(htmlPath());
  controlWindow.on("close", (event) => {
    if (!quitting) {
      event.preventDefault();
      controlWindow.hide();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, "..", "assets", "tray-icon.png");
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 18, height: 18 });
  tray = new Tray(icon);
  tray.setToolTip("Unicorn pig（by lantern）");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "打开设置", click: () => { controlWindow.show(); controlWindow.focus(); } },
    { label: "测试提醒", click: () => controlWindow.webContents.executeJavaScript('document.querySelector("#testButton").click()') },
    { type: "separator" },
    { label: "退出", click: () => { quitting = true; app.quit(); } }
  ]));
  tray.on("double-click", () => { controlWindow.show(); controlWindow.focus(); });
}

function showReminder(payload) {
  if (!reminderWindow || reminderWindow.isDestroyed()) {
    reminderWindow = new BrowserWindow({
      width: 720,
      height: 400,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: false,
      backgroundColor: payload.themeColor,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false
      }
    });
    reminderWindow.setAlwaysOnTop(true, "floating");
    reminderWindow.loadFile(htmlPath(), { query: { mode: "reminder" } });
    reminderWindow.webContents.once("did-finish-load", () => reminderWindow.webContents.send("reminder-payload", payload));
    reminderWindow.on("closed", () => { reminderWindow = null; });
  } else {
    reminderWindow.webContents.send("reminder-payload", payload);
  }
  reminderWindow.center();
  reminderWindow.show();
  reminderWindow.focus();
}

app.whenReady().then(() => {
  createControlWindow();
  createTray();
  app.on("activate", () => { controlWindow.show(); controlWindow.focus(); });
});

app.on("window-all-closed", (event) => event.preventDefault());
app.on("before-quit", () => { quitting = true; });

ipcMain.on("show-reminder", (_event, payload) => showReminder(payload));
ipcMain.on("close-reminder", () => {
  if (reminderWindow && !reminderWindow.isDestroyed()) reminderWindow.destroy();
});
ipcMain.on("set-open-at-login", (_event, enabled) => app.setLoginItemSettings({ openAtLogin: enabled }));
ipcMain.handle("get-open-at-login", () => app.getLoginItemSettings().openAtLogin);
