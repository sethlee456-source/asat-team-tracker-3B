const test = require("node:test");
const assert = require("node:assert/strict");

const {
  STORAGE_KEY,
  trackerData,
  getTrackerMetrics,
  getProgressA11y,
  applyProgressA11y,
  normalizeTrackerData,
  collectFormData,
  getShareUrl,
  exportTrackerData,
  importTrackerData,
  saveTrackerState,
  loadTrackerState
} = require("./script.js");

test("computes aggregate survey metrics", () => {
  const metrics = getTrackerMetrics(trackerData);

  assert.equal(metrics.surveyedAgents.length, 13);
  assert.equal(metrics.missingAgents.length, 5);
  assert.equal(metrics.totalResponses, 95);
  assert.deepEqual(metrics.starTotals, { 1: 8, 2: 0, 3: 4, 4: 3, 5: 80 });
});

test("orders focus agents from lowest score upward", () => {
  const metrics = getTrackerMetrics(trackerData);

  assert.deepEqual(
    metrics.focusAgents.map((agent) => agent.name),
    ["Lee Xing Le", "Wong Ho Yan", "Chng Pei Mun", "Yap Lil Yoon"]
  );
});

test("exposes consistent 5-point accessibility progress metadata", () => {
  const metrics = getTrackerMetrics(trackerData);
  const a11y = getProgressA11y(trackerData, metrics.delta);

  assert.equal(a11y.label, "ASAT score on the 5-point scale");
  assert.equal(a11y.max, 5);
  assert.equal(a11y.now, 4.54);
  assert.match(a11y.note, /5-point scale/i);
  assert.match(a11y.text, /4\.54 out of 5\.00/);
  assert.match(a11y.text, /Target 4\.20 reached/);
});

test("applies accessible progress attributes and width", () => {
  const progressTrack = {
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    }
  };
  const progressFill = { style: {} };
  const a11y = getProgressA11y(trackerData, getTrackerMetrics(trackerData).delta);

  applyProgressA11y(progressTrack, progressFill, a11y, 90.8);

  assert.equal(progressTrack.attributes["aria-label"], "ASAT score on the 5-point scale");
  assert.equal(progressTrack.attributes["aria-valuemin"], "0");
  assert.equal(progressTrack.attributes["aria-valuemax"], "5");
  assert.equal(progressTrack.attributes["aria-valuenow"], "4.54");
  assert.match(progressTrack.attributes["aria-valuetext"], /Target 4\.20 reached/);
  assert.equal(progressFill.style.width, "90.8%");
});

test("normalizes partial tracker data safely", () => {
  const normalized = normalizeTrackerData({
    teamName: " Team 3B Keep ",
    currentResult: "4.61",
    targetResult: "4.30",
    agents: [
      { name: "Cheah Mun Lok", score: "4.8", surveys: { 5: "4", 1: "1" } },
      { name: "Yong Mee Ting", score: "", surveys: { 5: "0", 4: "0", 3: "0", 2: "0", 1: "0" } }
    ]
  });

  assert.equal(normalized.teamName, "Team 3B Keep");
  assert.equal(normalized.currentResult, 4.61);
  assert.equal(normalized.targetResult, 4.3);
  assert.deepEqual(normalized.agents[0].surveys, { 1: 1, 2: 0, 3: 0, 4: 0, 5: 4 });
  assert.equal(normalized.agents[1].surveys, null);
});

test("collects editable form data into a normalized payload", () => {
  class MockFormData {
    constructor(form) {
      this.values = form.values;
    }
    get(name) {
      return this.values[name];
    }
  }

  const form = {
    values: {
      teamName: "Team 3B Citadel",
      currentResult: "4.66",
      targetResult: "4.20",
      "agent-score-0": "4.9",
      "agent-0-star-5": "5",
      "agent-0-star-4": "1",
      "agent-0-star-3": "0",
      "agent-0-star-2": "0",
      "agent-0-star-1": "0"
    }
  };

  const payload = collectFormData(form, trackerData, MockFormData);

  assert.equal(payload.teamName, "Team 3B Citadel");
  assert.equal(payload.currentResult, 4.66);
  assert.equal(payload.agents[0].score, 4.9);
  assert.deepEqual(payload.agents[0].surveys, { 1: 0, 2: 0, 3: 0, 4: 1, 5: 5 });
  assert.equal(payload.agents[1].name, "Yong Mee Ting");
});

test("exports and imports tracker JSON", () => {
  const exported = exportTrackerData(trackerData);
  const imported = importTrackerData(exported);

  assert.match(exported, /"teamName": "Team 3B"/);
  assert.equal(imported.teamName, "Team 3B");
  assert.equal(imported.agents.length, 18);
});

test("persists tracker JSON in storage", () => {
  const storage = {
    data: {},
    setItem(key, value) {
      this.data[key] = value;
    },
    getItem(key) {
      return this.data[key] || null;
    }
  };

  saveTrackerState(storage, trackerData);
  const loaded = loadTrackerState(storage);

  assert.ok(storage.data[STORAGE_KEY]);
  assert.equal(loaded.currentResult, 4.54);
  assert.equal(loaded.agents[0].name, "Cheah Mun Lok");
});

test("builds a share url from location", () => {
  assert.equal(getShareUrl({ href: "https://example.com/asat/index.html" }), "https://example.com/asat/index.html");
  assert.equal(getShareUrl(null), "index.html");
});
