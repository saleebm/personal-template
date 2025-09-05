#!/bin/bash

# Unified Bun Monorepo Setup Script
# Combines all setup functionality with backup and non-interactive support
# Usage: ./scripts/setup.sh [--non-interactive] [--skip-database] [--help]

set -e

# Script configuration
SCRIPT_VERSION="2.0.0"
CHECKPOINT_FILE=".setup_checkpoint"
BACKUP_SUFFIX="backup.$(date +%Y%m%d_%H%M%S)"

# Default options
INTERACTIVE=true
SETUP_DATABASE=true
SKIP_ENV=false

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

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --non-interactive    Run without user prompts (uses .env.example values)"
    echo "  --skip-database      Skip database setup entirely"
    echo "  --help              Show this help message"
    echo ""
    echo "Environment Variables (for non-interactive mode):"
    echo "  PROJECT_NAME         Project name (default: my-app)"
    echo "  DB_HOST             Database host (default: localhost)"
    echo "  DB_PORT             Database port (default: 5432)"
    echo "  DB_NAME             Database name (default: from project name)"
    echo "  DB_USER             Database user (default: postgres)"
    echo "  DB_PASSWORD         Database password (default: postgres)"
    echo "  GITHUB_TOKEN        GitHub token for MCP servers"
    echo "  GEMINI_API_KEY      Gemini API key for MCP servers"
    echo "  OPENAI_API_KEY      OpenAI API key for MCP servers"
    echo "  AI_GATEWAY_API_KEY  AI Gateway API key for MCP servers"
    echo ""
    exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --non-interactive)
            INTERACTIVE=false
            shift
            ;;
        --skip-database)
            SETUP_DATABASE=false
            shift
            ;;
        --help)
            show_usage
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            ;;
    esac
done

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to save checkpoint
save_checkpoint() {
    local step="$1"
    echo "$step" >> "$CHECKPOINT_FILE"
    print_info "Checkpoint: Step $step completed"
}

# Function to check if step is completed
is_step_completed() {
    local step="$1"
    if [ -f "$CHECKPOINT_FILE" ]; then
        grep -q "^$step$" "$CHECKPOINT_FILE"
    else
        return 1
    fi
}

# Function to clean up checkpoint on successful completion
cleanup_checkpoint() {
    if [ -f "$CHECKPOINT_FILE" ]; then
        rm "$CHECKPOINT_FILE"
    fi
}

# Function to show resume status
show_resume_status() {
    if [ -f "$CHECKPOINT_FILE" ]; then
        print_warning "Previous setup detected. Completed steps:"
        while read -r step; do
            print_success "  ✓ Step $step"
        done < "$CHECKPOINT_FILE"
        echo ""
        print_info "Resuming from where we left off..."
        echo ""
    fi
}

# Function to prompt for input with default value (interactive mode only)
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    if [ "$INTERACTIVE" = true ]; then
        read -p "$prompt [$default]: " input
        if [ -z "$input" ]; then
            eval "$var_name='$default'"
        else
            eval "$var_name='$input'"
        fi
    else
        # Use environment variable if set, otherwise use default
        local env_value="${!var_name}"
        if [ -n "$env_value" ]; then
            eval "$var_name='$env_value'"
        else
            eval "$var_name='$default'"
        fi
        print_info "$prompt: ${!var_name}"
    fi
}

# Function to prompt for yes/no (interactive mode only)
confirm() {
    local prompt="$1"
    local default="${2:-y}"
    
    if [ "$INTERACTIVE" = false ]; then
        # In non-interactive mode, use default
        [[ "$default" =~ ^[Yy]$ ]]
        return $?
    fi
    
    if [ "$default" = "y" ]; then
        read -p "$prompt [Y/n]: " response
        response=${response:-y}
    else
        read -p "$prompt [y/N]: " response
        response=${response:-n}
    fi
    
    [[ "$response" =~ ^[Yy]$ ]]
}

# Function to backup existing .env files
backup_env_files() {
    local backup_created=false
    
    # Find all .env files and create backups
    while IFS= read -r -d '' env_file; do
        local backup_file="${env_file}.${BACKUP_SUFFIX}"
        cp "$env_file" "$backup_file"
        print_success "Backed up $env_file to $backup_file"
        backup_created=true
    done < <(find . -name ".env" -type f -print0)
    
    if [ "$backup_created" = true ]; then
        print_info "All existing .env files have been backed up"
    else
        print_info "No existing .env files found to backup"
    fi
}

# Function to read existing value from .env file
read_existing_env_value() {
    local file="$1"
    local key="$2"
    local default="$3"
    
    if [ -f "$file" ]; then
        local value=$(grep "^$key=" "$file" 2>/dev/null | cut -d'=' -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//;s/^"//;s/"$//')
        if [ -n "$value" ] && [ "$value" != "\${$key}" ] && [ "$value" != "your_${key,,}" ] && [ "$value" != "your-${key,,}" ]; then
            echo "$value"
        else
            echo "$default"
        fi
    else
        echo "$default"
    fi
}

# Function to create or update .env file with variable substitution
create_env_file() {
    local env_path="$1"
    local env_example_path="$2"
    local preserve_existing="${3:-true}"
    
    if [ ! -f "$env_example_path" ]; then
        print_error "Template file $env_example_path not found!"
        return 1
    fi
    
    print_info "Creating/updating $env_path from $env_example_path"
    
    # Start with the example file
    cp "$env_example_path" "$env_path"
    
    # Update timestamp if present
    if grep -q "# Updated by.*script on" "$env_path"; then
        sed -i.tmp "s/# Updated by.*script on.*/# Updated by unified setup script on $(date)/" "$env_path" && rm -f "$env_path.tmp"
    fi
    
    # If preserving existing values and .env exists, substitute them
    if [ "$preserve_existing" = true ] && [ -f "$env_path.original" ]; then
        print_info "Preserving existing values from $env_path.original"
        
        # Read each variable from the original file and substitute it
        while IFS='=' read -r key value; do
            # Skip comments and empty lines
            [[ "$key" =~ ^[[:space:]]*# ]] && continue
            [[ -z "$key" ]] && continue
            
            # Clean the key
            key=$(echo "$key" | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
            [[ -z "$key" ]] && continue
            
            # Only substitute meaningful values
            if [[ -n "$value" ]] && [[ "$value" != "''" ]] && [[ "$value" != '""' ]]; then
                # Check if this variable exists in the new file and substitute
                if grep -q "^${key}=" "$env_path"; then
                    # Escape special characters for sed
                    escaped_value=$(printf '%s\n' "$value" | sed 's/[[\.*^$()+?{|]/\\&/g')
                    sed -i.tmp "s|^${key}=.*|${key}=${escaped_value}|" "$env_path" && rm -f "$env_path.tmp"
                fi
            fi
        done < "$env_path.original"
        
        # Clean up the temporary original file
        rm -f "$env_path.original"
    fi
    
    # Substitute database configuration variables if they exist
    if [ -n "$DB_HOST" ]; then
        sed -i.tmp "s/^DB_HOST=.*/DB_HOST=$DB_HOST/" "$env_path" && rm -f "$env_path.tmp"
    fi
    if [ -n "$DB_USER" ]; then
        sed -i.tmp "s/^DB_USER=.*/DB_USER=$DB_USER/" "$env_path" && rm -f "$env_path.tmp"
    fi
    if [ -n "$DB_PASSWORD" ]; then
        sed -i.tmp "s/^DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" "$env_path" && rm -f "$env_path.tmp"
    fi
    if [ -n "$DB_NAME" ]; then
        sed -i.tmp "s/^DB_NAME=.*/DB_NAME=$DB_NAME/" "$env_path" && rm -f "$env_path.tmp"
    fi
    if [ -n "$DB_PORT" ]; then
        sed -i.tmp "s/^DB_PORT=.*/DB_PORT=$DB_PORT/" "$env_path" && rm -f "$env_path.tmp"
    fi
    
    # Substitute API keys if provided
    if [ -n "$GITHUB_TOKEN" ]; then
        sed -i.tmp "s/^GITHUB_TOKEN=.*/GITHUB_TOKEN=$GITHUB_TOKEN/" "$env_path" && rm -f "$env_path.tmp"
    fi
    if [ -n "$GEMINI_API_KEY" ]; then
        sed -i.tmp "s/^GEMINI_API_KEY=.*/GEMINI_API_KEY=$GEMINI_API_KEY/" "$env_path" && rm -f "$env_path.tmp"
    fi
    if [ -n "$OPENAI_API_KEY" ]; then
        sed -i.tmp "s/^OPENAI_API_KEY=.*/OPENAI_API_KEY=$OPENAI_API_KEY/" "$env_path" && rm -f "$env_path.tmp"
    fi
    if [ -n "$AI_GATEWAY_API_KEY" ]; then
        sed -i.tmp "s/^AI_GATEWAY_API_KEY=.*/AI_GATEWAY_API_KEY=$AI_GATEWAY_API_KEY/" "$env_path" && rm -f "$env_path.tmp"
    fi
    
    print_success "Created/updated $env_path"
}

# Function to create .env file with actual values for Next.js (no interpolation)
create_nextjs_env_file() {
    local env_path="$1"
    local env_example_path="$2"
    
    # First create with template
    create_env_file "$env_path" "$env_example_path" true
    
    # Then substitute DATABASE_URL with actual values for Next.js
    if [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ] && [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ] && [ -n "$DB_NAME" ]; then
        local actual_database_url="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
        sed -i.tmp "s|DATABASE_URL=postgresql://\\\${DB_USER}:\\\${DB_PASSWORD}@\\\${DB_HOST}:\\\${DB_PORT}/\\\${DB_NAME}|DATABASE_URL=${actual_database_url}|" "$env_path" && rm -f "$env_path.tmp"
        print_info "Substituted DATABASE_URL with actual values for Next.js compatibility"
    fi
}

echo "======================================"
echo "  Unified Bun Monorepo Setup v${SCRIPT_VERSION}  "
echo "======================================"
echo ""

if [ "$INTERACTIVE" = false ]; then
    print_info "Running in non-interactive mode"
else
    print_info "Running in interactive mode (use --non-interactive for automated setup)"
fi
echo ""

# Show resume status if resuming from previous run
show_resume_status

# Step 1: Check prerequisites
if ! is_step_completed "1"; then
    print_info "Step 1: Checking prerequisites..."
    
    # Check for Bun
    if ! command_exists bun; then
        print_error "Bun is not installed!"
        print_info "Please install Bun first: https://bun.sh"
        print_info "Run: curl -fsSL https://bun.sh/install | bash"
        exit 1
    fi
    print_success "Bun is installed ($(bun --version))"
    
    # Check for Node.js (optional but recommended)
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 22 ]; then
            print_warning "Node.js version is less than 22. Some tooling might not work optimally."
        else
            print_success "Node.js is installed ($(node --version))"
        fi
    else
        print_warning "Node.js is not installed. Some tooling might not work."
    fi
    
    # Check for Git
    if ! command_exists git; then
        print_error "Git is not installed!"
        exit 1
    fi
    print_success "Git is installed"
    
    # Check for PostgreSQL (psql command) if database setup is enabled
    if [ "$SETUP_DATABASE" = true ]; then
        if command_exists psql; then
            print_success "PostgreSQL client is installed"
            HAS_POSTGRES=true
        else
            print_warning "PostgreSQL client not found. Database setup will be limited."
            HAS_POSTGRES=false
        fi
    fi
    
    save_checkpoint "1"
else
    print_info "Step 1: Prerequisites check (already completed)"
    # Still need to check if we have postgres for later steps
    if [ "$SETUP_DATABASE" = true ] && command_exists psql; then
        HAS_POSTGRES=true
    else
        HAS_POSTGRES=false
    fi
fi

echo ""

# Step 2: Project configuration
if ! is_step_completed "2"; then
    print_info "Step 2: Configuring project..."
    
    # Get project name
    PROJECT_NAME=${PROJECT_NAME:-"my-app"}
    prompt_with_default "Enter your project name" "$PROJECT_NAME" PROJECT_NAME
    
    # Sanitize project name for database
    DB_NAME_DEFAULT=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | tr '-' '_' | tr ' ' '_')
    
    # Update package.json with project name
    if [ "$INTERACTIVE" = false ] || confirm "Would you like to rename the project from 'bun-monorepo-template' to '$PROJECT_NAME'?"; then
        print_info "Updating package.json..."
        if [ -f "package.json" ]; then
            sed -i.tmp "s/\"name\": \"bun-monorepo-template\"/\"name\": \"$PROJECT_NAME\"/" package.json && rm -f package.json.tmp
            print_success "Updated package.json"
        fi
    fi
    
    save_checkpoint "2"
else
    print_info "Step 2: Project configuration (already completed)"
    # Set default values for later use
    PROJECT_NAME=${PROJECT_NAME:-"my-app"}
    DB_NAME_DEFAULT=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | tr '-' '_' | tr ' ' '_')
fi

echo ""

# Step 3: Environment setup
if ! is_step_completed "3"; then
    print_info "Step 3: Setting up environment variables..."
    
    # Check if we should skip environment setup
    if [ -f ".env" ] && [ "$INTERACTIVE" = true ]; then
        if ! confirm ".env file already exists. Do you want to update it with new values?"; then
            print_info "Keeping existing .env file"
            SKIP_ENV=true
        fi
    fi
    
    if [ "$SKIP_ENV" != "true" ]; then
        # Create backups first
        backup_env_files
        
        # Preserve existing values by copying current .env files to temporary locations
        if [ -f ".env" ]; then
            cp ".env" ".env.original"
        fi
        if [ -f "packages/database/.env" ]; then
            cp "packages/database/.env" "packages/database/.env.original"
        fi
        if [ -f "apps/web/.env" ]; then
            cp "apps/web/.env" "apps/web/.env.original"
        fi
        
        # Get database configuration
        print_info "Database configuration:"
        
        # Set defaults from existing files or environment
        DB_HOST=$(read_existing_env_value ".env" "DB_HOST" "${DB_HOST:-localhost}")
        DB_PORT=$(read_existing_env_value ".env" "DB_PORT" "${DB_PORT:-5432}")
        DB_NAME=$(read_existing_env_value ".env" "DB_NAME" "${DB_NAME:-$DB_NAME_DEFAULT}")
        DB_USER=$(read_existing_env_value ".env" "DB_USER" "${DB_USER:-postgres}")
        
        prompt_with_default "Database host" "$DB_HOST" DB_HOST
        prompt_with_default "Database port" "$DB_PORT" DB_PORT
        prompt_with_default "Database name" "$DB_NAME" DB_NAME
        prompt_with_default "Database user" "$DB_USER" DB_USER
        
        # Password prompt
        if [ "$INTERACTIVE" = true ]; then
            DB_PASS_DEFAULT=$(read_existing_env_value ".env" "DB_PASSWORD" "postgres")
            echo -n "Database password [$DB_PASS_DEFAULT]: "
            read -s DB_PASSWORD_INPUT
            echo ""
            DB_PASSWORD=${DB_PASSWORD_INPUT:-$DB_PASS_DEFAULT}
        else
            DB_PASSWORD=${DB_PASSWORD:-$(read_existing_env_value ".env" "DB_PASSWORD" "postgres")}
            print_info "Database password: [using provided/existing value]"
        fi
        
        # API keys (optional)
        if [ "$INTERACTIVE" = false ] || confirm "Do you want to configure optional API keys now?"; then
            GITHUB_TOKEN=${GITHUB_TOKEN:-$(read_existing_env_value ".env" "GITHUB_TOKEN" "")}
            GEMINI_API_KEY=${GEMINI_API_KEY:-$(read_existing_env_value ".env" "GEMINI_API_KEY" "")}
            OPENAI_API_KEY=${OPENAI_API_KEY:-$(read_existing_env_value ".env" "OPENAI_API_KEY" "")}
            AI_GATEWAY_API_KEY=${AI_GATEWAY_API_KEY:-$(read_existing_env_value ".env" "AI_GATEWAY_API_KEY" "")}
            
            if [ "$INTERACTIVE" = true ]; then
                prompt_with_default "GitHub Token (press Enter to skip)" "$GITHUB_TOKEN" GITHUB_TOKEN
                prompt_with_default "Gemini API Key (press Enter to skip)" "$GEMINI_API_KEY" GEMINI_API_KEY
                prompt_with_default "OpenAI API Key (press Enter to skip)" "$OPENAI_API_KEY" OPENAI_API_KEY
                prompt_with_default "AI Gateway API Key (press Enter to skip)" "$AI_GATEWAY_API_KEY" AI_GATEWAY_API_KEY
            fi
        fi
        
        # Create/update environment files
        print_info "Creating/updating environment files..."
        
        # Root .env file (with variable interpolation)
        create_env_file ".env" ".env.example" true
        
        # Database package .env file (with variable interpolation)
        mkdir -p packages/database
        create_env_file "packages/database/.env" "packages/database/.env.example" true
        
        # Next.js app .env file (with actual values for compatibility)
        mkdir -p apps/web
        create_nextjs_env_file "apps/web/.env" "apps/web/.env.example"
        
        print_success "Environment files created/updated with value preservation"
    fi
    
    save_checkpoint "3"
else
    print_info "Step 3: Environment setup (already completed)"
    
    # Load existing values for later steps
    if [ -f ".env" ]; then
        DB_HOST=$(read_existing_env_value ".env" "DB_HOST" "localhost")
        DB_PORT=$(read_existing_env_value ".env" "DB_PORT" "5432")
        DB_NAME=$(read_existing_env_value ".env" "DB_NAME" "$DB_NAME_DEFAULT")
        DB_USER=$(read_existing_env_value ".env" "DB_USER" "postgres")
        DB_PASSWORD=$(read_existing_env_value ".env" "DB_PASSWORD" "postgres")
    fi
fi

echo ""

# Step 4: Install dependencies
if ! is_step_completed "4"; then
    print_info "Step 4: Installing dependencies..."
    bun install
    print_success "Dependencies installed"
    save_checkpoint "4"
else
    print_info "Step 4: Dependencies installation (already completed)"
fi

echo ""

# Step 5: Database setup
if [ "$SETUP_DATABASE" = true ] && [ "$HAS_POSTGRES" = true ] && [ "$SKIP_ENV" != "true" ]; then
    if ! is_step_completed "5"; then
        if [ "$INTERACTIVE" = false ] || confirm "Would you like to set up the database now?"; then
            print_info "Step 5: Setting up database..."
            
            # Set environment for database operations
            export PGPASSWORD="$DB_PASSWORD"
            DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
            
            # Test database connection
            print_info "Testing database connection..."
            if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
                print_success "Database connection successful"
            else
                print_error "Failed to connect to PostgreSQL"
                print_info "Please check your credentials and ensure PostgreSQL is running"
                exit 1
            fi
            
            # Create database if needed
            if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1; then
                print_success "Database '$DB_NAME' already exists"
            else
                if [ "$INTERACTIVE" = false ] || confirm "Database '$DB_NAME' doesn't exist. Create it now?"; then
                    if createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null; then
                        print_success "Database created"
                    else
                        print_warning "Could not create database automatically. You may need to create it manually."
                    fi
                fi
            fi
            
            # Grant privileges
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE \"$DB_NAME\" TO \"$DB_USER\";" 2>/dev/null || true
            
            # Install pgvector extension if available
            if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>&1 | grep -q "ERROR"; then
                print_warning "pgvector extension not available. Embeddings will use JSON storage."
            else
                print_success "pgvector extension installed"
            fi
            
            # Run Prisma setup
            print_info "Setting up Prisma..."
            cd packages/database 2>/dev/null || true
            
            # Generate Prisma client
            if bun run db:generate; then
                print_success "Prisma client generated"
            else
                print_warning "Prisma client generation may need manual attention"
            fi
            
            # Push schema or run migrations
            if [ "$INTERACTIVE" = false ] || confirm "Push schema to database?"; then
                if DATABASE_URL="$DATABASE_URL" bun run db:push; then
                    print_success "Database schema pushed"
                else
                    print_warning "Schema push failed. You may need to run migrations manually."
                fi
            fi
            
            # Seed database
            if [ "$INTERACTIVE" = false ] || confirm "Seed the database with sample data?"; then
                if bun run db:seed; then
                    print_success "Database seeded"
                else
                    print_warning "Database seeding failed. You may need to seed manually."
                fi
            fi
            
            cd - > /dev/null 2>&1 || true
            
            # Clean up sensitive environment variables
            unset PGPASSWORD
            
            save_checkpoint "5"
        else
            print_info "Skipping database setup"
            save_checkpoint "5"
        fi
    else
        print_info "Step 5: Database setup (already completed)"
    fi
else
    print_info "Step 5: Database setup (skipped - no PostgreSQL or database setup disabled)"
    save_checkpoint "5"
fi

echo ""

# Step 6: Git setup
if ! is_step_completed "6"; then
    if [ ! -d ".git" ]; then
        if [ "$INTERACTIVE" = false ] || confirm "Initialize git repository?"; then
            print_info "Step 6: Setting up Git repository..."
            git init
            print_success "Git repository initialized"
            
            if [ "$INTERACTIVE" = false ] || confirm "Create initial commit?"; then
                git add .
                git commit -m "Initial commit from Bun Monorepo Template"
                print_success "Initial commit created"
            fi
        fi
    else
        print_info "Step 6: Git repository already initialized"
    fi
    save_checkpoint "6"
else
    print_info "Step 6: Git setup (already completed)"
fi

echo ""

# Step 7: Final checks
if ! is_step_completed "7"; then
    print_info "Step 7: Running final checks..."
    
    # Type checking
    print_info "Running type check..."
    if bun typecheck 2>/dev/null; then
        print_success "Type checking passed"
    else
        print_warning "Type checking has some issues. Run 'bun typecheck' to see details."
    fi
    
    save_checkpoint "7"
else
    print_info "Step 7: Final checks (already completed)"
fi

# Clean up checkpoint file since setup completed successfully
cleanup_checkpoint

echo ""

# Success message
echo "======================================"
print_success "    Setup Complete! 🎉"
echo "======================================"
echo ""
echo "Your Bun monorepo is ready to go!"
echo ""
echo "Next steps:"
echo "  1. Start the development server: ${GREEN}bun dev${NC}"
echo "  2. Open your browser to: ${BLUE}http://localhost:3000${NC}"
if [ "$SETUP_DATABASE" = true ]; then
    echo "  3. (Optional) Open Prisma Studio: ${GREEN}bun db:studio${NC}"
fi
echo ""
echo "Useful commands:"
echo "  - ${GREEN}bun dev${NC}        - Start development server"
echo "  - ${GREEN}bun build${NC}      - Build for production"
echo "  - ${GREEN}bun test${NC}       - Run tests"
echo "  - ${GREEN}bun typecheck${NC}  - Check TypeScript types"
echo "  - ${GREEN}bun lint${NC}       - Run linter"
if [ "$SETUP_DATABASE" = true ]; then
    echo "  - ${GREEN}bun db:studio${NC} - Open Prisma Studio"
    echo "  - ${GREEN}bun db:push${NC}   - Push schema changes"
    echo "  - ${GREEN}bun db:seed${NC}   - Seed database"
fi
echo ""
print_info "Environment file backups have been created with timestamp suffixes."
echo ""
echo "Happy coding! 🚀"