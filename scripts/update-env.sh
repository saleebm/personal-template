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

# Function to create or update .env file based on .env.example template
update_env_file() {
    local env_path="$1"
    local existing_env_path="$2"
    
    if [ ! -f ".env.example" ]; then
        print_error "No .env.example file found! Cannot generate environment files."
        exit 1
    fi
    
    print_info "Generating $env_path from .env.example template"
    
    # Start with the .env.example structure but substitute with real values
    cp ".env.example" "$env_path"
    
    # Update the timestamp comment
    sed -i '' "s/# Updated by update-env script on .*/# Updated by update-env script on $(date)/" "$env_path"
    
    # Override with values from existing env file if it exists (preserving user values)
    if [ -f "$existing_env_path" ]; then
        print_info "Preserving existing values from $existing_env_path"
        
        # For each variable in the existing file, substitute it in the new file
        while IFS='=' read -r key value; do
            # Skip comments and empty lines
            [[ "$key" =~ ^[[:space:]]*# ]] && continue
            [[ -z "$key" ]] && continue
            
            # Clean the key
            key=$(echo "$key" | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
            [[ -z "$key" ]] && continue
            
            # Only substitute if the value is not empty and meaningful
            if [[ -n "$value" ]] && [[ "$value" != "''" ]]; then
                # Check if this variable exists in the new file
                if grep -q "^${key}=" "$env_path"; then
                    # Replace the line in the file with the existing value
                    sed -i '' "s|^${key}=.*|${key}=${value}|" "$env_path"
                fi
            fi
        done < "$existing_env_path"
    fi
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

# Show what files we found and will be updating  
echo ""
print_info "The script will preserve your existing values and only update structure."
echo ""

# Ask if user wants to make changes
read -p "Do you want to proceed with updating the environment files? [Y/n]: " PROCEED
if [[ "$PROCEED" =~ ^[Nn]$ ]]; then
    print_info "Aborted by user."
    exit 0
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

# Update root .env using current values
current_root_env=""
if [ -f ".env" ]; then
    current_root_env=".env"
fi
update_env_file ".env" "$current_root_env"
print_success "Updated root .env"

# Update packages/database/.env  
current_db_env=""
if [ -f "packages/database/.env" ]; then
    current_db_env="packages/database/.env"
elif [ -f ".env" ]; then
    current_db_env=".env"
fi
update_env_file "packages/database/.env" "$current_db_env"
print_success "Updated packages/database/.env"

# Create apps/web/.env using template and values from root .env
update_env_file "apps/web/.env" ".env"

# Now substitute shell variables with actual values for Next.js compatibility
if [ -f "apps/web/.env" ]; then
    print_info "Substituting shell variables with actual values for Next.js"
    
    # Substitute the DATABASE_URL with actual values
    if grep -q 'DATABASE_URL=postgresql://\${DB_USER}:\${DB_PASSWORD}@\${DB_HOST}:\${DB_PORT}/\${DB_NAME}' "apps/web/.env"; then
        # Read current values from the apps/web/.env file
        DB_HOST_VAL=$(grep "^DB_HOST=" "apps/web/.env" | cut -d'=' -f2)
        DB_USER_VAL=$(grep "^DB_USER=" "apps/web/.env" | cut -d'=' -f2)
        DB_PASSWORD_VAL=$(grep "^DB_PASSWORD=" "apps/web/.env" | cut -d'=' -f2)
        DB_NAME_VAL=$(grep "^DB_NAME=" "apps/web/.env" | cut -d'=' -f2)
        DB_PORT_VAL=$(grep "^DB_PORT=" "apps/web/.env" | cut -d'=' -f2)
        
        # Build the actual DATABASE_URL
        ACTUAL_DATABASE_URL="postgresql://${DB_USER_VAL}:${DB_PASSWORD_VAL}@${DB_HOST_VAL}:${DB_PORT_VAL}/${DB_NAME_VAL}"
        
        # Replace the variable interpolation with actual values
        sed -i '' "s|DATABASE_URL=postgresql://\\\${DB_USER}:\\\${DB_PASSWORD}@\\\${DB_HOST}:\\\${DB_PORT}/\\\${DB_NAME}|DATABASE_URL='${ACTUAL_DATABASE_URL}'|g" "apps/web/.env"
        print_success "Substituted DATABASE_URL variables with actual values"
    fi
    
    # Substitute any other ${VARIABLE} references with actual values or environment variables
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ "$key" =~ ^[[:space:]]*# ]] && continue
        [[ -z "$key" ]] && continue
        
        # Check if value contains variable interpolation
        if [[ "$value" =~ \$\{([^}]+)\} ]]; then
            var_name="${BASH_REMATCH[1]}"
            # Try to get the actual value from current environment or the value itself if it's set
            if [ -n "${!var_name}" ]; then
                actual_value="${!var_name}"
                # Replace the interpolated variable with the actual value in quotes
                sed -i '' "s|${key}=\\\${${var_name}}|${key}='${actual_value}'|g" "apps/web/.env"
            fi
        fi
    done < "apps/web/.env"
    
    print_success "Created apps/web/.env with variable substitution for Next.js"
else
    print_error "Failed to create apps/web/.env!"
    exit 1
fi

echo ""
print_success "Environment files have been updated successfully!"
echo ""
echo "The DATABASE_URL now uses variable interpolation:"
echo '  DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}'
echo ""
echo "This format allows for easier maintenance and configuration updates."
echo ""
print_info "Backups of your previous .env files have been saved with timestamps."