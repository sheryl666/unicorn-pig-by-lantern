const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("lanternDesktop", {
  showReminder: (payload) => ipcRenderer.send("show-reminder", payload),
  closeReminder: () => ipcRenderer.send("close-reminder"),
  onReminderPayload: (callback) => ipcRenderer.on("reminder-payload", (_event, payload) => callback(payload)),
  setOpenAtLogin: (enabled) => ipcRenderer.send("set-open-at-login", Boolean(enabled)),
  getOpenAtLogin: () => ipcRenderer.invoke("get-open-at-login")
});
