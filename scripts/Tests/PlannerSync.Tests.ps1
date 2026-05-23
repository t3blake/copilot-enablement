# Pester 5.x tests for Sync-PlannerFromSnapshot.ps1
#
# These tests cover the pure helper functions and constants. They do NOT call
# Microsoft Graph — those code paths are exercised by live runs against the
# lab tenant. To run:
#
#   Invoke-Pester -Path .\scripts\Tests\PlannerSync.Tests.ps1 -Output Detailed

BeforeAll {
    $scriptPath = Join-Path $PSScriptRoot '..\Sync-PlannerFromSnapshot.ps1'
    if (-not (Test-Path $scriptPath)) {
        throw "Script under test not found: $scriptPath"
    }

    # Parse the script and pull out function definitions + top-level
    # variable assignments so we can exercise them in isolation without
    # triggering the [CmdletBinding()] param block or any Graph calls.
    $tokens = $null
    $parseErrors = $null
    $ast = [System.Management.Automation.Language.Parser]::ParseFile(
        $scriptPath, [ref] $tokens, [ref] $parseErrors)
    if ($parseErrors.Count -gt 0) {
        throw "Parse errors in $scriptPath`: $($parseErrors -join '; ')"
    }

    $functionAsts = $ast.FindAll({
            param($node)
            $node -is [System.Management.Automation.Language.FunctionDefinitionAst]
        }, $false)
    foreach ($f in $functionAsts) {
        # Define each helper at the test script's scope.
        . ([scriptblock]::Create($f.Extent.Text))
    }

    # Mirror the constants the helpers depend on. Keep this list in sync
    # with the script's `# --- Constants` block.
    $script:StatusLabels = @{
        not_reviewed = 'Not Reviewed'
        in_progress  = 'In Progress'
        completed    = 'Completed'
        blocked      = 'Blocked'
    }
}

Describe 'Get-StampedQuestionId' {
    It 'extracts a plain Q-### id' {
        Get-StampedQuestionId -Description 'foo bar <!-- copilot-enablement:Q-005 --> baz' |
            Should -Be 'Q-005'
    }

    It 'extracts a QB-### id (multi-letter prefix)' {
        # Regression: original regex was (Q-\d+) which silently dropped
        # QB-prefixed ids and caused duplicate tasks on every re-run.
        Get-StampedQuestionId -Description '<!-- copilot-enablement:QB-135 -->' |
            Should -Be 'QB-135'
    }

    It 'tolerates whitespace inside the stamp' {
        Get-StampedQuestionId -Description '<!--   copilot-enablement:QB-101   -->' |
            Should -Be 'QB-101'
    }

    It 'returns $null for descriptions with no stamp' {
        Get-StampedQuestionId -Description 'just some notes from a human' |
            Should -BeNullOrEmpty
    }

    It 'returns $null for an empty description' {
        Get-StampedQuestionId -Description '' | Should -BeNullOrEmpty
    }

    It 'returns $null for a null description' {
        Get-StampedQuestionId -Description $null | Should -BeNullOrEmpty
    }
}

Describe 'Build-TaskDescription' {
    BeforeAll {
        $script:sampleQuestion = [pscustomobject]@{
            id              = 'QB-101'
            prompt          = 'Sample prompt?'
            remediationHint = 'Do the thing.'
            sourceUrl       = 'https://example.com/docs'
        }
        $script:sampleResponse = [pscustomobject]@{
            status  = 'in_progress'
            comment = 'half done'
            owner   = ''
            lane    = ''
        }
    }

    It 'includes the remediation hint' {
        $out = Build-TaskDescription -Question $sampleQuestion -Response $sampleResponse
        $out | Should -Match 'Do the thing\.'
    }

    It 'includes the source URL as Reference:' {
        $out = Build-TaskDescription -Question $sampleQuestion -Response $sampleResponse
        $out | Should -Match 'Reference: https://example\.com/docs'
    }

    It 'includes the user comment as Notes:' {
        $out = Build-TaskDescription -Question $sampleQuestion -Response $sampleResponse
        $out | Should -Match 'Notes: half done'
    }

    It 'includes a human-readable status label' {
        $out = Build-TaskDescription -Question $sampleQuestion -Response $sampleResponse
        $out | Should -Match 'Status: In Progress'
    }

    It 'always emits the idempotency stamp using the question id' {
        $out = Build-TaskDescription -Question $sampleQuestion -Response $sampleResponse
        $out | Should -Match '<!-- copilot-enablement:QB-101 -->'
    }

    It 'round-trips through Get-StampedQuestionId' {
        $out = Build-TaskDescription -Question $sampleQuestion -Response $sampleResponse
        Get-StampedQuestionId -Description $out | Should -Be 'QB-101'
    }

    It 'falls back to "Not Reviewed" for unknown status values' {
        $r = [pscustomobject]@{ status = 'something_made_up'; comment = ''; owner = ''; lane = '' }
        (Build-TaskDescription -Question $sampleQuestion -Response $r) |
            Should -Match 'Status: Not Reviewed'
    }

    It 'omits the Notes line when comment is empty' {
        $r = [pscustomobject]@{ status = 'completed'; comment = ''; owner = ''; lane = '' }
        (Build-TaskDescription -Question $sampleQuestion -Response $r) |
            Should -Not -Match 'Notes:'
    }
}

Describe 'Invoke-WithRetry' {
    It 'returns the script block result on first success' {
        $result = Invoke-WithRetry -What 'happy path' -Script { 'ok' }
        $result | Should -Be 'ok'
    }

    It 'retries a transient 503 and eventually succeeds' {
        $script:attempt = 0
        $result = Invoke-WithRetry -What 'flaky' -MaxAttempts 4 -Script {
            $script:attempt++
            if ($script:attempt -lt 3) {
                throw [System.Exception]::new('Response status code does not indicate success: 503 (ServiceUnavailable).')
            }
            return 'recovered'
        }
        $result | Should -Be 'recovered'
        $script:attempt | Should -Be 3
    }

    It 'throws immediately on a non-transient error (no retry)' {
        $script:calls = 0
        { Invoke-WithRetry -What 'fatal' -MaxAttempts 5 -Script {
                $script:calls++
                throw 'Permission denied: 403 Forbidden'
            } } | Should -Throw
        $script:calls | Should -Be 1
    }

    It 'gives up after MaxAttempts and rethrows the original failure' {
        $script:calls = 0
        { Invoke-WithRetry -What 'always-503' -MaxAttempts 3 -Script {
                $script:calls++
                throw '503 ServiceUnavailable forever'
            } } | Should -Throw '*503*'
        $script:calls | Should -Be 3
    }

    It 'treats "Too many retries" as transient' {
        $script:calls = 0
        $result = Invoke-WithRetry -What 'throttled' -MaxAttempts 3 -Script {
            $script:calls++
            if ($script:calls -eq 1) { throw 'Too many retries performed' }
            return 'done'
        }
        $result | Should -Be 'done'
        $script:calls | Should -Be 2
    }
}

Describe 'Get-QuestionsPath' {
    It 'returns the explicit path when it exists' {
        $tmp = New-TemporaryFile
        try {
            (Get-QuestionsPath -Explicit $tmp.FullName) | Should -Be $tmp.FullName
        }
        finally { Remove-Item $tmp -Force }
    }

    It 'throws when an explicit path is missing' {
        { Get-QuestionsPath -Explicit 'C:\definitely\not\here.json' } |
            Should -Throw '*not found*'
    }
}
