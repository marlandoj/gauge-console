import { classify, HARNESSES, TIERS, VERSION, swarmTier } from "./classifier.js";
const descriptions = {
  trivial: "A direct lookup or a small, well-defined answer.",
  simple: "A bounded edit or a straightforward operation.",
  moderate: "Engineering work with a contained scope.",
  complex: "Interacting systems, coordination or recovery constraints.",
  apex: "Research, proof obligations or novel cross-domain reasoning."
};
const explanations = {
  bounded_lookup: "The request matches a lookup, extraction or direct-answer rule.",
  bounded_edit: "The request matches a limited edit or a small isolated change.",
  bounded_operation: "The request matches a straightforward action rule.",
  bounded_engineering: "The request matches feature work, analysis or implementation within a bounded scope.",
  systemic_reasoning: "System-level constraints appear alongside a request to reason or implement.",
  cross_boundary_change: "The requested change involves coordination across system boundaries.",
  recovery_invariants: "Recovery and interacting components appear alongside a requirement to preserve an invariant.",
  research_proof_obligations: "The request matches research or proof obligations, such as bounds, feasibility or correctness.",
  novel_reasoning: "Novel reasoning appears alongside systemic or multi-domain work.",
  cross_domain: "The request spans multiple recognized technical domains.",
  insufficient_context: "Provide the actual task and its constraints. A continuation or isolated code block is not enough.",
  unrecognized_context: "No recognized rule matched. Describe a concrete action and what it should affect."
};
const harnessNames = {
  "claude-code": "Claude Code",
  codex: "Codex CLI",
  gemini: "Gemini CLI",
  kimi: "Kimi Code CLI",
  opencode: "OpenCode CLI",
  pi: "Pi",
  hermes: "Hermes Agent"
};
const examples = {
  lookup: "What is the capital of France?",
  feature: "Build an API endpoint with pagination and error handling.",
  systems: "Design a zero-downtime schema migration across multiple services with rollback.",
  proof: "Derive a lower bound for a distributed consensus protocol and prove its impossibility under network partitions."
};
function element(id) {
  const found = document.getElementById(id);
  if (!found)
    throw new Error(`Missing interface element: ${id}`);
  return found;
}
const task = element("task");
const harness = element("harness");
const panel = document.querySelector(".result-panel");
const needle = document.getElementById("needle");
const reasonList = element("reason-list");
const error = element("input-error");
const exampleButtons = [...document.querySelectorAll("[data-example]")];
let lastAssessment = null;
let timer;
let composing = false;
let origin = "Your task";
function text(id, value) {
  element(id).textContent = value;
}
function title(value) {
  return value[0].toUpperCase() + value.slice(1);
}
function updateMapping() {
  const name = harnessNames[harness.value];
  const tier = lastAssessment?.tier;
  text("mapping", tier ? `${name} · ${title(tier)} → ${title(swarmTier(tier))}. ${tier === "apex" ? "Apex maps to complex in the resolver." : "Tier is unchanged in the resolver."} Metadata only; no harness is run.` : `${name} · No tier to map. Harness choice does not change classification or run a harness.`);
}
function clearResult(state, heading, description) {
  lastAssessment = null;
  panel.dataset.state = state;
  text("tier", heading);
  text("tier-description", description);
  text("reading-label", state === "idle" ? "READY WHEN YOU ARE" : "ASSESSMENT");
  text("duration", "—");
  text("assessment-origin", "No current assessment");
  text("reason-count", "0 rules fired");
  reasonList.replaceChildren();
  const empty = document.createElement("p");
  empty.className = "muted";
  empty.textContent = "Matched rules will appear here.";
  reasonList.append(empty);
  document.querySelectorAll(".dial-label").forEach((label) => label.classList.remove("active"));
  updateMapping();
}
function assess() {
  clearTimeout(timer);
  if (composing)
    return;
  text("character-count", `${task.value.length.toLocaleString()} characters`);
  error.hidden = true;
  task.removeAttribute("aria-invalid");
  if (task.value.length > 1e5) {
    clearResult("invalid", "Task too long", "Shorten the task to 100,000 characters or fewer.");
    error.textContent = "Gauge accepts up to 100,000 characters. Your text has been kept; shorten it to assess.";
    error.hidden = false;
    task.setAttribute("aria-invalid", "true");
    text("engine-state", "Input limit exceeded");
    return;
  }
  if (!task.value.trim()) {
    clearResult("idle", "Ready", "Describe a task or try an example to move the dial.");
    text("engine-state", "Awaiting input");
    return;
  }
  try {
    const start = performance.now();
    const assessment = classify(task.value);
    const elapsed = performance.now() - start;
    lastAssessment = assessment;
    panel.dataset.state = assessment.abstained ? "abstained" : "classified";
    text("reading-label", assessment.abstained ? "NO TIER ASSIGNED" : "TASK COMPLEXITY");
    text("tier", assessment.tier ? title(assessment.tier) : "Abstained");
    text("tier-description", assessment.tier ? descriptions[assessment.tier] : "More context is needed for a useful assessment.");
    text("engine-state", assessment.abstained ? "Needs context" : "Assessment complete");
    text("duration", elapsed < 0.1 ? "<0.1 ms compute" : `${elapsed.toFixed(1)} ms compute`);
    text("assessment-origin", origin);
    text("reason-count", assessment.abstained ? "Abstention reason" : `${assessment.reasons.length} rule${assessment.reasons.length === 1 ? "" : "s"} fired`);
    if (assessment.tier)
      needle.style.transform = `rotate(${-80 + TIERS.indexOf(assessment.tier) * 40}deg)`;
    document.querySelectorAll(".dial-label").forEach((label) => label.classList.toggle("active", label.dataset.tier === assessment.tier));
    reasonList.replaceChildren(...assessment.reasons.map((code) => {
      const row = document.createElement("div");
      row.className = "reason";
      const mark = document.createElement("span");
      mark.className = "reason-mark";
      mark.textContent = assessment.abstained ? "○" : "●";
      mark.setAttribute("aria-hidden", "true");
      const body = document.createElement("div");
      const exact = document.createElement("code");
      exact.textContent = code;
      const description = document.createElement("p");
      description.textContent = explanations[code];
      body.append(exact, description);
      row.append(mark, body);
      return row;
    }));
    updateMapping();
  } catch {
    clearResult("error", "Unable to assess", "The local engine failed. Reload the page and try again.");
    text("engine-state", "Engine error");
  }
}
function queueAssessment() {
  origin = "Your task";
  exampleButtons.forEach((button) => button.setAttribute("aria-pressed", "false"));
  clearTimeout(timer);
  clearResult("pending", "Editing", "The assessment updates when you pause typing.");
  text("engine-state", "Waiting for input");
  text("character-count", `${task.value.length.toLocaleString()} characters`);
  error.hidden = true;
  task.removeAttribute("aria-invalid");
  if (!composing)
    timer = setTimeout(assess, 220);
}
function drawDial() {
  const ns = "http://www.w3.org/2000/svg";
  for (let i = 0;i <= 40; i++) {
    const radians = (-170 + i * 4) * Math.PI / 180;
    const major = i % 10 === 0;
    const line = document.createElementNS(ns, "line");
    const inner = major ? 194 : 204;
    line.setAttribute("x1", String(280 + inner * Math.cos(radians)));
    line.setAttribute("y1", String(285 + inner * Math.sin(radians)));
    line.setAttribute("x2", String(280 + 216 * Math.cos(radians)));
    line.setAttribute("y2", String(285 + 216 * Math.sin(radians)));
    line.setAttribute("class", `tick${major ? " major" : ""}`);
    document.getElementById("dial-ticks").append(line);
    if (major) {
      const label = document.createElementNS(ns, "text");
      label.setAttribute("x", String(280 + 248 * Math.cos(radians)));
      label.setAttribute("y", String(289 + 248 * Math.sin(radians)));
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("class", "dial-label");
      label.dataset.tier = TIERS[i / 10];
      label.textContent = TIERS[i / 10].toUpperCase();
      document.getElementById("dial-labels").append(label);
    }
  }
}
drawDial();
harness.replaceChildren(...HARNESSES.map((id) => new Option(harnessNames[id], id)));
harness.value = "codex";
harness.addEventListener("change", updateMapping);
text("version", VERSION.toUpperCase());
element("task-form").addEventListener("submit", (event) => {
  event.preventDefault();
  assess();
});
task.addEventListener("input", queueAssessment);
task.addEventListener("compositionstart", () => {
  composing = true;
  clearTimeout(timer);
});
task.addEventListener("compositionend", () => {
  composing = false;
  queueAssessment();
});
task.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && !event.isComposing) {
    event.preventDefault();
    assess();
  }
});
element("clear").addEventListener("click", () => {
  composing = false;
  task.value = "";
  origin = "Your task";
  exampleButtons.forEach((button) => button.setAttribute("aria-pressed", "false"));
  assess();
  task.focus();
});
exampleButtons.forEach((button) => {
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => {
    composing = false;
    const key = button.dataset.example;
    task.value = examples[key];
    origin = `Example / ${button.textContent}`;
    exampleButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    assess();
  });
});
document.querySelectorAll("[disabled]").forEach((control) => {
  control.disabled = false;
});
element("boot-error").hidden = true;
assess();
