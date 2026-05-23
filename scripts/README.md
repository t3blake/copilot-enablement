# Microsoft Planner export — PowerShell

The web app's **Export CSV** button produces a file that Microsoft Planner **Premium** (formerly Project Plan 3) can import natively. Customers on **Planner Basic** (the version included with most Microsoft 365 E3/E5 plans) don't have CSV import — for those customers, this script creates the Planner plan, buckets, and tasks programmatically via Microsoft Graph.

## When to use which

| Your environment | Best path |
|---|---|
| Planner Premium / Project Plan 3 | Use the app's **Export CSV** button → import directly in Planner |
| Planner Basic (no CSV import) | Use this script (requires admin to consent to Graph scopes) |
| No PowerShell allowed | Use **Export CSV** and open in Excel as a working list alongside Planner |

## Prerequisites

- **PowerShell 7+** (cross-platform: works on Windows, macOS, Linux)
- The **Microsoft.Graph** PowerShell module:
  ```powershell
  Install-Module Microsoft.Graph -Scope CurrentUser
  ```
- A Microsoft 365 account with permission to create/manage the target Group's Plan
- The **Group ID** that will own the Plan (find it in Microsoft 365 admin center → Teams & groups → Active teams & groups → click the group → copy the Object ID)
- A **JSON snapshot** exported from the web app (the "Export JSON" button)

## Required Graph scopes

The script requests delegated consent for:

- `Group.ReadWrite.All`
- `Tasks.ReadWrite`
- `User.Read`

You'll be prompted in a browser the first time. If your tenant requires admin consent for these scopes, an admin will need to approve.

## Usage

```powershell
# Basic usage: create or update a plan named "Microsoft 365 Copilot Readiness"
./Sync-PlannerFromSnapshot.ps1 `
  -SnapshotPath ./copilot-readiness-tracker-snapshot.json `
  -GroupId 11111111-2222-3333-4444-555555555555

# Preview what would change without writing anything
./Sync-PlannerFromSnapshot.ps1 `
  -SnapshotPath ./copilot-readiness-tracker-snapshot.json `
  -GroupId 11111111-2222-3333-4444-555555555555 `
  -DryRun

# Use a custom plan name and include questions already marked Completed
./Sync-PlannerFromSnapshot.ps1 `
  -SnapshotPath ./snapshot.json `
  -GroupId 11111111-2222-3333-4444-555555555555 `
  -PlanName "Copilot Wave 2 Rollout" `
  -IncludeCompleted

# Point at a non-default questions.json
./Sync-PlannerFromSnapshot.ps1 `
  -SnapshotPath ./snapshot.json `
  -GroupId 11111111-2222-3333-4444-555555555555 `
  -QuestionsPath ../app/data/questions.json
```

## What the script does

1. Loads the snapshot (`responses`) and merges with question metadata (`questions.json`).
2. Signs you in with device code flow.
3. Finds the plan in the target group by name, or creates it.
4. Creates one **bucket per workload** (Identity, Apps, Network, …) if missing.
5. For each question that hasn't been completed:
   - Creates a Planner task (or updates an existing one — see *Idempotency*)
   - Title = the question prompt (truncated to 255 chars)
   - Priority mapped from criticality (high → 1 Urgent, medium → 5 Medium, low → 9 Low)
   - Progress mapped from snapshot status (Not started / In progress / Completed)
   - Description contains the remediation hint, source URL, and your snapshot comment

## Idempotency — safe to re-run

The script stamps `<!-- copilot-enablement:Q-### -->` in each task's description. On re-run it:

1. Lists existing tasks in the plan
2. Parses the stamp to match snapshot questions to existing tasks
3. **Updates** existing tasks (priority, progress, description) instead of creating duplicates
4. Creates only genuinely new tasks

You can safely run the script multiple times as you make progress through the assessment.

## Limitations

- **Owner assignment is not automated.** Owners in the snapshot are free-text names that don't reliably map to Entra users without a separate lookup step. The script leaves tasks unassigned; assign them in Planner after creation.
- **Due dates and start dates are not set.** The app doesn't track these.
- **Labels are not created** (Planner labels are colour-coded by position and we can't deterministically pick the same colour across plans). Workload is encoded as the bucket name instead.
- **Single-tenant only.** No support for cross-tenant plan creation.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Insufficient privileges to complete the operation` | Missing Graph consent | Re-run; ensure you accept the consent prompt, or have an admin consent for the required scopes |
| `Resource not found` when creating the plan | Wrong `GroupId`, or you're not a member of the group | Verify the Group's Object ID and your membership |
| Tasks created twice | Description stamp was edited manually | Delete duplicates; the script keys off the `<!-- copilot-enablement:Q-### -->` marker |
| Long titles get truncated mid-word | Planner's 255-char title limit | Edit the prompt in the source `questions.json` or accept the truncation |

## Source

- Snapshot format: see the web app's **Export JSON** output
- Questions metadata: `app/data/questions.json`
- Mapping table: see [the Help panel in the web app](../app/index.html) → "Move work into Microsoft Planner" → "Column mapping"
