<#
.SYNOPSIS
    Create or update a Microsoft Planner plan from a Copilot Enablement Tracker snapshot.

.DESCRIPTION
    Reads a JSON snapshot exported from the Copilot Enablement Hub web app and merges
    it with the question bank metadata to create a Planner plan with buckets (per
    workload) and tasks (per question). Designed for customers on Planner Basic that
    lack native CSV import. Safe to re-run — existing tasks are updated by matching
    the <!-- copilot-enablement:Q-### --> stamp in the task description.

.PARAMETER SnapshotPath
    Path to the JSON snapshot file exported from the web app (Export JSON button).

.PARAMETER GroupId
    Object ID of the Microsoft 365 Group that will own the plan.

.PARAMETER PlanName
    Name of the Planner plan. Created if missing, updated if it exists.
    Defaults to "Microsoft 365 Copilot Readiness".

.PARAMETER QuestionsPath
    Path to the question bank JSON. Defaults to ../app/data/questions.json relative
    to this script.

.PARAMETER IncludeCompleted
    Include questions whose status is "completed", "will_not_pursue", or
    "not_applicable". By default these are skipped — Planner is for what's still to do.

.PARAMETER DryRun
    Print what would be created or updated without making any Graph calls that write
    data. Useful for previewing the impact before pushing into a live plan.

.EXAMPLE
    ./Sync-PlannerFromSnapshot.ps1 -SnapshotPath ./snapshot.json -GroupId 11111111-2222-3333-4444-555555555555

.EXAMPLE
    ./Sync-PlannerFromSnapshot.ps1 -SnapshotPath ./snapshot.json -GroupId <guid> -PlanName "Copilot Wave 2" -DryRun

.NOTES
    Requires the Microsoft.Graph PowerShell module (Install-Module Microsoft.Graph).
    Required delegated scopes: Group.ReadWrite.All, Tasks.ReadWrite, User.Read.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string] $SnapshotPath,

    [Parameter(Mandatory)]
    [string] $GroupId,

    [string] $PlanName = 'Microsoft 365 Copilot Readiness',

    [string] $QuestionsPath,

    [switch] $IncludeCompleted,

    [switch] $DryRun
)

$ErrorActionPreference = 'Stop'

# --- Constants ------------------------------------------------------------

$CriticalityToPriority = @{
    high   = 1   # Urgent
    medium = 5   # Medium
    low    = 9   # Low
}

# Planner percentComplete: 0 = Not started, 50 = In progress, 100 = Completed
$StatusToPercent = @{
    not_reviewed       = 0
    not_started        = 0
    in_planning        = 0
    planned            = 0
    in_progress        = 50
    completed          = 100
    blocked            = 50
    first_party_other  = 50
    third_party        = 50
    will_not_pursue    = 100
    ms_roadmap         = 0
    follow_up          = 50
    not_applicable     = 100
}

$StatusLabels = @{
    not_reviewed       = 'Not Reviewed'
    not_started        = 'Not Started'
    in_planning        = 'In Planning'
    planned            = 'Planned'
    in_progress        = 'In Progress'
    completed          = 'Completed'
    blocked            = 'Blocked'
    first_party_other  = 'First Party Other'
    third_party        = 'Third Party'
    will_not_pursue    = 'Will Not Pursue'
    ms_roadmap         = 'MS Roadmap'
    follow_up          = 'Follow Up'
    not_applicable     = 'Not Applicable'
}

$SkipStatusesByDefault = @('completed', 'will_not_pursue', 'not_applicable')

# --- Helpers --------------------------------------------------------------

function Get-QuestionsPath {
    param([string] $Explicit)
    if ($Explicit) {
        if (-not (Test-Path $Explicit)) {
            throw "Questions file not found at -QuestionsPath: $Explicit"
        }
        return (Resolve-Path $Explicit).Path
    }
    $scriptDir = Split-Path -Parent $PSCommandPath
    $default = Join-Path $scriptDir '..\app\data\questions.json'
    if (-not (Test-Path $default)) {
        throw "Default questions.json not found at $default. Pass -QuestionsPath explicitly."
    }
    return (Resolve-Path $default).Path
}

function Build-TaskDescription {
    param(
        [Parameter(Mandatory)] $Question,
        [Parameter(Mandatory)] $Response
    )
    $statusLabel = $StatusLabels[$Response.status]
    if (-not $statusLabel) { $statusLabel = 'Not Reviewed' }

    $sb = [System.Text.StringBuilder]::new()
    if ($Question.remediationHint) {
        [void]$sb.AppendLine($Question.remediationHint)
        [void]$sb.AppendLine()
    }
    if ($Question.sourceUrl) {
        [void]$sb.AppendLine("Reference: $($Question.sourceUrl)")
        [void]$sb.AppendLine()
    }
    if ($Response.comment) {
        [void]$sb.AppendLine("Notes: $($Response.comment)")
        [void]$sb.AppendLine()
    }
    [void]$sb.AppendLine("Status: $statusLabel")
    [void]$sb.AppendLine()
    [void]$sb.Append("<!-- copilot-enablement:$($Question.id) -->")
    return $sb.ToString()
}

function Get-StampedQuestionId {
    param([string] $Description)
    if (-not $Description) { return $null }
    if ($Description -match '<!--\s*copilot-enablement:(Q-\d+)\s*-->') {
        return $Matches[1]
    }
    return $null
}

function Assert-Module {
    param([string[]] $Names)
    foreach ($n in $Names) {
        if (-not (Get-Module -ListAvailable -Name $n)) {
            throw "Required module '$n' is not installed. Run: Install-Module Microsoft.Graph -Scope CurrentUser"
        }
    }
}

# --- Load inputs ----------------------------------------------------------

if (-not (Test-Path $SnapshotPath)) {
    throw "Snapshot file not found: $SnapshotPath"
}

Write-Host "Loading snapshot:    $SnapshotPath"
$snapshot = Get-Content -Raw -Path $SnapshotPath | ConvertFrom-Json
if (-not $snapshot.responses) {
    throw 'Snapshot is missing the "responses" object. Is this a Copilot Enablement Hub JSON export?'
}

$resolvedQuestions = Get-QuestionsPath -Explicit $QuestionsPath
Write-Host "Loading questions:   $resolvedQuestions"
$questionBank = (Get-Content -Raw -Path $resolvedQuestions | ConvertFrom-Json).questions
if (-not $questionBank) {
    throw 'Questions file does not contain a "questions" array.'
}

# Build a lookup of responses (PSCustomObject from ConvertFrom-Json behaves
# like a hashtable but needs the property-access pattern).
$responseMap = @{}
foreach ($prop in $snapshot.responses.PSObject.Properties) {
    $responseMap[$prop.Name] = $prop.Value
}

# --- Determine work set ---------------------------------------------------

$work = [System.Collections.Generic.List[object]]::new()
foreach ($q in $questionBank) {
    $r = $responseMap[$q.id]
    $status = if ($r -and $r.status) { $r.status } else { 'not_reviewed' }
    if (-not $IncludeCompleted -and $SkipStatusesByDefault -contains $status) {
        continue
    }
    $work.Add([pscustomobject]@{
        Question = $q
        Response = if ($r) { $r } else { [pscustomobject]@{ status = 'not_reviewed'; comment = ''; owner = ''; lane = '' } }
        Status   = $status
    })
}

if ($work.Count -eq 0) {
    Write-Host "Nothing to export. All questions are completed/N-A/will-not-pursue. Use -IncludeCompleted to include them."
    return
}

$byWorkload = $work | Group-Object { $_.Question.workload }

Write-Host ""
Write-Host "Plan target group:   $GroupId"
Write-Host "Plan name:           $PlanName"
Write-Host "Tasks to upsert:     $($work.Count) across $($byWorkload.Count) buckets"
if ($DryRun) { Write-Host "Mode:                DryRun (no writes)" -ForegroundColor Yellow }
Write-Host ""

# --- DryRun: print and exit -----------------------------------------------

if ($DryRun) {
    foreach ($g in $byWorkload | Sort-Object Name) {
        Write-Host "  [Bucket] $($g.Name)  ($($g.Count) task(s))"
        foreach ($w in $g.Group) {
            $priority = $CriticalityToPriority[$w.Question.criticality]
            $percent = $StatusToPercent[$w.Status]
            Write-Host ("      - {0,-6} {1,-12} {2}% {3}" -f $w.Question.id, $w.Question.criticality, $percent, $w.Question.prompt)
        }
    }
    Write-Host ""
    Write-Host "DryRun complete. No data was written." -ForegroundColor Yellow
    return
}

# --- Connect to Graph -----------------------------------------------------

Assert-Module @('Microsoft.Graph.Authentication', 'Microsoft.Graph.Planner')

Import-Module Microsoft.Graph.Authentication -ErrorAction Stop
Import-Module Microsoft.Graph.Planner -ErrorAction Stop

Write-Host "Signing in (device code flow)..."
Connect-MgGraph -Scopes 'Group.ReadWrite.All', 'Tasks.ReadWrite', 'User.Read' -NoWelcome | Out-Null

# --- Find or create the plan ----------------------------------------------

Write-Host "Looking up plans for group $GroupId..."
$plans = Get-MgGroupPlannerPlan -GroupId $GroupId -ErrorAction Stop
$plan = $plans | Where-Object { $_.Title -eq $PlanName } | Select-Object -First 1

if (-not $plan) {
    Write-Host "Creating plan '$PlanName'..."
    $plan = New-MgPlannerPlan -BodyParameter @{
        owner = $GroupId
        title = $PlanName
    }
} else {
    Write-Host "Found existing plan '$PlanName' (Id: $($plan.Id))"
}

$planId = $plan.Id

# --- Ensure buckets exist -------------------------------------------------

$existingBuckets = Get-MgPlannerPlanBucket -PlannerPlanId $planId
$bucketIdByName = @{}
foreach ($b in $existingBuckets) { $bucketIdByName[$b.Name] = $b.Id }

foreach ($g in $byWorkload) {
    if (-not $bucketIdByName.ContainsKey($g.Name)) {
        Write-Host "  Creating bucket '$($g.Name)'..."
        $newBucket = New-MgPlannerBucket -BodyParameter @{
            name     = $g.Name
            planId   = $planId
            orderHint = ' !'
        }
        $bucketIdByName[$g.Name] = $newBucket.Id
    }
}

# --- Index existing tasks by question-id stamp ----------------------------

Write-Host "Indexing existing tasks for idempotent updates..."
$existingTasks = Get-MgPlannerPlanTask -PlannerPlanId $planId
$existingByQid = @{}
foreach ($t in $existingTasks) {
    $details = Get-MgPlannerTaskDetail -PlannerTaskId $t.Id -ErrorAction SilentlyContinue
    $qid = Get-StampedQuestionId -Description $details.Description
    if ($qid) { $existingByQid[$qid] = @{ Task = $t; Details = $details } }
}

# --- Upsert tasks ---------------------------------------------------------

$created = 0
$updated = 0

foreach ($w in $work) {
    $q = $w.Question
    $r = $w.Response
    $bucketId = $bucketIdByName[$q.workload]
    $priority = $CriticalityToPriority[$q.criticality]
    if ($null -eq $priority) { $priority = 5 }
    $percent = $StatusToPercent[$w.Status]
    if ($null -eq $percent) { $percent = 0 }

    $title = if ($w.Status -eq 'blocked') { "[BLOCKED] $($q.prompt)" } else { $q.prompt }
    if ($title.Length -gt 255) { $title = $title.Substring(0, 252) + '...' }

    $description = Build-TaskDescription -Question $q -Response $r

    if ($existingByQid.ContainsKey($q.id)) {
        $existing = $existingByQid[$q.id]
        $task = $existing.Task
        $detail = $existing.Details

        Write-Host "  [update] $($q.id)  $title"
        $taskEtag = $task.AdditionalProperties['@odata.etag']
        Update-MgPlannerTask -PlannerTaskId $task.Id -IfMatch $taskEtag -BodyParameter @{
            title            = $title
            priority         = $priority
            percentComplete  = $percent
            bucketId         = $bucketId
        } | Out-Null

        $detailEtag = $detail.AdditionalProperties['@odata.etag']
        Update-MgPlannerTaskDetail -PlannerTaskId $task.Id -IfMatch $detailEtag -BodyParameter @{
            description = $description
        } | Out-Null
        $updated++
    } else {
        Write-Host "  [create] $($q.id)  $title"
        $newTask = New-MgPlannerTask -BodyParameter @{
            planId          = $planId
            bucketId        = $bucketId
            title           = $title
            priority        = $priority
            percentComplete = $percent
        }

        # Task details (description) requires a follow-up PATCH with the etag
        $newDetails = Get-MgPlannerTaskDetail -PlannerTaskId $newTask.Id
        $detailEtag = $newDetails.AdditionalProperties['@odata.etag']
        Update-MgPlannerTaskDetail -PlannerTaskId $newTask.Id -IfMatch $detailEtag -BodyParameter @{
            description = $description
        } | Out-Null
        $created++
    }
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host "  Created: $created"
Write-Host "  Updated: $updated"
Write-Host "  Plan:    https://tasks.office.com/$($GroupId)/Home/PlanViews/$planId"
