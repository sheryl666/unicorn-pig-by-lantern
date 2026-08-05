(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.LanternScheduler = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function timeToMinutes(value) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value || "");
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return hour * 60 + minute;
  }

  function normalizeConfig(config) {
    const start = timeToMinutes(config.startTime);
    const end = timeToMinutes(config.endTime);
    const interval = Math.max(1, Number(config.intervalMinutes) || 60);
    const weekdays = Array.isArray(config.weekdays) && config.weekdays.length
      ? config.weekdays.map(Number)
      : [1, 2, 3, 4, 5];
    return {
      start: start == null ? 9 * 60 : start,
      end: end == null ? 19 * 60 : end,
      interval,
      weekdays
    };
  }

  function nextScheduledAt(after, config) {
    const normalized = normalizeConfig(config);
    const afterDate = after instanceof Date ? after : new Date(after);
    for (let dayOffset = 0; dayOffset < 15; dayOffset += 1) {
      const day = new Date(afterDate);
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() + dayOffset);
      if (!normalized.weekdays.includes(day.getDay())) continue;

      for (let minute = normalized.start; minute <= normalized.end; minute += normalized.interval) {
        const candidate = new Date(day);
        candidate.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
        if (candidate.getTime() > afterDate.getTime()) return candidate;
      }
    }
    return null;
  }

  function formatCountdown(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  }

  return { timeToMinutes, normalizeConfig, nextScheduledAt, formatCountdown };
});
