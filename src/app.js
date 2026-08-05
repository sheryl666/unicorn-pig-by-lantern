(function () {
  "use strict";

  const CONFIG_KEY = "lantern-html-config-v1";
  const NEXT_KEY = "lantern-html-next-at-v1";
  const DB_NAME = "lantern-html-assets-v1";
  const STORE_NAME = "characters";
  const DEFAULT_CONFIG = {
    nickname: "👑热爱工作的无敌小灯笼大王🏮",
    themeColor: "#8656cf",
    intervalMinutes: 60,
    startTime: "09:00",
    endTime: "19:00",
    weekdays: [1, 2, 3, 4, 5]
  };

  const $ = (selector) => document.querySelector(selector);
  const mode = new URLSearchParams(location.search).get("mode") || "settings";
  let config = loadConfig();
  let nextAt = Number(localStorage.getItem(NEXT_KEY)) || 0;
  let reminderVisible = false;

  function loadConfig() {
    try { return { ...DEFAULT_CONFIG, ...JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}") }; }
    catch (_) { return { ...DEFAULT_CONFIG }; }
  }

  function saveConfig(nextConfig) {
    config = nextConfig;
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    nextAt = LanternScheduler.nextScheduledAt(new Date(), config)?.getTime() || 0;
    localStorage.setItem(NEXT_KEY, String(nextAt));
  }

  function setTheme(color) {
    const safe = /^#[0-9a-f]{6}$/i.test(color) ? color : DEFAULT_CONFIG.themeColor;
    document.documentElement.style.setProperty("--theme", safe);
    document.documentElement.style.setProperty("--theme-dark", mixHex(safe, "#160820", 0.36));
    document.documentElement.style.setProperty("--theme-soft", mixHex(safe, "#ffffff", 0.84));
  }

  function mixHex(a, b, amount) {
    const parse = (value) => [1, 3, 5].map((index) => parseInt(value.slice(index, index + 2), 16));
    const left = parse(a); const right = parse(b);
    return "#" + left.map((value, index) => Math.round(value * (1 - amount) + right[index] * amount).toString(16).padStart(2, "0")).join("");
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getCustomCharacters() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();
      request.onsuccess = () => { db.close(); resolve(request.result.map((item) => item.dataUrl)); };
      request.onerror = () => { db.close(); reject(request.error); };
    });
  }

  async function replaceCustomCharacters(files) {
    const images = await Promise.all(Array.from(files).map(readAsDataUrl));
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
      images.forEach((dataUrl) => store.add({ dataUrl }));
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
    return images;
  }

  function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function availableCharacters() {
    try {
      const custom = await getCustomCharacters();
      if (custom.length) return custom;
    } catch (_) {}
    return window.LANTERN_DEFAULT_CHARACTERS || [];
  }

  async function randomCharacter() {
    const characters = await availableCharacters();
    return characters[Math.floor(Math.random() * characters.length)] || "";
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(date);
  }

  async function reminderPayload(now = new Date()) {
    return {
      nickname: config.nickname,
      themeColor: config.themeColor,
      date: formatDate(now),
      time: now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }),
      character: await randomCharacter()
    };
  }

  function renderReminder(payload) {
    setTheme(payload.themeColor);
    $("#reminderCard").style.setProperty("--card-theme", payload.themeColor);
    $("#reminderNickname").textContent = payload.nickname;
    $("#reminderDate").textContent = payload.date;
    $("#reminderTime").textContent = payload.time;
    $("#reminderCharacter").src = payload.character;
    $("#reminderOverlay").classList.remove("hidden");
    reminderVisible = true;
  }

  async function triggerReminder() {
    const payload = await reminderPayload();
    if (window.lanternDesktop) window.lanternDesktop.showReminder(payload);
    else renderReminder(payload);
  }

  function dismissReminder() {
    if (window.lanternDesktop && mode === "reminder") window.lanternDesktop.closeReminder();
    else $("#reminderOverlay").classList.add("hidden");
    reminderVisible = false;
  }

  function ensureNextAt() {
    if (!nextAt || !Number.isFinite(nextAt)) {
      nextAt = LanternScheduler.nextScheduledAt(new Date(), config)?.getTime() || 0;
      localStorage.setItem(NEXT_KEY, String(nextAt));
    }
  }

  async function schedulerTick() {
    ensureNextAt();
    const now = Date.now();
    if (nextAt && now >= nextAt) {
      await triggerReminder();
      nextAt = LanternScheduler.nextScheduledAt(new Date(now + 1000), config)?.getTime() || 0;
      localStorage.setItem(NEXT_KEY, String(nextAt));
    }
    updateCountdown(now);
  }

  function updateCountdown(now = Date.now()) {
    if (!$("#countdown")) return;
    if (!nextAt) {
      $("#countdown").textContent = "--:--:--";
      $("#nextTime").textContent = "请检查提醒日期和时间";
      return;
    }
    $("#countdown").textContent = LanternScheduler.formatCountdown(nextAt - now);
    $("#nextTime").textContent = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(nextAt));
  }

  function readForm() {
    const weekdays = Array.from(document.querySelectorAll('input[name="weekday"]:checked')).map((input) => Number(input.value));
    return {
      nickname: $("#nickname").value.trim() || DEFAULT_CONFIG.nickname,
      themeColor: $("#themeColor").value,
      intervalMinutes: Math.max(1, Number($("#intervalMinutes").value) || 60),
      startTime: $("#startTime").value || "09:00",
      endTime: $("#endTime").value || "19:00",
      weekdays: weekdays.length ? weekdays : DEFAULT_CONFIG.weekdays
    };
  }

  function hydrateForm() {
    $("#nickname").value = config.nickname;
    $("#themeColor").value = config.themeColor;
    $("#themeValue").value = config.themeColor.toUpperCase();
    $("#intervalMinutes").value = config.intervalMinutes;
    $("#startTime").value = config.startTime;
    $("#endTime").value = config.endTime;
    document.querySelectorAll('input[name="weekday"]').forEach((input) => { input.checked = config.weekdays.includes(Number(input.value)); });
    $("#miniNickname").textContent = config.nickname;
    setTheme(config.themeColor);
  }

  async function updatePackStatus() {
    const custom = await getCustomCharacters().catch(() => []);
    $("#packStatus").textContent = custom.length ? `已导入 ${custom.length} 个自定义形象` : `默认角色包 · ${window.LANTERN_DEFAULT_CHARACTERS.length} 个形象`;
    $("#miniCharacter").src = await randomCharacter();
  }

  async function initSettings() {
    hydrateForm();
    ensureNextAt();
    await updatePackStatus();
    updateCountdown();

    $("#settingsForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      saveConfig(readForm());
      hydrateForm();
      updateCountdown();
      $("#saveMessage").textContent = "已保存，提醒正在本机运行 ✓";
      if (window.lanternDesktop) window.lanternDesktop.setOpenAtLogin($("#openAtLogin").checked);
    });

    $("#themeColor").addEventListener("input", (event) => {
      $("#themeValue").value = event.target.value.toUpperCase();
      setTheme(event.target.value);
    });
    $("#nickname").addEventListener("input", (event) => { $("#miniNickname").textContent = event.target.value; });
    $("#testButton").addEventListener("click", async () => { config = readForm(); await triggerReminder(); });
    $("#characterFiles").addEventListener("change", async (event) => {
      if (!event.target.files.length) return;
      $("#packStatus").textContent = "正在导入角色包…";
      await replaceCustomCharacters(event.target.files);
      await updatePackStatus();
    });

    if (window.lanternDesktop) {
      $("#loginItemRow").classList.remove("hidden");
      $("#openAtLogin").checked = await window.lanternDesktop.getOpenAtLogin();
    }

    setInterval(schedulerTick, 1000);
  }

  function initReminderWindow() {
    document.body.classList.add("reminder-mode");
    $("#settingsApp").classList.add("hidden");
    if (window.lanternDesktop) window.lanternDesktop.onReminderPayload(renderReminder);
  }

  $("#dismissReminder").addEventListener("click", dismissReminder);
  if (mode === "reminder") initReminderWindow(); else initSettings();
})();
