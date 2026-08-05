const test = require("node:test");
const assert = require("node:assert/strict");
const { nextScheduledAt, formatCountdown, timeToMinutes } = require("../src/scheduler-core.js");

const config = { startTime: "09:00", endTime: "19:00", intervalMinutes: 60, weekdays: [1, 2, 3, 4, 5] };

test("parses time values", () => {
  assert.equal(timeToMinutes("09:30"), 570);
  assert.equal(timeToMinutes("25:00"), null);
});

test("finds the next hourly reminder on a weekday", () => {
  const next = nextScheduledAt(new Date(2026, 7, 4, 10, 15), config);
  assert.equal(next.getTime(), new Date(2026, 7, 4, 11, 0).getTime());
});

test("moves from Friday evening to Monday morning", () => {
  const next = nextScheduledAt(new Date(2026, 7, 7, 19, 1), config);
  assert.equal(next.getDay(), 1);
  assert.equal(next.getHours(), 9);
  assert.equal(next.getMinutes(), 0);
});

test("formats countdown with tabular hours", () => {
  assert.equal(formatCountdown(3_661_000), "01:01:01");
});
