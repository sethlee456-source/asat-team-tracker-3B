const trackerData = {
  teamName: "Team 3B",
  totalAgents: 18,
  currentResult: 4.54,
  targetResult: 4.2,
  agents: [
    { name: "Cheah Mun Lok", score: 4.75, surveys: { 5: 3, 4: 1 } },
    { name: "Yong Mee Ting", score: null, surveys: null },
    { name: "Ong Man Yee", score: 5, surveys: { 5: 1 } },
    { name: "Ong Yu Xin", score: null, surveys: null },
    { name: "Yong Pink Ng", score: 4.75, surveys: { 5: 8, 3: 1, 1: 1 } },
    { name: "Wong Ho Yan", score: 3.4, surveys: { 5: 3, 1: 2 } },
    { name: "Chng Pei Mun", score: 3.67, surveys: { 5: 2, 1: 1 } },
    { name: "Nicole Ku", score: 4.38, surveys: { 5: 6, 4: 1, 1: 1 } },
    { name: "Xuan En Jee", score: 5, surveys: { 5: 14 } },
    { name: "Bong Su Feng", score: 5, surveys: { 5: 1 } },
    { name: "Yap Lil Yoon", score: 4, surveys: { 5: 1, 3: 1 } },
    { name: "Sean Tay", score: 4.86, surveys: { 5: 19, 4: 1, 3: 1 } },
    { name: "Chai Min Kang", score: null, surveys: null },
    { name: "Alex Yi", score: null, surveys: null },
    { name: "Tan Meng Kiat", score: null, surveys: null },
    { name: "Roderic Poh", score: 4.43, surveys: { 5: 12, 1: 2 } },
    { name: "Lee Xing Le", score: 3, surveys: { 5: 1, 3: 1, 1: 1 } },
    { name: "Tan Kok Ming", score: 5, surveys: { 5: 9 } }
  ]
};

const formatScore = (value) => (value === null ? "N/A" : value.toFixed(2).replace(/\.00$/, ""));

const totalSurveysForAgent = (agent) =>
  agent.surveys ? Object.values(agent.surveys).reduce((sum, value) => sum + value, 0) : 0;

const calculateStarTotals = (agents) =>
  agents.reduce(
    (totals, agent) => {
      Object.entries(agent.surveys).forEach(([star, count]) => {
        totals[star] = (totals[star] || 0) + count;
      });
      return totals;
    },
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  );

const getTrackerMetrics = (data) => {
  const surveyedAgents = data.agents.filter((agent) => agent.surveys);
  const missingAgents = data.agents.filter((agent) => !agent.surveys);
  const totalResponses = surveyedAgents.reduce((sum, agent) => sum + totalSurveysForAgent(agent), 0);
  const starTotals = calculateStarTotals(surveyedAgents);
  const delta = data.currentResult - data.targetResult;

  return {
    surveyedAgents,
    missingAgents,
    totalResponses,
    starTotals,
    delta,
    progressPercent: Math.min((data.currentResult / 5) * 100, 100),
    focusAgents: surveyedAgents
      .filter((agent) => agent.score < data.targetResult)
      .sort((a, b) => a.score - b.score)
  };
};

const getProgressA11y = (data, delta) => ({
  label: "ASAT score on the 5-point scale",
  max: 5,
  now: data.currentResult,
  note: "Bar shows the current ASAT score on the full 5-point scale.",
  text:
    delta >= 0
      ? `${data.currentResult.toFixed(2)} out of 5.00. Target ${data.targetResult.toFixed(2)} reached.`
      : `${data.currentResult.toFixed(2)} out of 5.00. Target ${data.targetResult.toFixed(2)} still ahead.`
});

const createNode = (doc, tagName, className, text) => {
  const node = doc.createElement(tagName);

  if (className) {
    node.className = className;
  }

  if (text !== undefined) {
    node.textContent = text;
  }

  return node;
};

const appendCards = (container, cards) => {
  cards.forEach((card) => container.append(card));
};

const applyProgressA11y = (progressTrack, progressFill, a11yConfig, progressPercent) => {
  progressTrack.setAttribute("aria-label", a11yConfig.label);
  progressTrack.setAttribute("aria-valuemax", String(a11yConfig.max));
  progressTrack.setAttribute("aria-valuenow", String(a11yConfig.now));
  progressTrack.setAttribute("aria-valuetext", a11yConfig.text);
  progressFill.style.width = `${progressPercent}%`;
};

const renderTracker = (doc, data) => {
  const metrics = getTrackerMetrics(data);
  const a11yConfig = getProgressA11y(data, metrics.delta);
  const heroStats = doc.getElementById("hero-stats");
  const overviewCards = doc.getElementById("overview-cards");
  const starBreakdown = doc.getElementById("star-breakdown");
  const priorityHeroes = doc.getElementById("priority-heroes");
  const agentGrid = doc.getElementById("agent-grid");
  const progressTrack = doc.querySelector(".progress-track");
  const progressFill = doc.getElementById("progress-fill");

  doc.getElementById("current-score").textContent = data.currentResult.toFixed(2);
  doc.getElementById("score-delta").textContent =
    metrics.delta >= 0 ? `+${metrics.delta.toFixed(2)} above target` : `${metrics.delta.toFixed(2)} below target`;
  doc.getElementById("target-mark").textContent = `Target marker ${data.targetResult.toFixed(2)}`;
  doc.getElementById("current-mark").textContent = `Current ${data.currentResult.toFixed(2)} / 5.00`;
  doc.getElementById("scale-note").textContent = a11yConfig.note;
  doc.getElementById("quest-status").textContent =
    metrics.delta >= 0
      ? "The fortress is safely above the target line."
      : "The fortress needs more high-star wins to reach the target.";

  applyProgressA11y(progressTrack, progressFill, a11yConfig, metrics.progressPercent);

  appendCards(heroStats, [
    { label: "Party size", value: data.totalAgents },
    { label: "Surveyed heroes", value: metrics.surveyedAgents.length },
    { label: "Unscouted heroes", value: metrics.missingAgents.length }
  ].map((item) => {
    const card = createNode(doc, "article", "stat-card");
    card.append(createNode(doc, "span", "", item.label), createNode(doc, "strong", "", String(item.value)));
    return card;
  }));

  appendCards(overviewCards, [
    { label: "Total survey scrolls", value: metrics.totalResponses, note: "All known responses gathered across the guild." },
    { label: "5★ victories", value: metrics.starTotals[5], note: "Top-tier ratings powering the realm average." },
    {
      label: "Lowest active score",
      value: formatScore(Math.min(...metrics.surveyedAgents.map((agent) => agent.score))),
      note: "Best place to focus recovery efforts."
    },
    { label: "Unsurveyed agents", value: metrics.missingAgents.length, note: "Potential bonus points still hidden in the fog." }
  ].map((item) => {
    const card = createNode(doc, "article", "mini-card");
    card.append(
      createNode(doc, "span", "mini-label", item.label),
      createNode(doc, "strong", "mini-value", String(item.value)),
      createNode(doc, "p", "agent-meta", item.note)
    );
    return card;
  }));

  appendCards(starBreakdown, Object.entries(metrics.starTotals)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([star, count]) => {
      const card = createNode(doc, "article", "star-card");
      card.append(
        createNode(doc, "span", "star-label", `${star}★ surveys`),
        createNode(doc, "strong", "star-value", String(count))
      );
      return card;
    }));

  if (metrics.focusAgents.length) {
    appendCards(priorityHeroes, metrics.focusAgents.map((agent) => {
      const card = createNode(doc, "li", "priority-card");
      card.append(
        createNode(doc, "strong", "", agent.name),
        createNode(
          doc,
          "span",
          "agent-meta",
          `Score ${formatScore(agent.score)} · ${totalSurveysForAgent(agent)} surveys logged`
        )
      );
      return card;
    }));
  } else {
    const emptyState = createNode(doc, "li", "empty-state");
    emptyState.append(
      createNode(doc, "strong", "", "All active heroes are at or above target."),
      createNode(doc, "p", "empty-copy", "Keep the castle defended by bringing the unsurveyed agents into the quest.")
    );
    priorityHeroes.append(emptyState);
  }

  appendCards(agentGrid, data.agents.map((agent) => {
    const card = createNode(doc, "li", "agent-card");
    const topLine = createNode(doc, "div", "agent-topline");
    const nameGroup = createNode(doc, "div");
    const surveyBreakdown = createNode(doc, "div", "survey-breakdown");
    const status = agent.surveys ? `${totalSurveysForAgent(agent)} surveys logged` : "Awaiting survey drops";

    nameGroup.append(
      createNode(doc, "strong", "agent-name", agent.name),
      createNode(doc, "span", "agent-tag", status)
    );
    topLine.append(nameGroup, createNode(doc, "span", "agent-score", formatScore(agent.score)));

    if (agent.surveys) {
      Object.entries(agent.surveys)
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .forEach(([star, count]) => {
          surveyBreakdown.append(createNode(doc, "span", "survey-pill", `${count} × ${star}★`));
        });
    } else {
      surveyBreakdown.append(createNode(doc, "span", "survey-pill", "No survey data yet"));
    }

    card.append(
      topLine,
      createNode(doc, "p", "agent-meta", agent.surveys ? "Battle record" : "No tracked score yet"),
      surveyBreakdown
    );

    return card;
  }));
};

if (typeof document !== "undefined") {
  renderTracker(document, trackerData);
}

if (typeof module !== "undefined") {
  module.exports = {
    trackerData,
    formatScore,
    totalSurveysForAgent,
    calculateStarTotals,
    getTrackerMetrics,
    getProgressA11y,
    applyProgressA11y,
    renderTracker
  };
}
