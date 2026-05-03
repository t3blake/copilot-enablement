# Copilot Enablement Hub

An interactive web app that guides organizations through Copilot adoption with a **readiness assessment**, **best-practice checklist**, and **configuration tracking dashboard**.

This project is intentionally **Copilot-focused**. It is not a general Microsoft 365 health scorecard.
The goal is to provide a **just-enough baseline** for a typical Microsoft 365 Copilot deployment,
while linking to deeper official guidance when needed.

## Quick Links

- **[Launch the app →](https://t3blake.github.io/copilot-enablement/)**
- **[Design Document](DESIGN.md)** — full project vision, scope, and architecture
- **[Contributing](CONTRIBUTING.md)** *(coming soon)* — how to add questions, improve guidance, localize content

## What It Does

1. **Track progress across 47 Copilot-readiness controls** in a visual grid organized by workload and execution lane
2. **Assign status to each item** (Not Started, In Progress, Completed, Blocked, etc.) and track progression from planning to completion
3. **See real-time scoring** showing overall readiness and per-workload progress based on your status selections
4. **Download JSON snapshots** to save/share progress and re-import them later to continue or compare over time
5. **Optionally include a deeper backlog** of 25 additional questions for extended assessment

## Scope Guardrail

- In scope: controls that are prerequisites, common blockers, or clear risk reducers for Microsoft 365 Copilot.
- Out of scope: broad tenant health checks unrelated to Copilot outcomes.

## Key Features

✅ **Free & public** — no login, no vendor lock-in, no telemetry  
✅ **Static and portable** — runs as a simple client-side web app  
✅ **Copilot-focused** — best practices specifically for M365 Copilot adoption  
✅ **Status-driven tracking** — progress-aware scoring that reflects execution lifecycle (planning → implementation → completion)  
✅ **Shareable** — JSON snapshots make it easy to save progress and handoff across teams  
✅ **Accessible** — plain language, no jargon  

## Status

🚧 **Prototype In Progress** — A working static assessment MVP is now scaffolded in `app/` and aligned to the design doc.

## Running Locally

```bash
# Serve from the app/ directory
npx serve app -l 8080
```

Then open http://localhost:8080/

Usage notes:
- The app loads all 53 Copilot readiness assessment questions organized by deployment phase ("first," "then," "later")
- Questions range from critical prerequisites to advanced post-launch governance topics
- All status changes and notes are saved in browser memory. Download a JSON snapshot to persist progress.
- Scoring is progress-aware: items marked `Completed` or higher-progress statuses contribute more to overall readiness % than `Not Started` items.
- Each question links to relevant official Microsoft documentation for deeper guidance.

## Project Structure

```
copilot-enablement/
├── DESIGN.md           ← Full design document
├── README.md           ← This file
├── .gitignore          ← Protect local-only overlays and snapshots
├── app/                ← Web app files
│   ├── index.html      ← Main page shell
│   ├── main.js         ← Assessment + scoring logic
│   ├── style.css       ← Styling
│   └── data/           ← Assessment content (JSON)
│       ├── questions.json               ← Complete question bank (53 questions)
│       ├── questions.private.json       ← Optional local overlay for custom questions
│       └── sample-*.json                ← Sample snapshots for import/testing
└── scripts/            ← Utility scripts (TBD)
```

## Publish to GitHub Pages

This repo publishes the static site from the `gh-pages` branch root.

1. Push source changes to the main repository branch you use for development.
2. Publish the `app/` directory contents to the `gh-pages` branch.
3. In GitHub, go to **Settings > Pages**.
4. Under "Build and deployment," select **Deploy from a branch**.
5. Set branch to `gh-pages` and folder to `/ (root)`.

The live site is available at [https://t3blake.github.io/copilot-enablement/](https://t3blake.github.io/copilot-enablement/).

**Note:** The `.nojekyll` file in the repo root tells GitHub Pages to serve files as-is without Jekyll processing.

## Questions or Feedback?

- Open an issue on GitHub
- Check the [Design Document](DESIGN.md) for context on current decisions

## Source Materials

We use official Microsoft sources only, with a preference for Microsoft Learn and Microsoft Adoption resources.

Non-public source inputs policy:
- Private/internal documents can inform question prioritization and wording locally.
- Do not commit private URLs or confidential source content to this repository.
- Keep internal-only overlays in git-ignored local files (for example `app/data/questions.private.json`).

- [Copilot adoption guidance](https://adoption.microsoft.com/en-us/copilot/)
- [Copilot adoption guide](https://aka.ms/Copilot/ACMGuide)
- [Secure and govern Copilot foundational deployment guidance](https://learn.microsoft.com/en-us/microsoft-365/copilot/secure-govern-copilot-foundational-deployment-guidance)
- [Zero Trust for Microsoft 365 Copilot](https://learn.microsoft.com/en-us/security/zero-trust/copilots/zero-trust-microsoft-365-copilot?context=/microsoft-365/copilot/context/copilot)
- [Set up Microsoft 365 Copilot and assign licenses](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-setup)
- [Microsoft 365 app and network requirements for Microsoft 365 Copilot](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-requirements)

## License

MIT — see LICENSE file (coming soon)

---

**Last updated:** May 1, 2026
