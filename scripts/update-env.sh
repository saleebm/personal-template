#!/bin/bash

# Bun Monorepo Template - Environment Update Script
# This script helps you update .env files with proper variable interpolation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to prompt for input with default value
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    read -p "$prompt [$default]: " input
    if [ -z "$input" ]; then
        eval "$var_name='$default'"
    else
        eval "$var_name='$input'"
    fi
}

# Function to read existing .env value
read_env_value() {
    local file="$1"
    local key="$2"
    local default="$3"
    
    if [ -f "$file" ]; then
        # Try to extract the value from the .env file
        local value=$(grep "^$key=" "$file" 2>/dev/null | cut -d'=' -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        if [ -n "$value" ] && [ "$value" != "\${$key}" ]; then
            echo "$value"
        else
            echo "$default"
        fi
    else
        echo "$default"
    fi
}

# Function to create or update .env file with interpolated DATABASE_URL
update_env_file() {
    local env_path="$1"
    local is_web_app="$2"
    local db_host="$3"
    local db_user="$4"
    local db_password="$5"
    local db_name="$6"
    local db_port="$7"
    local github_token="$8"
    local gemini_api_key="$9"
    
    # Start building the .env content
    local env_content=""
    env_content+="# Environment Variables\n"
    env_content+="# Updated by update-env script on $(date)\n\n"
    env_content+="# Database Configuration\n"
    env_content+="DB_HOST=$db_host\n"
    env_content+="DB_USER=$db_user\n"
    env_content+="DB_PASSWORD=$db_password\n"
    env_content+="DB_NAME=$db_name\n"
    env_content+="DB_PORT=$db_port\n"
    env_content+="# Use variable interpolation for maintainability\n"
    env_content+='DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}'
    env_content+="\n\n"
    
    # Add API Keys section
    env_content+="# API Keys for MCP Servers\n"
    if [ -n "$github_token" ] && [ "$github_token" != "skip" ]; then
        env_content+="GITHUB_TOKEN=$github_token\n"
    else
        env_content+="GITHUB_TOKEN=\${GITHUB_TOKEN} # Set from local machine\n"
    fi
    
    if [ -n "$gemini_api_key" ] && [ "$gemini_api_key" != "skip" ]; then
        env_content+="GEMINI_API_KEY=$gemini_api_key\n"
    else
        env_content+="GEMINI_API_KEY=\${GEMINI_API_KEY} # Set from local machine\n"
    fi
    
    env_content+="\n# Optional: Development Settings\n"
    env_content+="NODE_ENV=development\n"
    
    # Add web-specific variables if this is for the web app
    if [ "$is_web_app" = "true" ]; then
        env_content+="\n# Public variables (available in browser)\n"
        env_content+="NEXT_PUBLIC_API_URL=http://localhost:3000\n"
        env_content+="\n# Next.js settings\n"
        env_content+="NEXT_TELEMETRY_DISABLED=1\n"
    fi
    
    # Write the content to file
    echo -e "$env_content" > "$env_path"
}

echo "======================================"
echo "  Environment Configuration Updater   "
echo "======================================"
echo ""

print_info "This script will update your .env files with proper variable interpolation."
print_info "It will preserve your existing values where possible."
echo ""

# Check which .env files exist
ROOT_ENV_EXISTS=false
DATABASE_ENV_EXISTS=false
WEB_ENV_EXISTS=false

if [ -f ".env" ]; then
    ROOT_ENV_EXISTS=true
    print_info "Found root .env file"
fi

if [ -f "packages/database/.env" ]; then
    DATABASE_ENV_EXISTS=true
    print_info "Found packages/database/.env file"
fi

if [ -f "apps/web/.env" ]; then
    WEB_ENV_EXISTS=true
    print_info "Found apps/web/.env file"
fi

# Determine which file to read defaults from
DEFAULT_ENV_FILE=""
if [ "$ROOT_ENV_EXISTS" = true ]; then
    DEFAULT_ENV_FILE=".env"
elif [ "$DATABASE_ENV_EXISTS" = true ]; then
    DEFAULT_ENV_FILE="packages/database/.env"
elif [ "$WEB_ENV_EXISTS" = true ]; then
    DEFAULT_ENV_FILE="apps/web/.env"
fi

# Read existing values or use defaults
if [ -n "$DEFAULT_ENV_FILE" ]; then
    print_info "Reading existing configuration from $DEFAULT_ENV_FILE"
    DB_HOST=$(read_env_value "$DEFAULT_ENV_FILE" "DB_HOST" "localhost")
    DB_USER=$(read_env_value "$DEFAULT_ENV_FILE" "DB_USER" "postgres")
    DB_PASSWORD=$(read_env_value "$DEFAULT_ENV_FILE" "DB_PASSWORD" "postgres")
    DB_NAME=$(read_env_value "$DEFAULT_ENV_FILE" "DB_NAME" "myapp")
    DB_PORT=$(read_env_value "$DEFAULT_ENV_FILE" "DB_PORT" "5432")
    GITHUB_TOKEN=$(read_env_value "$DEFAULT_ENV_FILE" "GITHUB_TOKEN" "")
    GEMINI_API_KEY=$(read_env_value "$DEFAULT_ENV_FILE" "GEMINI_API_KEY" "")
else
    # Use defaults if no existing files
    DB_HOST="localhost"
    DB_USER="postgres"
    DB_PASSWORD="postgres"
    DB_NAME="myapp"
    DB_PORT="5432"
    GITHUB_TOKEN=""
    GEMINI_API_KEY=""
fi

echo ""
print_info "Current database configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Prompt for updates
read -p "Do you want to update the database configuration? [y/N]: " UPDATE_DB
if [[ "$UPDATE_DB" =~ ^[Yy]$ ]]; then
    prompt_with_default "Database host" "$DB_HOST" DB_HOST
    prompt_with_default "Database port" "$DB_PORT" DB_PORT
    prompt_with_default "Database name" "$DB_NAME" DB_NAME
    prompt_with_default "Database user" "$DB_USER" DB_USER
    
    # Password prompt (hidden input)
    echo -n "Database password [$DB_PASSWORD]: "
    read -s NEW_DB_PASS
    echo ""
    if [ -n "$NEW_DB_PASS" ]; then
        DB_PASSWORD="$NEW_DB_PASS"
    fi
fi

# API Keys
echo ""
read -p "Do you want to update API keys? [y/N]: " UPDATE_KEYS
if [[ "$UPDATE_KEYS" =~ ^[Yy]$ ]]; then
    prompt_with_default "GitHub Token (enter 'skip' to use environment variable)" "${GITHUB_TOKEN:-skip}" GITHUB_TOKEN
    prompt_with_default "Gemini API Key (enter 'skip' to use environment variable)" "${GEMINI_API_KEY:-skip}" GEMINI_API_KEY
fi

# Backup existing files
echo ""
print_info "Creating backups of existing .env files..."

if [ "$ROOT_ENV_EXISTS" = true ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    print_success "Backed up root .env"
fi

if [ "$DATABASE_ENV_EXISTS" = true ]; then
    cp packages/database/.env packages/database/.env.backup.$(date +%Y%m%d_%H%M%S)
    print_success "Backed up packages/database/.env"
fi

if [ "$WEB_ENV_EXISTS" = true ]; then
    cp apps/web/.env apps/web/.env.backup.$(date +%Y%m%d_%H%M%S)
    print_success "Backed up apps/web/.env"
fi

# Update .env files
echo ""
print_info "Updating .env files..."

# Update root .env
update_env_file ".env" "false" "$DB_HOST" "$DB_USER" "$DB_PASSWORD" "$DB_NAME" "$DB_PORT" "$GITHUB_TOKEN" "$GEMINI_API_KEY"
print_success "Updated root .env"

# Update packages/database/.env
update_env_file "packages/database/.env" "false" "$DB_HOST" "$DB_USER" "$DB_PASSWORD" "$DB_NAME" "$DB_PORT" "$GITHUB_TOKEN" "$GEMINI_API_KEY"
print_success "Updated packages/database/.env"

# Update apps/web/.env
update_env_file "apps/web/.env" "true" "$DB_HOST" "$DB_USER" "$DB_PASSWORD" "$DB_NAME" "$DB_PORT" "$GITHUB_TOKEN" "$GEMINI_API_KEY"
print_success "Updated apps/web/.env"

echo ""
print_success "Environment files have been updated successfully!"
echo ""
echo "The DATABASE_URL now uses variable interpolation:"
echo '  DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}'
echo ""
echo "This format allows for easier maintenance and configuration updates."
echo ""
print_info "Backups of your previous .env files have been saved with timestamps."