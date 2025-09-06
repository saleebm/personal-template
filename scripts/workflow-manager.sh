#!/usr/bin/env bash

# GitHub Actions Workflow Manager
# Central management for all workflow operations
# Usage: ./scripts/workflow-manager.sh [command] [options]

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER=$(gh repo view --json owner -q .owner.login)
REPO_NAME=$(gh repo view --json name -q .name)

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to show usage
show_usage() {
    cat << EOF
GitHub Actions Workflow Manager

USAGE:
    $0 [command] [options]

COMMANDS:
    status              Show status of all workflows
    runs [workflow]     List recent runs for a workflow
    trigger [workflow]  Manually trigger a workflow
    logs [run-id]       View logs for a specific run
    failures            Show recent failures across all workflows
    metrics             Display workflow performance metrics
    cache               Manage workflow caches
    secrets             List configured secrets
    help                Show this help message

WORKFLOW PURPOSE:
    CI                  - Main continuous integration pipeline
    Deploy Check        - Pre-deployment validation and readiness check
    Claude Code         - AI code review and analysis
    Claude Code Review  - Automated PR review
    Claude Actions      - AI-powered workflow automation
    Claude Dispatch     - Manual AI task dispatch
    Maintenance         - Repository maintenance tasks

OPTIONS:
    -l, --limit [n]     Limit number of results (default: 10)
    -w, --watch         Watch mode for continuous updates
    -v, --verbose       Verbose output

EXAMPLES:
    $0 status                    # Show all workflow statuses
    $0 runs CI --limit 5         # Show last 5 CI runs
    $0 trigger "Deploy Check"    # Manually trigger deployment check
    $0 failures                  # Show recent workflow failures
    $0 metrics                   # Display performance metrics

EOF
}

# Function to check GitHub CLI authentication
check_auth() {
    if ! gh auth status &>/dev/null; then
        print_color "$RED" "Error: GitHub CLI is not authenticated"
        echo "Run: gh auth login"
        exit 1
    fi
}

# Function to show workflow status
show_status() {
    print_color "$BLUE" "=== Workflow Status ==="
    echo ""
    
    gh workflow list --all | while IFS=$'\t' read -r name state id; do
        if [ "$state" = "active" ]; then
            status_icon="✅"
            color=$GREEN
        else
            status_icon="⚠️"
            color=$YELLOW
        fi
        
        # Get last run status
        last_run=$(gh run list --workflow="$id" --limit 1 --json conclusion,status,startedAt \
            --jq '.[0] | "\(.status) | \(.conclusion // "running") | \(.startedAt)"' 2>/dev/null || echo "No runs")
        
        print_color "$color" "$status_icon $name [$state]"
        echo "   Last run: $last_run"
    done
}

# Function to list workflow runs
list_runs() {
    local workflow=$1
    local limit=${2:-10}
    
    print_color "$BLUE" "=== Recent Runs for $workflow ==="
    echo ""
    
    gh run list --workflow="$workflow" --limit "$limit" \
        --json conclusion,status,displayTitle,startedAt,workflowName \
        --jq '.[] | "\(.status) | \(.conclusion // "running") | \(.displayTitle) | \(.startedAt)"' | \
    while IFS='|' read -r status conclusion title started; do
        # Set status icon based on conclusion
        case "$conclusion" in
            success)
                icon="✅"
                color=$GREEN
                ;;
            failure)
                icon="❌"
                color=$RED
                ;;
            cancelled)
                icon="⚫"
                color=$YELLOW
                ;;
            *)
                icon="🔄"
                color=$BLUE
                ;;
        esac
        
        print_color "$color" "$icon $title"
        echo "   Started: $started"
    done
}

# Function to trigger a workflow
trigger_workflow() {
    local workflow=$1
    
    print_color "$BLUE" "Triggering workflow: $workflow"
    
    if gh workflow run "$workflow"; then
        print_color "$GREEN" "✅ Workflow triggered successfully"
        echo "View runs: gh run list --workflow=\"$workflow\""
    else
        print_color "$RED" "❌ Failed to trigger workflow"
        exit 1
    fi
}

# Function to show recent failures
show_failures() {
    print_color "$RED" "=== Recent Workflow Failures ==="
    echo ""
    
    gh run list --status failure --limit 10 \
        --json conclusion,displayTitle,workflowName,startedAt,url \
        --jq '.[] | "❌ \(.workflowName): \(.displayTitle)\n   Started: \(.startedAt)\n   URL: \(.url)\n"'
}

# Function to show workflow metrics
show_metrics() {
    print_color "$BLUE" "=== Workflow Performance Metrics ==="
    echo ""
    
    # Calculate success rate for each workflow
    gh workflow list --json name,id | jq -r '.[] | "\(.id)\t\(.name)"' | while IFS=$'\t' read -r id name; do
        # Get last 20 runs
        runs=$(gh run list --workflow="$id" --limit 20 --json conclusion 2>/dev/null)
        
        if [ -n "$runs" ] && [ "$runs" != "[]" ]; then
            total=$(echo "$runs" | jq 'length')
            success=$(echo "$runs" | jq '[.[] | select(.conclusion == "success")] | length')
            failure=$(echo "$runs" | jq '[.[] | select(.conclusion == "failure")] | length')
            
            if [ "$total" -gt 0 ]; then
                success_rate=$((success * 100 / total))
                
                # Color based on success rate
                if [ "$success_rate" -ge 90 ]; then
                    color=$GREEN
                elif [ "$success_rate" -ge 70 ]; then
                    color=$YELLOW
                else
                    color=$RED
                fi
                
                print_color "$color" "$name"
                echo "   Success Rate: ${success_rate}% ($success/$total runs)"
                echo "   Failures: $failure"
                echo ""
            fi
        fi
    done
    
    # Show cache usage
    print_color "$BLUE" "=== Cache Usage ==="
    gh cache list --limit 5 | head -10 || echo "No cache data available"
}

# Function to manage cache
manage_cache() {
    print_color "$BLUE" "=== GitHub Actions Cache ==="
    echo ""
    
    case "$1" in
        list)
            gh cache list
            ;;
        clear)
            print_color "$YELLOW" "Clearing all caches..."
            gh cache delete --all
            print_color "$GREEN" "✅ Caches cleared"
            ;;
        *)
            gh cache list --limit 10
            echo ""
            echo "To clear cache: $0 cache clear"
            ;;
    esac
}

# Function to list secrets
list_secrets() {
    print_color "$BLUE" "=== Repository Secrets ==="
    echo ""
    
    gh secret list
    
    echo ""
    print_color "$YELLOW" "Note: Secret values are not visible for security"
    echo "To set a secret: gh secret set SECRET_NAME"
}

# Main command handler
main() {
    check_auth
    
    case "$1" in
        status)
            show_status
            ;;
        runs)
            list_runs "$2" "${3:-10}"
            ;;
        trigger)
            trigger_workflow "$2"
            ;;
        failures)
            show_failures
            ;;
        metrics)
            show_metrics
            ;;
        cache)
            manage_cache "$2"
            ;;
        secrets)
            list_secrets
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"