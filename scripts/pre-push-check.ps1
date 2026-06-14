#!/usr/bin/env pwsh
# PowerShell script for pre-push checks
# Run this script before pushing to GitHub to ensure code quality

param(
    [switch]$SkipTests,
    [switch]$SkipBuild,
    [switch]$Fix
)

$ErrorActionPreference = "Stop"
$script:HasErrors = $false

# Colors for output
function Write-Header {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host " $Message" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[PASS] $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
    $script:HasErrors = $true
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Yellow
}

function Write-Step {
    param([string]$Message)
    Write-Host "`n>>> $Message" -ForegroundColor White
}

# Track start time
$StartTime = Get-Date

Write-Header "Pre-Push Check Script"
Write-Info "Started at: $($StartTime.ToString('yyyy-MM-dd HH:mm:ss'))"

# 1. TypeScript Type Check
Write-Step "1. TypeScript Type Check"
try {
    npm run typecheck 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "TypeScript type check passed"
    } else {
        Write-Fail "TypeScript type check failed"
        npm run typecheck
    }
} catch {
    Write-Fail "TypeScript type check failed: $_"
}

# 2. ESLint Check
Write-Step "2. ESLint Check"
try {
    if ($Fix) {
        npm run lint:fix
        Write-Info "ESLint auto-fix applied"
    }
    
    $lintOutput = npm run lint 2>&1
    $errorCount = ($lintOutput | Select-String " error " -AllMatches).Matches.Count
    
    if ($errorCount -gt 0) {
        Write-Fail "ESLint found $errorCount error(s)"
        Write-Host $lintOutput
    } else {
        $warningCount = ($lintOutput | Select-String " warning " -AllMatches).Matches.Count
        if ($warningCount -gt 0) {
            Write-Info "ESLint passed with $warningCount warning(s)"
        }
        Write-Success "ESLint check passed"
    }
} catch {
    Write-Fail "ESLint check failed: $_"
}

# 3. Prettier Format Check
Write-Step "3. Prettier Format Check"
try {
    npm run format:check 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Prettier format check passed"
    } else {
        Write-Info "Code formatting issues found. Run 'npm run format' to fix."
        if ($Fix) {
            npm run format
            Write-Info "Prettier auto-format applied"
            Write-Success "Prettier format check passed (after fix)"
        } else {
            Write-Fail "Prettier format check failed"
        }
    }
} catch {
    Write-Fail "Prettier format check failed: $_"
}

# 4. Unit Tests (optional)
if (-not $SkipTests) {
    Write-Step "4. Unit Tests"
    try {
        npm test 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Unit tests passed"
        } else {
            Write-Fail "Unit tests failed"
            npm test
        }
    } catch {
        Write-Info "No test script or tests failed: $_"
    }
} else {
    Write-Info "Skipping unit tests (-SkipTests flag)"
}

# 5. Build (optional)
if (-not $SkipBuild) {
    Write-Step "5. Build"
    try {
        npm run build 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Build passed"
        } else {
            Write-Fail "Build failed"
            npm run build
        }
    } catch {
        Write-Fail "Build failed: $_"
    }
} else {
    Write-Info "Skipping build (-SkipBuild flag)"
}

# 6. Git Status
Write-Step "6. Git Status"
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Info "Uncommitted changes detected:"
    Write-Host $gitStatus
} else {
    Write-Success "Working directory clean"
}

# Summary
$EndTime = Get-Date
$Duration = $EndTime - $StartTime

Write-Header "Summary"
Write-Host "Duration: $($Duration.TotalSeconds.ToString('F2')) seconds"

if ($script:HasErrors) {
    Write-Host "`n[RESULT] Checks FAILED - Please fix the errors before pushing" -ForegroundColor Red
    exit 1
} else {
    Write-Host "`n[RESULT] All checks PASSED - Ready to push!" -ForegroundColor Green
    exit 0
}
