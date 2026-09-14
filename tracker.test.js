const test = require("node:test");
const assert = require("node:assert/strict");

const { trackerData, getTrackerMetrics, getProgressA11y, applyProgressA11y } = require("./script.js");

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
  assert.match(a11y.note, /5-point scale|full 5-point scale/i);
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
  assert.equal(progressTrack.attributes["aria-valuemax"], "5");
  assert.equal(progressTrack.attributes["aria-valuenow"], "4.54");
  assert.match(progressTrack.attributes["aria-valuetext"], /Target 4\.20 reached/);
  assert.equal(progressFill.style.width, "90.8%");
});
