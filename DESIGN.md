# Copilot Enablement Hub — Design Document

> **Status:** Draft — firming up principles and goals before implementation.
>
> **Vision:** A publicly accessible web app that guides organizations through
> Copilot adoption by providing an interactive **readiness assessment**,
> **best-practice checklist**, and **configuration tracking dashboard**.
> Organizations can monitor their progress toward Copilot-ready infrastructure
> across Microsoft 365 services (Entra ID, OneDrive, Purview, Teams, etc.)
> and download actionable guidance tailored to their current state.

---

## 1. Problem Statement

Organizations want to adopt Microsoft Copilot but lack clarity on:

- **What configuration is required?** (Entra ID policies, OneDrive/SharePoint sharing, Purview DLP, Teams settings, etc.)
- **Are we ready?** Do we have the prerequisites in place?
- **What's still missing?** Which best practices should we prioritize next?
- **How do we track progress?** No single dashboard shows Copilot readiness.

Today, admins must manually consult multiple disconnected sources:
- Microsoft Learn documentation (scattered across workloads)
- Admin portals (Exchange, Teams, Purview, Intune, etc.)
- Deployment guides (PDF/Word, often out of sync)
- Third-party assessment tools (fragmented, vendor-specific)

**Our goal:** One interactive web app that consolidates Copilot best practices,
lets organizations self-assess their readiness, and tracks progress in a
visual dashboard.

**Scope boundary:** This is intentionally a **Copilot adoption readiness**
experience, not a full Microsoft 365 tenant health assessment.
We include only adjacent workload guidance that is necessary for a typical
Copilot deployment outcome.

---

## 2. Product Principles

These principles are decision filters. If a feature conflicts with a principle,
the principle wins unless we explicitly document an exception.

### **1) Copilot outcome first**
- Prioritize configurations that materially improve Copilot usefulness and safety.
- Keep focus on Copilot enablement, not general M365 hygiene.
- Every assessment item should answer: "How does this affect Copilot outcomes?"

### **1.1) Just-enough baseline for typical deployment**
- Optimize for the 80/20 set of controls needed by most enterprise M365 Copilot rollouts.
- Exclude deep specialist checks unless they are common blockers in real deployments.
- Offer links to advanced guidance rather than expanding core scope.

### **2) Secure and compliant by default**
- Treat data protection settings (Purview, sharing controls, retention) as first-class.
- Avoid guidance that improves convenience but weakens governance without warning.
- Clearly label high-risk gaps and blocking issues.

### **3) Explainability over black-box scoring**
- Show how each answer impacts readiness score.
- Distinguish required vs. recommended vs. optional controls.
- Give plain-language rationale for every best-practice check.

### **4) Customer data sovereignty**
- No required tenant connection in Phase 1.
- No mandatory account sign-in.
- Assessment data remains local unless user explicitly exports and shares it.

### **5) Actionable, not encyclopedic**
- Favor smaller, high-confidence guidance over exhaustive lists.
- For each gap, provide a concrete next step and owner-friendly wording.
- Reduce time-to-first-action after assessment completion.

### **6) Progressive maturity**
- Help teams start where they are (including "Not sure" responses).
- Support incremental improvement, not pass/fail judgment.
- Make improvement over time visible through snapshot comparison.

### **7) Accessible and credible**
- Use plain, admin-friendly language and avoid unnecessary jargon.
- Maintain clear source references to Microsoft guidance.
- Keep content current with an explicit review cadence.

### **8) Web-first and lightweight**
- Static SPA-first architecture to minimize deployment friction.
- Mobile-responsive and usable in constrained enterprise environments.
- Defer backend complexity until it unlocks clear customer value.

---

## 3. Goals and Non-Goals

### **3.1 Primary Goals (Phase 1)**

| Goal | Why it matters | Measurable signal |
|---|---|---|
| **Speed up Copilot readiness planning** | Teams need fast clarity on what to do next | Median completion time <= 30 minutes |
| **Prioritize high-impact controls** | Not all controls have equal Copilot impact | High-criticality gaps are surfaced in top findings |
| **Create shared understanding across stakeholders** | Security, M365 admins, and business owners need a common view | Exported report is usable in planning reviews without rework |
| **Enable self-service tracking** | Customers should not need consulting engagement for baseline readiness | Users can save, reload, and compare snapshots locally |
| **Increase confidence in decisions** | Teams need to understand trade-offs, not just check boxes | Every item includes rationale and implementation path |
| **Prevent health sprawl** | Broad M365 scoring dilutes Copilot adoption outcomes | Assessment catalog maps each item to explicit Copilot dependency or risk |

### **3.2 Secondary Goals (if capacity allows in Phase 1)**

- Add lightweight benchmark views (for example: "critical controls complete" trend)
- Improve role-targeted views (security admin vs. collaboration admin)
- Add clearer dependency hints between controls (e.g., Purview labels before DLP policies)

### **3.3 Explicit Non-Goals (Phase 1)**

- No automatic tenant remediation or policy deployment
- No always-on Graph integration or live configuration sync
- No tenant-level analytics service or centralized data collection
- No attempt to replace official Microsoft documentation portals
- No broad M365 health score outside Copilot enablement scope
- No "comprehensive M365 maturity" framework
- No unrelated workload expansion unless required for Copilot deployment safety/readiness

### **3.4 Goal Guardrails (Decision Tests)**

Use these checks for scope decisions:

1. Does this directly improve Copilot enablement decisions?
2. Does this reduce time-to-action for an admin team?
3. Can this be delivered without violating local-first data handling?
4. Is the outcome explainable to non-developer stakeholders?

If a proposal fails 2 or more checks, defer it to a later phase.

---

## 4. Scope — What We'll Build (Phase 1)

### **4.0 Scope Filter (Must Pass)**

A control enters the assessment only if at least one is true:

1. It is a documented prerequisite for Microsoft 365 Copilot deployment.
2. It materially reduces Copilot data exposure or compliance risk.
3. It is a high-frequency blocker seen in typical customer rollouts.

If none are true, the item is out of scope for Phase 1.

### **4.1 Core Features**

#### **A. Interactive Assessment**
A guided questionnaire (~40–60 questions) that evaluates:

| Workload | Focus Areas | Examples |
|---|---|---|
| **Entra ID** | Security, guest access, auth | MFA enforced? Conditional Access configured? Cross-tenant access policies? |
| **OneDrive / SharePoint** | Sharing, external collab | External sharing rules set? Sync client updated? Co-authoring enabled? |
| **Purview / DLP** | Data protection, sensitivity labels | Sensitivity labels defined? DLP rules active? Retention policies in place? |
| **Teams** | External access, recording, retention | Guest policies set? Recording retention configured? External access allowed? |
| **Exchange Online** | Transport security, retention | Encryption configured? Email retention policies set? Malware scanning active? |
| **Microsoft 365 Copilot** | Licensing, service readiness | Copilot license assigned? Data residency verified? Plugins configured? |

Question set intent: **minimum viable Copilot readiness baseline** for a
typical deployment, with links out to deeper workload-specific guidance where needed.

**Not in scope yet:**
- Entra ID Sign-In Logs integration
- Real-time config polling from Microsoft Graph (separate effort)
- Remediation (auto-applying configs) — read-only assessment first

#### **B. Readiness Dashboard**
After assessment, display:
- **Overall score** (0–100%) based on progress across all questions
- **Traffic-light status** (green = ready, yellow = caution, red = action needed) by workload
- **Per-item tracking** with status and owner assignment
- **Summary findings** (e.g., "5 items in progress, 2 blocked, 14 not started")
- **High-gap prioritization** by criticality (high-criticality items with incomplete status rank highest)

#### **C. Export & Reporting**
- Download assessment result as **JSON snapshot** (structured data for sharing and tracking over time)
- Re-import snapshots to compare progress or continue work across sessions
- Clear/reset all answers to start fresh

#### **D. Best-Practice Guidance**
Embedded in the assessment — each section includes:
- **What it is** (plain-language explanation)
- **Why it matters** (business impact + security reasoning)
- **How to configure** (link to admin center or docs)
- **Copilot impact** (e.g., "Required to use Copilot in Teams channels")

### **4.2 Not in Scope (Phase 1)**

- **Interactive remediation** — no buttons to "apply" configs (can add later)
- **Multi-tenant comparison** — focused on single-org assessment
- **Real-time Graph API polling** — assessment is manual/interview-based
- **Copilot chat integration** — no AI-powered guidance yet
- **Custom assessment templates** — fixed best-practice set for all orgs
- **User authentication** — anonymous, no login required
- **Analytics/telemetry** — no backend, so no aggregate reporting
- **Mobile app** — web-only (can be responsive, but not a native app)

---

## 5. Technology Choices

### **Frontend: Static SPA (GitHub Pages)**
- **Why?** Low operational burden, no backend credentials or servers to manage.
- **Frameworks:** HTML5 + Vanilla JavaScript (or lightweight: Alpine.js, Lit, or Vue)
  - Rationale: Assessment is form-based UI; don't need React's complexity.
  - Prefer native Web APIs + minimal dependencies.
- **Styling:** CSS custom properties + mobile-first responsive design (or Tailwind if we want utility-first)
- **No Build Step (initially):** Vanilla JS served as-is, no bundler unless needed.

### **Data Format: JSON-based Assessment**
```json
{
  "version": "1.0",
  "timestamp": "2026-05-01T10:30:00Z",
  "organizationName": "Contoso Inc.",
  "assessment": {
    "entraId": {
      "score": 75,
      "items": [
        {
          "id": "entra-mfa",
          "title": "Multi-Factor Authentication enabled",
          "status": "complete",
          "criticality": "high",
          "explanation": "MFA is required for Copilot-safe access..."
        }
      ]
    },
    "purview": { ... },
    "teams": { ... }
  }
}
```

### **Storage: Browser + Export**
- Assessment stored in `sessionStorage` (lost on tab close) or `localStorage` (persistent within browser)
- Users can **save/download** snapshots as JSON files
- No backend persistence — users own their data

### **Comparison: Optional (Phase 2)**
- If we want to compare assessments over time, user uploads previous snapshot
- Diff view shows what changed between snapshots
- All comparison happens in browser (no server sync)

---

## 6. Architecture

```
┌──────────────────────────────────────────────┐
│         GitHub Pages Static SPA               │
│                                              │
│  index.html          ← Single page shell     │
│  assessment.js       ← Question logic         │
│  ui.js               ← Form rendering         │
│  dashboard.js        ← Results visualization  │
│  export.js           ← JSON/HTML export       │
│  style.css           ← Responsive design      │
│  data/               ← Assessment data (JSON) │
│    ├─ questions.json ← Question definitions  │
│    ├─ guidance.json  ← Best-practice text    │
│    └─ scoring.json   ← Scoring logic         │
└──────────────────────────────────────────────┘
          │
          │ User's Browser
          │ (sessionStorage + localStorage)
          │
    ┌─────▼─────┐
    │ User Data │
    │ (optional │
    │ download  │
    │  as file) │
    └───────────┘
```

### **User Flow**

```
1. Visit app → See tracker grid across workloads
2. Click a question card to open the detail panel
3. Set the status for that question:
   - Not Reviewed (default)
   - Not Started, In Planning, Planned, In Progress, Completed
   - Blocked, First Party Other, Third Party, Will Not Pursue
   - MS Roadmap, Follow Up, Not Applicable
4. Optionally add notes and assign an owner
5. Return to grid to see progress update in real time
6. Export current progress as JSON snapshot
7. Import previous snapshot to resume or compare over time
```

---

## 7. Content Strategy

### **Source of Truth Hierarchy**

Assessment content should be anchored to the following canonical sources:

1. [Copilot adoption guidance](https://adoption.microsoft.com/en-us/copilot/)
2. [Secure and govern Copilot foundational deployment guidance](https://learn.microsoft.com/en-us/microsoft-365/copilot/secure-govern-copilot-foundational-deployment-guidance)
3. [Zero Trust for Microsoft 365 Copilot](https://learn.microsoft.com/en-us/security/zero-trust/copilots/zero-trust-microsoft-365-copilot?context=/microsoft-365/copilot/context/copilot)

Source policy:
- Use official Microsoft sources only.
- Prioritize Microsoft Learn and Microsoft Adoption resources.
- Use other Microsoft-owned resources only as supplemental references.

When sources differ in depth or framing, prefer:
- direct Copilot deployment requirements first,
- then secure/govern implementation guidance,
- then zero trust architectural framing.

### **Evidence Tagging (Per Assessment Item)**

Each item should carry:
- `sourceUrl` (primary canonical reference)
- `sourceType` (`requirement`, `recommended`, or `reference`)
- `lastReviewed` (date)
- `copilotDependency` (brief statement of Copilot impact)

### **First-Pass Phase 1 Control Catalog (Draft)**

This catalog is intentionally "just enough" for a typical Microsoft 365 Copilot
deployment. It is not a full M365 maturity model.

| ID | Control | Copilot dependency / risk | Phase 1 include | Criticality | Primary source |
|---|---|---|---|---|---|
| CPL-001 | Eligible base license + Microsoft 365 Copilot add-on assigned | Copilot is unavailable without required licensing | Yes | High | [Copilot requirements](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-requirements#prerequisites) |
| CPL-002 | Users have Entra accounts and primary mailbox hosted in Exchange Online | Core Copilot experiences depend on tenant identity and Exchange Online primary mailbox | Yes | High | [Copilot requirements](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-requirements#prerequisites) |
| CPL-003 | Microsoft 365 Apps deployed and update channel is Current or Monthly Enterprise | Out-of-date apps and unsupported channels can block Copilot app experiences | Yes | High | [Copilot setup](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-setup#step-1-update-channels) |
| CPL-004 | Network allows required Microsoft 365 endpoints and WSS connectivity | Blocked endpoints or WSS/TLS inspection issues can break Copilot scenarios | Yes | High | [Copilot requirements](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-requirements#network-requirements) |
| CPL-005 | Office Feature Updates task is allowed and functional | Core Copilot functionality in Word/PowerPoint/Excel/OneNote depends on this task | Yes | High | [Copilot requirements](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-requirements#run-the-office-feature-updates-task) |
| CPL-006 | MFA required for all users and administrators | Reduces account compromise risk that can lead to Copilot-assisted data exposure | Yes | High | [Copilot setup security measures](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-setup#multifactor-authentication-mfa) |
| CPL-007 | Baseline Conditional Access policies in place, including blocking legacy auth | Prevents weaker auth paths and improves identity assurance for Copilot access | Yes | High | [Zero Trust Step 2](https://learn.microsoft.com/en-us/security/zero-trust/copilots/zero-trust-microsoft-365-copilot?context=/microsoft-365/copilot/context/copilot#step-2-deploy-or-validate-your-identity-and-access-policies) |
| CPL-008 | Oversharing controls plan applied (Restricted SharePoint Search / access reviews / restricted discovery) | Reduces unintended Copilot grounding on overshared content | Yes | High | [Zero Trust Step 1](https://learn.microsoft.com/en-us/security/zero-trust/copilots/zero-trust-microsoft-365-copilot?context=/microsoft-365/copilot/context/copilot#step-1-deploy-or-validate-your-data-protection-and-get-started-with-compliance-tools) |
| CPL-009 | SharePoint and OneDrive external sharing baseline defined and enforced | Limits external oversharing paths that can increase Copilot data risk | Yes | High | [Secure collaboration external sharing](https://learn.microsoft.com/en-us/security/zero-trust/copilots/zero-trust-microsoft-365-copilot?context=/microsoft-365/copilot/context/copilot#step-6-deploy-or-validate-secure-collaboration-for-microsoft-teams) |
| CPL-010 | Purview sensitivity labels are defined, published, and enabled for SharePoint/OneDrive files | Labeling is foundational to Copilot-aware protection and governance controls | Yes | High | [Get started with sensitivity labels](https://learn.microsoft.com/en-us/purview/get-started-with-sensitivity-labels) |
| CPL-011 | Purview DLP baseline policies are configured for core locations | Reduces sensitive data leakage through Copilot-related workflows and sharing | Yes | High | [Create DLP policies](https://learn.microsoft.com/en-us/purview/dlp-learn-about-dlp) |
| CPL-012 | Unified audit logging enabled and retention configured | Enables investigation, compliance evidence, and Copilot usage oversight | Yes | High | [Audit logging in Copilot setup](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-setup#audit-logging) |
| CPL-013 | Teams transcription/recording policy configured where meeting recap Copilot scenarios are expected | Post-meeting Copilot access depends on transcription/recording signals | Yes | Medium | [Teams app requirements for Copilot](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-requirements#app-requirements) |
| CPL-014 | Loop and Whiteboard tenant settings reviewed if those Copilot experiences are in scope | App-level prerequisites affect whether users can use Copilot in those apps | Yes | Medium | [Copilot app requirements](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-requirements#app-requirements) |
| CPL-015 | Pilot ring and champions plan established before broad rollout | Improves adoption quality and catches deployment issues early | Yes | Medium | [Copilot setup pilot](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-setup#step-4---deploy-to-some-users-and-measure-adoption) |
| CPL-016 | User enablement assets and communication plan prepared | Increases sustained usage and reduces failed adoption from poor onboarding | Yes | Medium | [Copilot adoption resources](https://adoption.microsoft.com/en-us/copilot/) |

Initial out-of-scope examples (unless required by a target customer profile):
- Deep Sentinel/SIEM integration validation
- Full Defender XDR maturity scoring
- Broad non-Copilot workload optimization checks

### **Question Bank v0.1 (Mapped to Control Catalog)**

Status model for all questions:
- `not_reviewed` = status not yet set (default, score = 0, not counted as answered)
- `not_started` = identified but no action begun (score = 0)
- `in_planning` = work scheduled or in assessment phase (score = 0.2)
- `planned` = decision made, implementation roadmap clear (score = 0.35)
- `in_progress` = active implementation underway (score = 0.6)
- `completed` = fully implemented and validated (score = 1.0)
- `blocked` = work blocked by external dependency (score = 0.15)
- `first_party_other` = implemented via Microsoft product evolution (score = 0.5)
- `third_party` = implemented via third-party solution (score = 0.5)
- `will_not_pursue` = intentionally deferred or out of scope (score = 0)
- `ms_roadmap` = planned in Microsoft roadmap, awaiting release (score = 0.45)
- `follow_up` = identified for future phase (score = 0.25)
- `not_applicable` = does not apply to this organization (score = 0, excluded from denominator)

Scoring model (unweighted, progress-aware):

$$
\text{overall} = \frac{\sum(\text{statusScore}) }{\text{count of applicable questions}}
$$

Where "applicable" excludes items marked `not_applicable`. This ensures orgs can opt out of irrelevant controls without penalty.

| QID | Control ID | Assessment question | Criticality | Fail-state guidance |
|---|---|---|---|---|
| Q-001 | CPL-001 | Do all intended Copilot users have eligible base licenses plus Microsoft 365 Copilot add-on assigned? | High | Identify unlicensed users, confirm eligible base SKUs, and assign Copilot add-on before pilot expansion. |
| Q-002 | CPL-002 | Do intended Copilot users have Entra accounts and primary mailboxes hosted in Exchange Online? | High | Migrate mailbox dependencies and resolve identity gaps before production rollout. |
| Q-003 | CPL-003 | Are Microsoft 365 Apps deployed and running supported channels (Current or Monthly Enterprise) for Copilot users? | High | Standardize update channel policy and update app builds for pilot ring devices first. |
| Q-004 | CPL-004 | Does your network allow required Microsoft 365 endpoints and full WSS connectivity for Copilot experiences? | High | Remove blocking/proxy/TLS inspection constraints for required endpoints and retest core app scenarios. |
| Q-005 | CPL-005 | Is the Office Feature Updates task allowed to run on schedule for Copilot-enabled devices? | High | Re-enable scheduled task and confirm endpoint policy does not suppress required update behavior. |
| Q-006 | CPL-006 | Is MFA enforced for all users and all admin accounts in Copilot scope? | High | Enforce MFA baseline and remove exceptions that bypass strong auth for in-scope users. |
| Q-007 | CPL-007 | Are baseline Conditional Access controls active, including blocking legacy authentication? | High | Roll out baseline CA policies with staged testing, then enforce tenant-wide for Copilot scope. |
| Q-008 | CPL-008 | Have you applied oversharing controls (e.g., restricted search, access review, restricted discovery) for high-risk content locations? | High | Apply interim oversharing controls on high-risk sites before expanding Copilot license assignment. |
| Q-009 | CPL-009 | Is an external sharing baseline defined and enforced for SharePoint and OneDrive? | High | Tighten external sharing defaults, align link policies, and review guest collaboration settings. |
| Q-010 | CPL-010 | Are Purview sensitivity labels defined, published, and enabled for SharePoint and OneDrive files? | High | Publish baseline label taxonomy and validate label application in priority collaboration locations. |
| Q-011 | CPL-011 | Are Purview DLP baseline policies active for core data locations (email, OneDrive, SharePoint, Teams where applicable)? | High | Deploy baseline DLP policies in monitor mode first, then move to enforce with clear owner workflows. |
| Q-012 | CPL-012 | Is unified audit logging enabled with retention aligned to compliance needs? | High | Enable audit logging, define retention period, and establish recurring review ownership. |
| Q-013 | CPL-013 | For Teams scenarios that need post-meeting Copilot context, are transcription/recording policies configured appropriately? | Medium | Configure meeting policies for targeted groups and communicate recording/transcription expectations. |
| Q-014 | CPL-014 | If Loop/Whiteboard Copilot scenarios are in scope, are those tenant settings enabled and validated? | Medium | Enable required app settings only for in-scope scenarios and validate with pilot users. |
| Q-015 | CPL-015 | Is there a defined pilot ring with champions across business functions before broad deployment? | Medium | Build a cross-functional pilot cohort, assign licenses, and capture structured feedback before scale-out. |
| Q-016 | CPL-016 | Do you have user enablement assets and a communication plan for launch and post-launch support? | Medium | Prepare role-based onboarding content and rollout communications before expanding licenses. |

### **Question Authoring Template (for scale-out to 50+)**

Each question should be stored with:
- `id`
- `controlId`
- `workload`
- `prompt`
- `criticality` (high, medium, low)
- `lane` (first, then, later) — deployment sequencing
- `copilotDependency`
- `remediationHint`
- `sourceUrl`
- `sourceType`
- `lastReviewed`

Note: The `weight` field has been removed. All questions contribute equally to the overall score based on their status, independent of any priority weighting.

### **Question Intake Backlog (from Security Workshops)**

We maintain a backlog set of candidate questions captured from internal security
reviews and workshops in `app/data/questions.backlog.v2.json`.

Intake rules:
1. Backlog questions are not automatically part of scored Phase 1.
2. Each promoted question must map to an official Microsoft Learn or Adoption source.
3. If a question is broad maturity-oriented, rewrite it into a Copilot-impact check.
4. Keep the Copilot-only scope boundary (no broad M365 health sprawl).

Promotion pipeline (backlog -> scored bank):
1. Normalize wording to yes/no/partial/not-sure where possible.
2. Assign `controlId`, `criticality`, and `weight`.
3. Attach `sourceUrl` + `sourceType` from official docs.
4. Add remediation hint and workload ownership.
5. Include in `questions.v1.json` only after source + scope review.

### **Internal Source Handling (Non-Public Inputs)**

- Internal artifacts (for example tenant-specific spreadsheets and shared docs)
   can inform question wording and prioritization, but must not be copied verbatim
   into public repository content.
- Never include private URLs, customer identifiers, or confidential metadata in
   `README.md`, `DESIGN.md`, or shipped question JSON.
- Maintain a local-only overlay file for internal variants (for example
   `app/data/questions.private.json`) and keep it git-ignored.
- For each internal-derived question, retain a public-safe equivalent that maps
   to an official Microsoft Learn/Adoption reference.

### **Best-Practice Definitions**
- Draw from Microsoft Learn, Copilot docs, and internal expertise
- Explain the **business impact** (e.g., "Sensitivity labels enable Copilot to respect DLP")
- Link to relevant admin center pages + setup docs
- Version the guidance (date last reviewed, link to latest Copilot docs)

### **Language & Tone**
- Clear, non-technical language (avoid jargon)
- Assume reader is an admin, not a developer
- Encourage progress — celebrate completed items
- Acknowledge complexity — some configs are legitimate trade-offs

---

## 8. Success Criteria

### **Phase 1 Launch (MVP)**
- [ ] Assessment with 50+ questions across 5 workloads
- [ ] Readiness dashboard with visual scoring
- [ ] JSON export (record-keeping)
- [ ] Deployed to GitHub Pages (public URL)
- [ ] <30 min to complete full assessment
- [ ] Mobile-responsive design

### **Phase 2 (Post-Launch)**
- [ ] HTML report export + printable version
- [ ] Assessment comparison (snapshot A vs. B)
- [ ] Copilot chat integration (AI-powered follow-up guidance)
- [ ] Analytics (anonymous, aggregated: "50% of orgs have Purview configured")
- [ ] Community feedback loop (survey, GitHub issues)

### **Ongoing (Evergreen)**
- Quarterly review of questions (align with Copilot feature updates)
- Community contributions (PRs for new workloads or updated guidance)
- Localization (Spanish, French, Japanese)

---

## 9. Open Questions & Decisions Needed

1. **Copilot-specific or general M365 readiness?**
   - Current scope: Copilot-focused (what's required to get Copilot working well)
   - Alternative: General M365 health (broader, but dilutes Copilot focus)
   - **Decision:** Stay Copilot-focused (more cohesive messaging)

2. **Graph API polling (future)?**
   - Phase 1: Manual questionnaire
   - Phase 2: Optional real-time Graph API check (query actual tenant config)
   - Challenge: Requires app registration + auth; adds complexity
   - **Decision:** Phase 1 is interview-based; Graph polling can be opt-in Phase 2 feature

3. **Workload coverage: Wide or deep?**
   - MVP: 5 core workloads (Entra, OneDrive/SharePoint, Purview, Teams, Exchange)
   - Stretch: Add Intune, Defender, Viva, etc.
   - **Decision:** Start with 5 core; extend based on feedback

4. **Scoring algorithm: Simple or nuanced?**
   - Simple: % of complete items
   - Nuanced: Weight by criticality (high-priority items matter more)
   - **Decision:** Start simple (easy to understand); refine if users request

5. **Community model: OSS or closed?**
   - Open source on GitHub (accept PRs, community translations)
   - Closed / Microsoft-only (faster iteration)
   - **Decision:** Open source (transparency + community trust)

---

## 10. Next Steps

1. **Principles and goals sign-off** — review Sections 2 and 3 with product, security, and field stakeholders
2. **Define target personas and usage context** — clarify who completes assessments (security lead, M365 admin, PM) and in what workflow
3. **Finalize high-impact control set** — confirm Phase 1 controls with Copilot + Purview + collaboration experts
4. **Finalize Question Bank v0.1** — review the 16 core questions and scoring weights with stakeholders
5. **Draft assessment JSON schema** — define questions, response types, criticality, scoring metadata, and guidance links
6. **Prototype static web experience** — implement baseline assessment flow and local export
7. **Publish GitHub Pages POC** — deploy a shareable URL for coworker feedback
8. **Run alpha validation** — internal review for accuracy, clarity, and practical actionability

### **10.1 Fast-Track MVP Path (to shareable github.io POC)**

Week 1 (build):
1. Implement a static SPA with 3 core views: intro, assessment, results.
2. Ship the 16-question bank as seeded JSON.
3. Implement weighted scoring + traffic-light status.
4. Support local save/load JSON snapshots.

Week 2 (polish and launch):
1. Add workload filtering and top-priority findings panel.
2. Add HTML report export for stakeholder sharing.
3. Validate mobile responsiveness and accessibility basics.
4. Publish to GitHub Pages and collect feedback.

Definition of done for POC:
- Public GitHub Pages URL is live
- Teammates can complete assessment in under 30 minutes
- Result view clearly shows top 5 actions
- JSON export/import works end-to-end

---

## References

- [Copilot adoption guidance](https://adoption.microsoft.com/en-us/copilot/)
- [Copilot adoption guide](https://aka.ms/Copilot/ACMGuide)
- [Copilot user engagement tools and templates](https://adoption.microsoft.com/copilot/user-engagement-tools-and-templates/)
- [Secure and govern Copilot foundational deployment guidance](https://learn.microsoft.com/en-us/microsoft-365/copilot/secure-govern-copilot-foundational-deployment-guidance)
- [Set up Microsoft 365 Copilot and assign licenses](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-setup)
- [Microsoft 365 app and network requirements for Microsoft 365 Copilot](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-requirements)
- [Configure a secure and governed data foundation for Microsoft 365 Copilot](https://learn.microsoft.com/en-us/microsoft-365/copilot/configure-secure-governed-data-foundation-microsoft-365-copilot)
- [Zero Trust for Microsoft 365 Copilot](https://learn.microsoft.com/en-us/security/zero-trust/copilots/zero-trust-microsoft-365-copilot?context=/microsoft-365/copilot/context/copilot)
- [Copilot for Microsoft 365 documentation](https://learn.microsoft.com/en-us/microsoft-365-copilot/)
- [Zero Trust security model](https://zerotrust.microsoft.com/) (inspiration for design/UX)
- [Microsoft 365 best practices](https://learn.microsoft.com/en-us/microsoft-365/enterprise/)
- [Data security & compliance in Copilot](https://learn.microsoft.com/en-us/microsoft-365-copilot/security-and-compliance)
