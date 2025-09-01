#!/bin/bash

# AI Dr. Environment Setup Script
# This script helps you set up environment variables globally

echo "🔄 AI Dr. Environment Setup"
echo "============================"
echo ""
echo "This script will help you configure environment variables globally."
echo "Add the following to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
echo ""
echo "# AI Dr. Environment Variables"
echo "# =============================="
echo ""

# Read from .env.example and generate export commands
if [ -f ".env.example" ]; then
    while IFS= read -r line; do
        # Skip comments and empty lines
        if [[ ! "$line" =~ ^# ]] && [[ -n "$line" ]]; then
            # Extract variable name
            var_name=$(echo "$line" | cut -d'=' -f1)
            var_default=$(echo "$line" | cut -d'=' -f2-)
            
            # Check if variable is already set
            if [ -z "${!var_name}" ]; then
                echo "export $var_name=\"$var_default\"  # Update with your actual value"
            else
                echo "# export $var_name=\"${!var_name}\"  # Already set in environment"
            fi
        fi
    done < .env.example
else
    echo "Error: .env.example not found!"
    exit 1
fi

echo ""
echo "# =============================="
echo ""
echo "After adding these exports to your shell profile, run:"
echo "  source ~/.bashrc    # or ~/.zshrc depending on your shell"
echo ""
echo "Current environment status:"
echo "  DATABASE_URL: $([ -n "$DATABASE_URL" ] && echo "✅ Set" || echo "❌ Not set")"
echo "  GEMINI_API_KEY: $([ -n "$GEMINI_API_KEY" ] && echo "✅ Set" || echo "❌ Not set")"
echo "  GITHUB_TOKEN: $([ -n "$GITHUB_TOKEN" ] && echo "✅ Set" || echo "❌ Not set")"
echo ""