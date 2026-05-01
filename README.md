# Copilot Enablement Hub

An interactive web app that guides organizations through Copilot adoption with a **readiness assessment**, **best-practice checklist**, and **configuration tracking dashboard**.

This project is intentionally **Copilot-focused**. It is not a general Microsoft 365 health scorecard.
The goal is to provide a **just-enough baseline** for a typical Microsoft 365 Copilot deployment,
while linking to deeper official guidance when needed.

## Quick Links

- **[Launch the app →]()** *(coming soon)*
- **[Design Document](DESIGN.md)** — full project vision, scope, and architecture
- **[Contributing](CONTRIBUTING.md)** *(coming soon)* — how to add questions, improve guidance, localize content

## What It Does

1. **Track questions in a status grid** (domain, answer, status, comment, owner) across Copilot-relevant workloads
2. **Get a readiness score** with visual traffic-light status (green = ready, yellow = caution, red = action needed)
3. **Download your results** as JSON (for tracking) or HTML report (for stakeholders)
4. **Track progress** — save snapshots and compare over time

## Scope Guardrail

- In scope: controls that are prerequisites, common blockers, or clear risk reducers for Microsoft 365 Copilot.
- Out of scope: broad tenant health checks unrelated to Copilot outcomes.

## Key Features

✅ **Free & public** — no login, no vendor lock-in, no telemetry  
✅ **Offline-capable** — all data stays in your browser  
✅ **Copilot-focused** — best practices specifically for M365 Copilot adoption  
✅ **Visual & engaging** — inspired by [zerotrust.microsoft.com](https://zerotrust.microsoft.com)  
✅ **Accessible** — plain language, no jargon  

## Status

🚧 **Prototype In Progress** — A working static assessment MVP is now scaffolded in `app/` and aligned to the design doc.

## Running Locally

```bash
# Serve from the app/ directory
npx serve app -l 8080
```

Then open http://localhost:8080/

Usage note:
- By default, the app loads the scored core baseline question set.
- To include your expanded workshop backlog, enable "Include expanded draft backlog questions (experimental)" on the intro screen before starting the assessment.

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
│       ├── questions.v1.json         ← MVP scored question bank
│       └── questions.backlog.v2.json ← Backlog from workshop/security intake
└── scripts/            ← Utility scripts (TBD)
```

## Publish to GitHub Pages (POC)

```bash
git add .
git commit -m "Prototype: Copilot readiness MVP"
git push origin main
```

Then in GitHub repo settings:

1. Open `Settings -> Pages`.
2. Set source to `Deploy from a branch`.
3. Select branch `main` and folder `/app`.
4. Save and wait for publish.

Your site URL will be: `https://<org-or-user>.github.io/<repo-name>/`

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
