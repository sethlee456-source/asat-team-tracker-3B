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

const surveyedAgents = trackerData.agents.filter((agent) => agent.surveys);
const missingAgents = trackerData.agents.filter((agent) => !agent.surveys);
const totalResponses = surveyedAgents.reduce(
  (sum, agent) => sum + Object.values(agent.surveys).reduce((count, value) => count + value, 0),
  0
);
const starTotals = surveyedAgents.reduce(
  (totals, agent) => {
    Object.entries(agent.surveys).forEach(([star, count]) => {
      totals[star] = (totals[star] || 0) + count;
    });
    return totals;
  },
  { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
);
const progressPercent = Math.min((trackerData.currentResult / trackerData.targetResult) * 100, 100);
const delta = trackerData.currentResult - trackerData.targetResult;
const focusAgents = surveyedAgents
  .filter((agent) => agent.score < trackerData.targetResult)
  .sort((a, b) => a.score - b.score);

const formatScore = (value) => (value === null ? "N/A" : value.toFixed(2).replace(/\.00$/, ""));
const totalSurveysForAgent = (agent) =>
  agent.surveys ? Object.values(agent.surveys).reduce((sum, value) => sum + value, 0) : 0;
const createNode = (tagName, className, text) => {
  const node = document.createElement(tagName);

  if (className) {
    node.className = className;
  }

  if (text !== undefined) {
    node.textContent = text;
  }

  return node;
};

document.getElementById("current-score").textContent = trackerData.currentResult.toFixed(2);
document.getElementById("score-delta").textContent =
  delta >= 0 ? `+${delta.toFixed(2)} above target` : `${delta.toFixed(2)} below target`;
document.getElementById("target-mark").textContent = `Target marker ${trackerData.targetResult.toFixed(2)}`;
document.getElementById("current-mark").textContent = `Current ${trackerData.currentResult.toFixed(2)} / 5.00`;
document.getElementById("scale-note").textContent = "Bar fills to 100% once the 4.20 target is reached.";
document.getElementById("quest-status").textContent =
  delta >= 0
    ? "The fortress is safely above the target line."
    : "The fortress needs more high-star wins to reach the target.";
document.getElementById("progress-fill").style.width = `${progressPercent}%`;
document
  .querySelector(".progress-track")
  .setAttribute("aria-valuenow", String(Math.min(trackerData.currentResult, trackerData.targetResult)));
document
  .querySelector(".progress-track")
  .setAttribute(
    "aria-valuetext",
    delta >= 0
      ? `Target reached. Current score ${trackerData.currentResult.toFixed(2)} exceeds the ${trackerData.targetResult.toFixed(2)} target.`
      : `Current score ${trackerData.currentResult.toFixed(2)} out of ${trackerData.targetResult.toFixed(2)} target.`
  );

[
  { label: "Party size", value: trackerData.totalAgents },
  { label: "Surveyed heroes", value: surveyedAgents.length },
  { label: "Unscouted heroes", value: missingAgents.length }
]
  .forEach((item) => {
    const card = createNode("article", "stat-card");
    card.append(createNode("span", "", item.label), createNode("strong", "", String(item.value)));
    document.getElementById("hero-stats").append(card);
  });

[
  { label: "Total survey scrolls", value: totalResponses, note: "All known responses gathered across the guild." },
  { label: "5★ victories", value: starTotals[5], note: "Top-tier ratings powering the realm average." },
  { label: "Lowest active score", value: formatScore(Math.min(...surveyedAgents.map((agent) => agent.score))), note: "Best place to focus recovery efforts." },
  { label: "Unsurveyed agents", value: missingAgents.length, note: "Potential bonus points still hidden in the fog." }
]
  .forEach((item) => {
    const card = createNode("article", "mini-card");
    card.append(
      createNode("span", "mini-label", item.label),
      createNode("strong", "mini-value", String(item.value)),
      createNode("p", "agent-meta", item.note)
    );
    document.getElementById("overview-cards").append(card);
  });

Object.entries(starTotals)
  .sort((a, b) => Number(b[0]) - Number(a[0]))
  .forEach(([star, count]) => {
    const card = createNode("article", "star-card");
    card.append(
      createNode("span", "star-label", `${star}★ surveys`),
      createNode("strong", "star-value", String(count))
    );
    document.getElementById("star-breakdown").append(card);
  });

if (focusAgents.length) {
  focusAgents.forEach((agent) => {
    const card = createNode("li", "priority-card");
    card.append(
      createNode("strong", "", agent.name),
      createNode(
        "span",
        "agent-meta",
        `Score ${formatScore(agent.score)} · ${totalSurveysForAgent(agent)} surveys logged`
      )
    );
    document.getElementById("priority-heroes").append(card);
  });
} else {
  const emptyState = createNode("li", "empty-state");
  emptyState.append(
    createNode("strong", "", "All active heroes are at or above target."),
    createNode(
      "p",
      "empty-copy",
      "Keep the castle defended by bringing the unsurveyed agents into the quest."
    )
  );
  document.getElementById("priority-heroes").append(emptyState);
}

trackerData.agents.forEach((agent) => {
  const card = createNode("li", "agent-card");
  const topLine = createNode("div", "agent-topline");
  const nameGroup = createNode("div");
  const surveyBreakdown = createNode("div", "survey-breakdown");
  const status = agent.surveys ? `${totalSurveysForAgent(agent)} surveys logged` : "Awaiting survey drops";

  nameGroup.append(
    createNode("strong", "agent-name", agent.name),
    createNode("span", "agent-tag", status)
  );
  topLine.append(nameGroup, createNode("span", "agent-score", formatScore(agent.score)));

  if (agent.surveys) {
    Object.entries(agent.surveys)
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .forEach(([star, count]) => {
        surveyBreakdown.append(createNode("span", "survey-pill", `${count} × ${star}★`));
      });
  } else {
    surveyBreakdown.append(createNode("span", "survey-pill", "No survey data yet"));
  }

  card.append(
    topLine,
    createNode("p", "agent-meta", agent.surveys ? "Battle record" : "No tracked score yet"),
    surveyBreakdown
  );
  document.getElementById("agent-grid").append(card);
});
