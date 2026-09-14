const trackerData = {
  teamName: "Team 3B",
  totalAgents: 18,
  currentResult: 4.54,
  targetResult: 4.2,
  agents: [
    { name: "Cheah Mun Lok", score: 4.75, surveys: { 5: 3, 4: 1, 3: 0, 2: 0, 1: 0 } },
    { name: "Yong Mee Ting", score: null, surveys: null },
    { name: "Ong Man Yee", score: 5, surveys: { 5: 1, 4: 0, 3: 0, 2: 0, 1: 0 } },
    { name: "Ong Yu Xin", score: null, surveys: null },
    { name: "Yong Pink Ng", score: 4.75, surveys: { 5: 8, 4: 0, 3: 1, 2: 0, 1: 1 } },
    { name: "Wong Ho Yan", score: 3.4, surveys: { 5: 3, 4: 0, 3: 0, 2: 0, 1: 2 } },
    { name: "Chng Pei Mun", score: 3.67, surveys: { 5: 2, 4: 0, 3: 0, 2: 0, 1: 1 } },
    { name: "Nicole Ku", score: 4.38, surveys: { 5: 6, 4: 1, 3: 0, 2: 0, 1: 1 } },
    { name: "Xuan En Jee", score: 5, surveys: { 5: 14, 4: 0, 3: 0, 2: 0, 1: 0 } },
    { name: "Bong Su Feng", score: 5, surveys: { 5: 1, 4: 0, 3: 0, 2: 0, 1: 0 } },
    { name: "Yap Lil Yoon", score: 4, surveys: { 5: 1, 4: 0, 3: 1, 2: 0, 1: 0 } },
    { name: "Sean Tay", score: 4.86, surveys: { 5: 19, 4: 1, 3: 1, 2: 0, 1: 0 } },
    { name: "Chai Min Kang", score: null, surveys: null },
    { name: "Alex Yi", score: null, surveys: null },
    { name: "Tan Meng Kiat", score: null, surveys: null },
    { name: "Roderic Poh", score: 4.43, surveys: { 5: 12, 4: 0, 3: 0, 2: 0, 1: 2 } },
    { name: "Lee Xing Le", score: 3, surveys: { 5: 1, 4: 0, 3: 1, 2: 0, 1: 1 } },
    { name: "Tan Kok Ming", score: 5, surveys: { 5: 9, 4: 0, 3: 0, 2: 0, 1: 0 } }
  ]
};

const starKeys = [5, 4, 3, 2, 1];
const firebaseDefaults = {
  enabled: false,
  editorEmails: [],
  shareUrl: "",
  firestore: {
    collection: "trackers",
    documentId: "team-3b"
  }
};

const formatScore = (value) => (value === null ? "N/A" : value.toFixed(2).replace(/\.00$/, ""));
const cloneTrackerData = (data) => JSON.parse(JSON.stringify(data));
const sanitizeCount = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};
const sanitizeScore = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(0, Math.min(5, Number(parsed.toFixed(2))));
};

const sanitizeText = (value, fallback = "") => String(value ?? fallback).trim();

const normalizeSurveys = (surveys) => {
  if (!surveys) {
    return null;
  }

  const normalized = {};
  starKeys.forEach((star) => {
    normalized[star] = sanitizeCount(surveys[star]);
  });

  return Object.values(normalized).some((count) => count > 0) ? normalized : null;
};

const normalizeAgent = (agent, fallbackAgent = {}) => {
  const name = sanitizeText(agent?.name, fallbackAgent.name);
  return {
    name,
    score: sanitizeScore(agent?.score),
    surveys: normalizeSurveys(agent?.surveys)
  };
};

const normalizeTrackerData = (data, fallbackData = trackerData) => {
  const fallbackAgents = fallbackData.agents || [];
  const rawAgents = Array.isArray(data?.agents) && data.agents.length ? data.agents : fallbackAgents;
  const agents = rawAgents.map((agent, index) => normalizeAgent(agent, fallbackAgents[index] || {}));

  return {
    teamName: sanitizeText(data?.teamName, fallbackData.teamName),
    totalAgents: agents.length,
    currentResult: sanitizeScore(data?.currentResult) ?? fallbackData.currentResult,
    targetResult: sanitizeScore(data?.targetResult) ?? fallbackData.targetResult,
    agents
  };
};

const totalSurveysForAgent = (agent) =>
  agent.surveys ? Object.values(agent.surveys).reduce((sum, value) => sum + value, 0) : 0;

const calculateStarTotals = (agents) =>
  agents.reduce(
    (totals, agent) => {
      if (!agent.surveys) {
        return totals;
      }

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

const getFirebaseConfig = (config) => ({
  ...firebaseDefaults,
  ...(config || {}),
  firestore: {
    ...firebaseDefaults.firestore,
    ...(config?.firestore || {})
  },
  editorEmails: Array.isArray(config?.editorEmails) ? config.editorEmails.map((email) => String(email).toLowerCase()) : []
});

const isConfiguredForLiveSync = (config) =>
  Boolean(
    config.enabled &&
      config.firebaseConfig &&
      config.firebaseConfig.apiKey &&
      config.firebaseConfig.authDomain &&
      config.firebaseConfig.projectId &&
      config.firebaseConfig.appId
  );

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

const clearNode = (node) => {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
};

const appendCards = (container, cards) => {
  cards.forEach((card) => container.append(card));
};

const createInput = (doc, { name, type = "text", value = "", min, max, step, readOnly = false, disabled = false }) => {
  const input = doc.createElement("input");
  input.name = name;
  input.type = type;
  input.value = value;
  input.className = "editor-input";
  input.autocomplete = "off";

  if (min !== undefined) {
    input.min = String(min);
  }
  if (max !== undefined) {
    input.max = String(max);
  }
  if (step !== undefined) {
    input.step = String(step);
  }
  if (readOnly) {
    input.readOnly = true;
  }
  if (disabled) {
    input.disabled = true;
  }

  return input;
};

const createField = (doc, label, input) => {
  const field = createNode(doc, "label", "editor-field");
  field.append(createNode(doc, "span", "editor-label", label), input);
  return field;
};

const renderEditorRows = (doc, tbody, data, canEdit) => {
  clearNode(tbody);

  data.agents.forEach((agent, index) => {
    const row = createNode(doc, "tr");
    const nameCell = createNode(doc, "td", "agent-table-name", agent.name);
    const scoreCell = createNode(doc, "td");
    scoreCell.append(
      createInput(doc, {
        name: `agent-score-${index}`,
        type: "number",
        value: agent.score === null ? "" : String(agent.score),
        min: 0,
        max: 5,
        step: 0.01,
        disabled: !canEdit
      })
    );
    row.append(nameCell, scoreCell);

    starKeys.forEach((star) => {
      const cell = createNode(doc, "td");
      cell.append(
        createInput(doc, {
          name: `agent-${index}-star-${star}`,
          type: "number",
          value: agent.surveys ? String(agent.surveys[star] || 0) : "0",
          min: 0,
          step: 1,
          disabled: !canEdit
        })
      );
      row.append(cell);
    });

    tbody.append(row);
  });
};

const renderEditorForm = (doc, data, canEdit) => {
  const form = doc.getElementById("editor-form");
  const summaryFields = doc.getElementById("editor-summary-fields");
  const tbody = doc.getElementById("editor-agent-rows");
  const saveButton = doc.getElementById("save-button");

  clearNode(summaryFields);
  summaryFields.append(
    createField(
      doc,
      "Team name",
      createInput(doc, {
        name: "teamName",
        value: data.teamName,
        disabled: !canEdit
      })
    ),
    createField(
      doc,
      "Current result",
      createInput(doc, {
        name: "currentResult",
        type: "number",
        value: String(data.currentResult),
        min: 0,
        max: 5,
        step: 0.01,
        disabled: !canEdit
      })
    ),
    createField(
      doc,
      "Target result",
      createInput(doc, {
        name: "targetResult",
        type: "number",
        value: String(data.targetResult),
        min: 0,
        max: 5,
        step: 0.01,
        disabled: !canEdit
      })
    )
  );

  renderEditorRows(doc, tbody, data, canEdit);
  saveButton.disabled = !canEdit;
  form.hidden = false;
};

const applyProgressA11y = (progressTrack, progressFill, a11yConfig, progressPercent) => {
  progressTrack.setAttribute("aria-label", a11yConfig.label);
  progressTrack.setAttribute("aria-valuemin", "0");
  progressTrack.setAttribute("aria-valuemax", String(a11yConfig.max));
  progressTrack.setAttribute("aria-valuenow", String(a11yConfig.now));
  progressTrack.setAttribute("aria-valuetext", a11yConfig.text);
  progressFill.style.width = `${progressPercent}%`;
};

const renderTracker = (doc, data, liveMeta = {}) => {
  const metrics = getTrackerMetrics(data);
  const a11yConfig = getProgressA11y(data, metrics.delta);
  const heroStats = doc.getElementById("hero-stats");
  const overviewCards = doc.getElementById("overview-cards");
  const starBreakdown = doc.getElementById("star-breakdown");
  const priorityHeroes = doc.getElementById("priority-heroes");
  const agentGrid = doc.getElementById("agent-grid");
  const progressTrack = doc.querySelector(".progress-track");
  const progressFill = doc.getElementById("progress-fill");
  const liveStamp = doc.getElementById("live-stamp");

  clearNode(heroStats);
  clearNode(overviewCards);
  clearNode(starBreakdown);
  clearNode(priorityHeroes);
  clearNode(agentGrid);

  doc.getElementById("team-name").textContent = data.teamName;
  doc.getElementById("roster-count").textContent = `All ${data.totalAgents} agents`;
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
  liveStamp.textContent = liveMeta.lastUpdatedText || "Local data loaded";

  applyProgressA11y(progressTrack, progressFill, a11yConfig, metrics.progressPercent);

  appendCards(
    heroStats,
    [
      { label: "Party size", value: data.totalAgents },
      { label: "Surveyed heroes", value: metrics.surveyedAgents.length },
      { label: "Unscouted heroes", value: metrics.missingAgents.length }
    ].map((item) => {
      const card = createNode(doc, "article", "stat-card");
      card.append(createNode(doc, "span", "", item.label), createNode(doc, "strong", "", String(item.value)));
      return card;
    })
  );

  appendCards(
    overviewCards,
    [
      { label: "Total survey scrolls", value: metrics.totalResponses, note: "All known responses gathered across the guild." },
      { label: "5★ victories", value: metrics.starTotals[5], note: "Top-tier ratings powering the realm average." },
      {
        label: "Lowest active score",
        value: metrics.surveyedAgents.length ? formatScore(Math.min(...metrics.surveyedAgents.map((agent) => agent.score))) : "N/A",
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
    })
  );

  appendCards(
    starBreakdown,
    Object.entries(metrics.starTotals)
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([star, count]) => {
        const card = createNode(doc, "article", "star-card");
        card.append(createNode(doc, "span", "star-label", `${star}★ surveys`), createNode(doc, "strong", "star-value", String(count)));
        return card;
      })
  );

  if (metrics.focusAgents.length) {
    appendCards(
      priorityHeroes,
      metrics.focusAgents.map((agent) => {
        const card = createNode(doc, "li", "priority-card");
        card.append(
          createNode(doc, "strong", "", agent.name),
          createNode(doc, "span", "agent-meta", `Score ${formatScore(agent.score)} · ${totalSurveysForAgent(agent)} surveys logged`)
        );
        return card;
      })
    );
  } else {
    const emptyState = createNode(doc, "li", "empty-state");
    emptyState.append(
      createNode(doc, "strong", "", "All active heroes are at or above target."),
      createNode(doc, "p", "empty-copy", "Keep the castle defended by bringing the unsurveyed agents into the quest.")
    );
    priorityHeroes.append(emptyState);
  }

  appendCards(
    agentGrid,
    data.agents.map((agent) => {
      const card = createNode(doc, "li", "agent-card");
      const topLine = createNode(doc, "div", "agent-topline");
      const nameGroup = createNode(doc, "div");
      const surveyBreakdown = createNode(doc, "div", "survey-breakdown");
      const status = agent.surveys ? `${totalSurveysForAgent(agent)} surveys logged` : "Awaiting survey drops";

      nameGroup.append(createNode(doc, "strong", "agent-name", agent.name), createNode(doc, "span", "agent-tag", status));
      topLine.append(nameGroup, createNode(doc, "span", "agent-score", formatScore(agent.score)));

      if (agent.surveys) {
        starKeys.forEach((star) => {
          if (agent.surveys[star] > 0) {
            surveyBreakdown.append(createNode(doc, "span", "survey-pill", `${agent.surveys[star]} × ${star}★`));
          }
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
    })
  );
};

const formatTimestamp = (value) => {
  if (!value) {
    return "Waiting for first live sync";
  }

  const parsed = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Waiting for first live sync";
  }

  return `Live update ${parsed.toLocaleString()}`;
};

const collectFormData = (form, currentData) => {
  const formData = new FormData(form);
  const nextData = {
    teamName: sanitizeText(formData.get("teamName"), currentData.teamName),
    totalAgents: currentData.agents.length,
    currentResult: sanitizeScore(formData.get("currentResult")) ?? currentData.currentResult,
    targetResult: sanitizeScore(formData.get("targetResult")) ?? currentData.targetResult,
    agents: currentData.agents.map((agent, index) => {
      const surveys = {};
      starKeys.forEach((star) => {
        surveys[star] = sanitizeCount(formData.get(`agent-${index}-star-${star}`));
      });

      return {
        name: agent.name,
        score: sanitizeScore(formData.get(`agent-score-${index}`)),
        surveys: Object.values(surveys).some((count) => count > 0) ? surveys : null
      };
    })
  };

  return normalizeTrackerData(nextData, currentData);
};

const updateLiveStatus = (doc, message, tone = "info") => {
  const status = doc.getElementById("sync-status");
  status.textContent = message;
  status.dataset.tone = tone;
};

const toggleEditorButtons = (doc, { canEdit, signedIn }) => {
  doc.getElementById("sign-in-button").hidden = signedIn;
  doc.getElementById("sign-out-button").hidden = !signedIn;
  doc.getElementById("save-button").disabled = !canEdit;
};

const syncShareLink = (doc, config) => {
  const shareUrl = config.shareUrl || (typeof window !== "undefined" ? window.location.href : "");
  const link = doc.getElementById("share-link");
  const input = doc.getElementById("share-url");
  link.href = shareUrl;
  link.textContent = shareUrl;
  input.value = shareUrl;
};

const initializeLiveTracker = async (doc, config) => {
  const state = {
    config,
    data: cloneTrackerData(trackerData),
    firebaseReady: false,
    canEdit: false,
    currentUser: null,
    liveMeta: {}
  };

  renderTracker(doc, state.data, state.liveMeta);
  renderEditorForm(doc, state.data, false);
  syncShareLink(doc, config);

  if (!isConfiguredForLiveSync(config) || typeof window === "undefined" || !window.firebase) {
    updateLiveStatus(doc, "Live sync is not configured yet. Add your Firebase config to firebase-config.js.", "warn");
    return state;
  }

  if (!window.firebase.apps.length) {
    window.firebase.initializeApp(config.firebaseConfig);
  }

  const auth = window.firebase.auth();
  const db = window.firebase.firestore();
  const provider = new window.firebase.auth.GoogleAuthProvider();
  const docRef = db.collection(config.firestore.collection).doc(config.firestore.documentId);

  state.firebaseReady = true;
  updateLiveStatus(doc, "Connecting to the live crystal archive…", "info");

  doc.getElementById("sign-in-button").addEventListener("click", async () => {
    try {
      await auth.signInWithPopup(provider);
    } catch (error) {
      updateLiveStatus(doc, error.message || "Google sign-in failed.", "error");
    }
  });

  doc.getElementById("sign-out-button").addEventListener("click", async () => {
    await auth.signOut();
  });

  auth.onAuthStateChanged((user) => {
    state.currentUser = user;
    const email = user?.email ? user.email.toLowerCase() : "";
    state.canEdit = Boolean(email && config.editorEmails.includes(email));
    doc.getElementById("editor-user").textContent = user ? `Signed in as ${user.email}` : "Not signed in";
    toggleEditorButtons(doc, { canEdit: state.canEdit, signedIn: Boolean(user) });
    renderEditorForm(doc, state.data, state.canEdit);

    if (!user) {
      updateLiveStatus(doc, "View mode active. Sign in with an approved Google account to edit live data.", "info");
    } else if (state.canEdit) {
      updateLiveStatus(doc, "Editor access granted. Changes save live for everyone.", "success");
    } else {
      updateLiveStatus(doc, "Signed in, but this Google account is not in the editor allowlist.", "warn");
    }
  });

  doc.getElementById("editor-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!state.canEdit) {
      updateLiveStatus(doc, "You need approved editor access before saving.", "error");
      return;
    }

    const nextData = collectFormData(event.currentTarget, state.data);

    try {
      await docRef.set(
        {
          ...nextData,
          updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
          updatedBy: state.currentUser?.email || "unknown"
        },
        { merge: false }
      );
      updateLiveStatus(doc, "Live tracker saved.", "success");
    } catch (error) {
      updateLiveStatus(doc, error.message || "Saving failed.", "error");
    }
  });

  docRef.onSnapshot(
    (snapshot) => {
      if (snapshot.exists) {
        const remote = snapshot.data();
        state.data = normalizeTrackerData(remote, trackerData);
        state.liveMeta = {
          lastUpdatedText: `${formatTimestamp(remote.updatedAt)}${remote.updatedBy ? ` by ${remote.updatedBy}` : ""}`
        };
      } else {
        state.data = cloneTrackerData(trackerData);
        state.liveMeta = {
          lastUpdatedText: "No live document yet — showing starter data"
        };
      }

      renderTracker(doc, state.data, state.liveMeta);
      renderEditorForm(doc, state.data, state.canEdit);
    },
    (error) => {
      updateLiveStatus(doc, error.message || "Live sync failed.", "error");
    }
  );

  return state;
};

if (typeof document !== "undefined") {
  const config = getFirebaseConfig(window.ASAT_FIREBASE_CONFIG);
  initializeLiveTracker(document, config);
}

if (typeof module !== "undefined") {
  module.exports = {
    trackerData,
    starKeys,
    formatScore,
    cloneTrackerData,
    sanitizeCount,
    sanitizeScore,
    normalizeSurveys,
    normalizeAgent,
    normalizeTrackerData,
    totalSurveysForAgent,
    calculateStarTotals,
    getTrackerMetrics,
    getProgressA11y,
    getFirebaseConfig,
    isConfiguredForLiveSync,
    collectFormData,
    applyProgressA11y,
    formatTimestamp
  };
}
