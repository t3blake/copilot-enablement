const STATUS_META = {
  not_reviewed: { label: "Not Reviewed", score: 0, countsAsAnswered: false, applicable: true },
  not_started: { label: "Not Started", score: 0, countsAsAnswered: true, applicable: true },
  in_planning: { label: "In Planning", score: 0.2, countsAsAnswered: true, applicable: true },
  planned: { label: "Planned", score: 0.35, countsAsAnswered: true, applicable: true },
  in_progress: { label: "In Progress", score: 0.6, countsAsAnswered: true, applicable: true },
  completed: { label: "Completed", score: 1, countsAsAnswered: true, applicable: true },
  blocked: { label: "Blocked", score: 0.15, countsAsAnswered: true, applicable: true },
  first_party_other: { label: "First Party Other", score: 0.5, countsAsAnswered: true, applicable: true },
  third_party: { label: "Third Party", score: 0.5, countsAsAnswered: true, applicable: true },
  will_not_pursue: { label: "Will Not Pursue", score: 0, countsAsAnswered: true, applicable: true },
  ms_roadmap: { label: "MS Roadmap", score: 0.45, countsAsAnswered: true, applicable: true },
  follow_up: { label: "Follow Up", score: 0.25, countsAsAnswered: true, applicable: true },
  not_applicable: { label: "Not Applicable", score: 0, countsAsAnswered: true, applicable: false },
};
const LANE_ORDER = ["first", "then", "later"];

const state = {
  questions: [],
  responses: {},
  collapsedWorkloads: {},
  selectedTaskId: null,
  questionBanks: {
    core: [],
    backlog: [],
  },
};

const el = {
  assessmentView: document.getElementById("assessment-view"),
  clearAnswersBtn: document.getElementById("clear-answers-btn"),
  boardRows: document.getElementById("board-rows"),
  progressLabel: document.getElementById("progress-label"),
  progressFill: document.getElementById("progress-fill"),
  overallScore: document.getElementById("overall-score"),
  highGapCount: document.getElementById("high-gap-count"),
  answeredCount: document.getElementById("answered-count"),
  topActions: document.getElementById("top-actions"),
  workloadScores: document.getElementById("workload-scores"),
  statusBadge: document.getElementById("status-badge"),
  downloadJsonBtn: document.getElementById("download-json-btn"),
  importFile: document.getElementById("import-file"),
  importFeedback: document.getElementById("import-feedback"),
  detailPanel: document.getElementById("detail-panel"),
  detailTaskTitle: document.getElementById("detail-task-title"),
  detailCloseBtn: document.getElementById("detail-close-btn"),
  detailStatus: document.getElementById("detail-status"),
  detailNotes: document.getElementById("detail-notes"),
  charUsed: document.getElementById("char-used"),
  detailLearnLink: document.getElementById("detail-learn-link"),
  detailOwner: document.getElementById("detail-owner"),
  savedOwnerSelect: document.getElementById("saved-owner-select"),
  ownerSuggestions: document.getElementById("owner-suggestions"),
  detailLane: document.getElementById("detail-lane"),
  summaryTabTracker: document.getElementById("summary-tab-tracker"),
  summaryTabScorecard: document.getElementById("summary-tab-scorecard"),
  summaryPaneTracker: document.getElementById("summary-pane-tracker"),
  summaryPaneScorecard: document.getElementById("summary-pane-scorecard"),
  referencesBtn: document.getElementById("references-btn"),
  referencesPanel: document.getElementById("references-panel"),
  referencesCloseBtn: document.getElementById("references-close-btn"),
};

function setSummaryTab(tabKey) {
  const trackerActive = tabKey === "tracker";

  el.summaryTabTracker?.classList.toggle("active", trackerActive);
  el.summaryTabScorecard?.classList.toggle("active", !trackerActive);
  el.summaryTabTracker?.setAttribute("aria-selected", String(trackerActive));
  el.summaryTabScorecard?.setAttribute("aria-selected", String(!trackerActive));

  el.summaryPaneTracker?.classList.toggle("hidden", !trackerActive);
  el.summaryPaneScorecard?.classList.toggle("hidden", trackerActive);
}

function criticalityRank(value) {
  if (value === "high") return 3;
  if (value === "medium") return 2;
  return 1;
}

function laneRank(value) {
  if (value === "first") return 1;
  if (value === "then") return 2;
  return 3;
}

function getInfoUrl(question) {
  const sourceUrl = String(question?.sourceUrl || "").trim();
  if (!/^https?:\/\//i.test(sourceUrl)) return "";
  return sourceUrl;
}

function normalizeQuestion(rawQuestion, fallbackIndex) {
  const safeCriticality =
    rawQuestion.criticality === "high" || rawQuestion.criticality === "medium" || rawQuestion.criticality === "low"
      ? rawQuestion.criticality
      : "medium";
  const safeDefaultLane = LANE_ORDER.includes(rawQuestion.lane) ? rawQuestion.lane : "";
  const safeWeight = Number.isFinite(Number(rawQuestion.weight)) ? Number(rawQuestion.weight) : 0;

  return {
    id: rawQuestion.id || `QX-${fallbackIndex + 1}`,
    controlId: rawQuestion.controlId || null,
    workload: rawQuestion.workload || rawQuestion.topic || "General",
    criticality: safeCriticality,
    weight: safeWeight,
    prompt: rawQuestion.prompt || "Question text unavailable.",
    remediationHint:
      rawQuestion.remediationHint ||
      "Review this control, document current state, and assign an owner for remediation.",
    defaultLane: safeDefaultLane,
    sourceUrl: String(rawQuestion.sourceUrl || "").trim(),
  };
}

function getResponse(id) {
  if (!state.responses[id]) {
    state.responses[id] = { status: "not_reviewed", comment: "", owner: "", lane: "" };
  }
  return state.responses[id];
}

function setQuestionSet(includeBacklog) {
  const byId = new Map();

  state.questionBanks.core.forEach((q, idx) => {
    const normalized = normalizeQuestion(q, idx);
    byId.set(normalized.id, normalized);
  });

  if (includeBacklog) {
    state.questionBanks.backlog.forEach((q, idx) => {
      const normalized = normalizeQuestion(q, idx + 1000);
      byId.set(normalized.id, normalized);
    });
  }

  state.questions = Array.from(byId.values()).sort((a, b) => {
    const workloadCompare = String(a.workload).localeCompare(String(b.workload));
    if (workloadCompare !== 0) return workloadCompare;
    return String(a.id).localeCompare(String(b.id));
  });

  const validIds = new Set(state.questions.map((q) => q.id));
  state.responses = Object.fromEntries(
    Object.entries(state.responses).filter(([id]) => validIds.has(id))
  );
}

function getAnswerCount() {
  return state.questions.filter((q) => {
    const status = getResponse(q.id).status || "not_reviewed";
    return Boolean(STATUS_META[status]?.countsAsAnswered);
  }).length;
}

function getKnownOwners() {
  return Array.from(
    new Set(
      Object.values(state.responses)
        .map((response) => String(response?.owner || "").trim())
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right));
}

function renderOwnerSuggestions() {
  if (!el.ownerSuggestions || !el.savedOwnerSelect) return;

  const owners = getKnownOwners();
  el.ownerSuggestions.innerHTML = "";
  owners.forEach((owner) => {
    const option = document.createElement("option");
    option.value = owner;
    el.ownerSuggestions.appendChild(option);
  });

  el.savedOwnerSelect.innerHTML = '<option value="">Saved owners</option>';
  owners.forEach((owner) => {
    const option = document.createElement("option");
    option.value = owner;
    option.textContent = owner;
    el.savedOwnerSelect.appendChild(option);
  });
}

function updateProgress() {
  const answered = getAnswerCount();
  const total = state.questions.length;
  el.progressLabel.textContent = `${answered}/${total} answered`;
  const pct = total === 0 ? 0 : (answered / total) * 100;
  el.progressFill.style.width = `${Math.round(pct)}%`;
}

function statusLabel(status) {
  return STATUS_META[status]?.label || STATUS_META.not_reviewed.label;
}

function statusScore(status) {
  return STATUS_META[status]?.score ?? 0;
}

function defaultLaneForQuestion(question) {
  if (LANE_ORDER.includes(question.defaultLane)) return question.defaultLane;
  if (question.criticality === "high") return "first";
  if (question.criticality === "medium") return "then";
  return "later";
}

function getLaneForQuestion(question) {
  const lane = getResponse(question.id).lane;
  if (LANE_ORDER.includes(lane)) return lane;
  return defaultLaneForQuestion(question);
}

function selectTask(questionId) {
  state.selectedTaskId = questionId;
  const question = state.questions.find((q) => q.id === questionId);
  if (!question) return;

  const response = getResponse(questionId);
  renderOwnerSuggestions();
  el.detailTaskTitle.textContent = question.prompt;
  el.detailStatus.value = response.status || "not_reviewed";
  el.detailNotes.value = response.comment || "";
  el.charUsed.textContent = String((response.comment || "").length);
  el.detailOwner.value = response.owner || "";
  el.detailLane.value = getLaneForQuestion(question);
  if (el.detailLearnLink) {
    const infoUrl = getInfoUrl(question);
    el.detailLearnLink.href = infoUrl;
    el.detailLearnLink.hidden = !infoUrl;
    el.detailLearnLink.setAttribute("aria-label", `Open more information for ${question.id}`);
  }

  el.detailPanel.classList.remove("hidden");
  el.detailPanel.setAttribute("aria-hidden", "false");
  document.body.classList.add("detail-panel-open");

  document.querySelectorAll(".task-card.selected").forEach((card) => {
    card.classList.remove("selected");
  });
  document.querySelector(`[data-task-id="${questionId}"]`)?.classList.add("selected");
  el.detailStatus.focus();
}

function closeDetailPanel() {
  state.selectedTaskId = null;
  el.detailPanel.classList.add("hidden");
  el.detailPanel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("detail-panel-open");
  document.querySelectorAll(".task-card.selected").forEach((card) => {
    card.classList.remove("selected");
  });
}

function openReferencesPanel() {
  el.referencesPanel?.classList.remove("hidden");
  el.referencesPanel?.setAttribute("aria-hidden", "false");
  el.referencesPanel?.focus();
}

function closeReferencesPanel() {
  el.referencesPanel?.classList.add("hidden");
  el.referencesPanel?.setAttribute("aria-hidden", "true");
}

function renderQuestions() {
  el.boardRows.innerHTML = "";

  const grouped = new Map();
  state.questions.forEach((q) => {
    const key = q.workload || "General";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(q);
  });

  grouped.forEach((questions, workload) => {
    const total = questions.length;
    const answered = questions.filter((q) => {
      const status = getResponse(q.id).status || "not_reviewed";
      return Boolean(STATUS_META[status]?.countsAsAnswered);
    }).length;
    const applicable = questions.filter((q) => STATUS_META[getResponse(q.id).status || "not_reviewed"]?.applicable);
    const earned = applicable.reduce((sum, q) => sum + statusScore(getResponse(q.id).status || "not_reviewed"), 0);
    const score = applicable.length === 0 ? 0 : Math.round((earned / applicable.length) * 100);

    const row = document.createElement("section");
    row.className = "board-row";

    const areaCell = document.createElement("div");
    areaCell.className = "board-area-cell";
    areaCell.innerHTML = `
      <h3>${workload}</h3>
      <p>${answered}/${total} reviewed</p>
      <span class="area-score">${score}%</span>
    `;

    const laneColumns = document.createElement("div");
    laneColumns.className = "board-lanes";

    LANE_ORDER.forEach((laneKey) => {
      const lane = document.createElement("div");
      lane.className = `board-lane ${laneKey}`;

      const laneQuestions = questions.filter((q) => getLaneForQuestion(q) === laneKey);

      if (laneQuestions.length === 0) {
        const empty = document.createElement("div");
        empty.className = "lane-empty";
        let emptyMsg = "No tasks";
        if (laneKey === "first") {
          emptyMsg = "Pilot prerequisites covered";
        } else if (laneKey === "then") {
          emptyMsg = "Hardening work not queued";
        } else if (laneKey === "later") {
          emptyMsg = "Advanced governance later";
        }
        empty.textContent = emptyMsg;
        lane.appendChild(empty);
      } else {
        laneQuestions.forEach((q) => {
          const response = getResponse(q.id);

          const card = document.createElement("article");
          card.className = "task-card";
          card.innerHTML = `
            <div class="card-badges">
              <span class="task-badge id">${q.id}</span>
              <span class="task-badge criticality ${q.criticality}">${q.criticality.toUpperCase()}</span>
              <span class="task-badge status">${statusLabel(response.status || "not_reviewed")}</span>
            </div>
            <h4>${q.prompt}</h4>
          `;

          card.setAttribute("data-task-id", q.id);
          card.addEventListener("click", () => {
            selectTask(q.id);
          });

          lane.appendChild(card);
        });
      }

      laneColumns.appendChild(lane);
    });

    row.appendChild(areaCell);
    row.appendChild(laneColumns);
    el.boardRows.appendChild(row);
  });

  updateProgress();
}

function computeResults() {
  const applicableQuestions = state.questions.filter(
    (q) => STATUS_META[getResponse(q.id).status || "not_reviewed"]?.applicable
  );
  const totalScore = applicableQuestions.reduce(
    (sum, q) => sum + statusScore(getResponse(q.id).status || "not_reviewed"),
    0
  );
  const overallPct = applicableQuestions.length === 0 ? 0 : (totalScore / applicableQuestions.length) * 100;

  const workloadMap = new Map();
  state.questions.forEach((q) => {
    const key = q.workload || "General";
    if (!workloadMap.has(key)) workloadMap.set(key, { earned: 0, count: 0 });
    const bucket = workloadMap.get(key);
    const status = getResponse(q.id).status || "not_reviewed";
    if (STATUS_META[status]?.applicable) {
      bucket.earned += statusScore(status);
      bucket.count += 1;
    }
  });

  const workloadScores = Array.from(workloadMap.entries()).map(([workload, v]) => ({
    workload,
    score: v.count === 0 ? 0 : Math.round((v.earned / v.count) * 100),
  }));

  const gaps = state.questions
    .map((q) => {
      const response = getResponse(q.id);
      const status = response.status || "not_reviewed";
      const meta = STATUS_META[status] || STATUS_META.not_reviewed;
      return {
        q,
        response,
        status,
        meta,
        score: statusScore(status),
        lane: getLaneForQuestion(q),
        weight: Number.isFinite(Number(q.weight)) ? Number(q.weight) : 0,
      };
    })
    .filter((x) => x.meta.applicable && x.status !== "completed")
    .sort((a, b) => {
      if (a.q.criticality !== b.q.criticality) {
        return criticalityRank(b.q.criticality) - criticalityRank(a.q.criticality);
      }
      if (a.lane !== b.lane) {
        return laneRank(a.lane) - laneRank(b.lane);
      }
      if (a.score !== b.score) {
        return a.score - b.score;
      }
      if (a.weight !== b.weight) {
        return b.weight - a.weight;
      }
      return String(a.q.id).localeCompare(String(b.q.id));
    });

  const highGapCount = gaps.filter((x) => x.q.criticality === "high").length;

  return {
    overallPct: Math.round(overallPct),
    highGapCount,
    answeredCount: getAnswerCount(),
    topActions: gaps.slice(0, 6),
    workloadScores,
  };
}

function renderResults() {
  const results = computeResults();
  const compactActionText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1)}...`;
  };

  el.overallScore.textContent = `${results.overallPct}%`;
  el.highGapCount.textContent = String(results.highGapCount);
  el.answeredCount.textContent = `${results.answeredCount}/${state.questions.length}`;

  // Apply color classes to summary metric cells
  const overallMetric = el.overallScore.closest(".summary-cell");
  const highGapMetric = el.highGapCount.closest(".summary-cell");
  
  overallMetric?.classList.remove("score-ready", "score-caution", "score-action");
  highGapMetric?.classList.remove("score-ready", "score-caution", "score-action");
  
  if (results.overallPct >= 80) {
    el.statusBadge.textContent = "Ready";
    el.statusBadge.className = "status-badge green";
    overallMetric?.classList.add("score-ready");
  } else if (results.overallPct >= 60) {
    el.statusBadge.textContent = "Caution";
    el.statusBadge.className = "status-badge amber";
    overallMetric?.classList.add("score-caution");
  } else {
    el.statusBadge.textContent = "Action Needed";
    el.statusBadge.className = "status-badge red";
    overallMetric?.classList.add("score-action");
  }
  
  // High gaps indicator
  if (results.highGapCount > 5) {
    highGapMetric?.classList.add("score-action");
  } else if (results.highGapCount > 2) {
    highGapMetric?.classList.add("score-caution");
  } else {
    highGapMetric?.classList.add("score-ready");
  }

  el.topActions.innerHTML = "";
  results.topActions.forEach((item) => {
    const li = document.createElement("li");
    li.className = "top-action-item";
    const ownerText = item.response.owner ? ` (owner: ${item.response.owner})` : "";
    const fullText = `${item.q.remediationHint}${ownerText}`;
    li.textContent = compactActionText(fullText);
    li.title = fullText;
    el.topActions.appendChild(li);
  });

  el.workloadScores.innerHTML = "";
  results.workloadScores
    .sort((a, b) => b.score - a.score)
    .forEach((entry) => {
      const row = document.createElement("div");
      row.className = "workload-row";
      row.innerHTML = `<span class="workload-name">${entry.workload}</span><span class="workload-score">${entry.score}%</span>`;
      el.workloadScores.appendChild(row);
    });
}



async function loadQuestionBanks() {
  const baseRes = await fetch("data/questions.json");
  if (!baseRes.ok) throw new Error("Unable to load question bank.");

  const questionBank = await baseRes.json();
  state.questionBanks.core = Array.isArray(questionBank.questions) ? questionBank.questions : [];

  try {
    const privateRes = await fetch("data/questions.private.json", { cache: "no-store" });
    if (privateRes.ok) {
      const privateBank = await privateRes.json();
      if (Array.isArray(privateBank.questions) && privateBank.questions.length > 0) {
        state.questionBanks.core = state.questionBanks.core.concat(privateBank.questions);
      }
    }
  } catch {
    // Optional private overlay load.
  }
}

function refreshTracker() {
  setQuestionSet(true);
  renderOwnerSuggestions();
  renderQuestions();
  renderResults();
}

function setImportFeedback(message, tone = "info") {
  if (!el.importFeedback) return;
  el.importFeedback.textContent = message;
  el.importFeedback.className = `import-feedback visible ${tone}`;

  window.clearTimeout(setImportFeedback.timeoutId);
  setImportFeedback.timeoutId = window.setTimeout(() => {
    if (el.importFeedback) {
      el.importFeedback.textContent = "";
      el.importFeedback.className = "import-feedback";
    }
  }, 2600);
}

function clearAllAnswers() {
  const hasAnyData = Object.values(state.responses).some((response) => {
    const status = String(response?.status || "").trim();
    const comment = String(response?.comment || "").trim();
    const owner = String(response?.owner || "").trim();
    return Boolean((status && status !== "not_reviewed") || comment || owner);
  });

  if (!hasAnyData) {
    setImportFeedback("Nothing to clear.", "info");
    return;
  }

  const confirmed = window.confirm("Clear all answers, notes, owners, and lane overrides?");
  if (!confirmed) return;

  state.responses = {};
  closeDetailPanel();
  refreshTracker();
  setImportFeedback("All answers cleared.", "success");
}

function downloadSnapshot() {
  const payload = {
    exportVersion: "0.2",
    exportedAt: new Date().toISOString(),
    includeBacklog: true,
    responses: state.responses,
    results: computeResults(),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "copilot-readiness-tracker-snapshot.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

function importSnapshot(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!parsed.responses || typeof parsed.responses !== "object") {
        throw new Error("Invalid snapshot format.");
      }
      state.responses = parsed.responses;
      refreshTracker();
      setImportFeedback(`Imported ${file.name} successfully.`, "success");
    } catch {
      setImportFeedback("Could not import JSON snapshot.", "error");
    }
  };
  reader.readAsText(file);
}

function wireEvents() {
  el.clearAnswersBtn?.addEventListener("click", clearAllAnswers);

  el.summaryTabTracker?.addEventListener("click", () => {
    setSummaryTab("tracker");
  });

  el.summaryTabScorecard?.addEventListener("click", () => {
    setSummaryTab("scorecard");
  });

  el.downloadJsonBtn.addEventListener("click", downloadSnapshot);

  el.importFile.addEventListener("change", (event) => {
    const target = event.target;
    if (target.files && target.files[0]) {
      importSnapshot(target.files[0]);
      target.value = "";
    }
  });

  el.detailCloseBtn.addEventListener("click", closeDetailPanel);
  el.referencesBtn?.addEventListener("click", openReferencesPanel);
  el.referencesCloseBtn?.addEventListener("click", closeReferencesPanel);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!el.referencesPanel?.classList.contains("hidden")) {
        closeReferencesPanel();
      } else if (state.selectedTaskId) {
        closeDetailPanel();
      }
    }
  });

  el.detailStatus.addEventListener("change", () => {
    if (state.selectedTaskId) {
      getResponse(state.selectedTaskId).status = el.detailStatus.value;
      updateProgress();
      renderResults();
      renderQuestions();
      selectTask(state.selectedTaskId);
    }
  });

  el.detailNotes.addEventListener("input", () => {
    if (state.selectedTaskId) {
      const val = el.detailNotes.value.slice(0, 1000);
      el.detailNotes.value = val;
      el.charUsed.textContent = String(val.length);
      getResponse(state.selectedTaskId).comment = val;
    }
  });

  el.detailOwner.addEventListener("input", () => {
    if (state.selectedTaskId) {
      getResponse(state.selectedTaskId).owner = el.detailOwner.value.trim();
      renderOwnerSuggestions();
      el.savedOwnerSelect.value = "";
    }
  });

  el.savedOwnerSelect?.addEventListener("change", () => {
    if (state.selectedTaskId && el.savedOwnerSelect.value) {
      el.detailOwner.value = el.savedOwnerSelect.value;
      getResponse(state.selectedTaskId).owner = el.savedOwnerSelect.value;
      renderOwnerSuggestions();
    }
  });

  el.detailLane.addEventListener("change", () => {
    if (state.selectedTaskId) {
      getResponse(state.selectedTaskId).lane = el.detailLane.value;
      renderQuestions();
      selectTask(state.selectedTaskId);
    }
  });
}


async function init() {
  await loadQuestionBanks();
  refreshTracker();
  wireEvents();
}

init().catch(() => {
  window.alert("Failed to initialize tracker. Check data files.");
});
