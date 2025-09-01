#!/bin/bash

# Exit on any command failure
set -e

# Checkpoint file to track progress
CHECKPOINT_FILE=".setup_checkpoint"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to save checkpoint
save_checkpoint() {
    local step="$1"
    echo "$step" >> "$CHECKPOINT_FILE"
    echo -e "${BLUE}Checkpoint: Step $step completed${NC}"
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

# Function to show resume status
show_resume_status() {
    if [ -f "$CHECKPOINT_FILE" ]; then
        echo -e "${YELLOW}Previous setup detected. Completed steps:${NC}"
        while read -r step; do
            echo -e "${GREEN}  ✓ Step $step${NC}"
        done < "$CHECKPOINT_FILE"
        echo ""
        echo -e "${BLUE}Resuming from where we left off...${NC}"
        echo ""
    fi
}

# Function to clean up checkpoint on successful completion
cleanup_checkpoint() {
    if [ -f "$CHECKPOINT_FILE" ]; then
        rm "$CHECKPOINT_FILE"
    fi
}

echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}     PostgreSQL Database Setup Script            ${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# Show resume status if resuming from previous run
show_resume_status

# Check if psql is installed
if ! command_exists psql; then
    echo -e "${RED}Error: PostgreSQL (psql) is not installed or not in PATH${NC}"
    echo "Please install PostgreSQL first:"
    echo "  - macOS: brew install postgresql"
    echo "  - Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "  - RHEL/CentOS: sudo yum install postgresql postgresql-contrib"
    exit 1
fi

# Check if bun is installed
if ! command_exists bun; then
    echo -e "${RED}Error: Bun is not installed${NC}"
    echo "Please install Bun first: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Prompt for database connection details
echo -e "${YELLOW}Please enter your PostgreSQL connection details:${NC}"
echo ""

read -p "PostgreSQL Host [localhost]: " PG_HOST
PG_HOST=${PG_HOST:-localhost}

read -p "PostgreSQL Port [5432]: " PG_PORT
PG_PORT=${PG_PORT:-5432}

read -p "PostgreSQL Username: " PG_USER
while [ -z "$PG_USER" ]; do
    echo -e "${RED}Username cannot be empty${NC}"
    read -p "PostgreSQL Username: " PG_USER
done

# Read password securely
echo -n "PostgreSQL Password: "
read -s PG_PASSWORD
echo ""
while [ -z "$PG_PASSWORD" ]; do
    echo -e "${RED}Password cannot be empty${NC}"
    echo -n "PostgreSQL Password: "
    read -s PG_PASSWORD
    echo ""
done

read -p "Database Name [plague-doctor]: " DB_NAME
DB_NAME=${DB_NAME:-plague-doctor}

# Confirm details
echo ""
echo -e "${BLUE}Connection Details:${NC}"
echo "  Host: $PG_HOST"
echo "  Port: $PG_PORT"
echo "  Username: $PG_USER"
echo "  Database: $DB_NAME"
echo ""
read -p "Is this correct? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo -e "${YELLOW}Setup cancelled${NC}"
    exit 0
fi

# Create connection string
DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${DB_NAME}"

# Export for psql and bun commands
export PGPASSWORD="$PG_PASSWORD"
export DATABASE_URL="$DATABASE_URL"

echo ""
if ! is_step_completed "1"; then
    echo -e "${BLUE}Step 1: Checking PostgreSQL connection...${NC}"
    if psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL connection successful${NC}"
        save_checkpoint "1"
    else
        echo -e "${RED}✗ Failed to connect to PostgreSQL${NC}"
        echo "Please check your credentials and ensure PostgreSQL is running"
        exit 1
    fi
else
    echo -e "${YELLOW}Step 1: PostgreSQL connection check (already completed)${NC}"
fi

echo ""
if ! is_step_completed "2"; then
    echo -e "${BLUE}Step 2: Creating database if it doesn't exist...${NC}"
    
    # Temporarily disable exit on error for user interaction
    set +e
    if psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1; then
        echo -e "${YELLOW}⚠ Database '$DB_NAME' already exists${NC}"
        read -p "Do you want to DROP and recreate it? This will DELETE ALL DATA! (y/n): " DROP_DB
        if [ "$DROP_DB" = "y" ] || [ "$DROP_DB" = "Y" ]; then
            echo "Dropping database..."
            psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d postgres -c "DROP DATABASE \"$DB_NAME\";"
            if [ $? -ne 0 ]; then
                echo -e "${RED}✗ Failed to drop database${NC}"
                exit 1
            fi
            psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\" OWNER \"$PG_USER\";"
            if [ $? -ne 0 ]; then
                echo -e "${RED}✗ Failed to create database${NC}"
                exit 1
            fi
            echo -e "${GREEN}✓ Database recreated${NC}"
        else
            echo -e "${BLUE}Using existing database${NC}"
        fi
    else
        psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\" OWNER \"$PG_USER\";"
        if [ $? -ne 0 ]; then
            echo -e "${RED}✗ Failed to create database${NC}"
            exit 1
        fi
        echo -e "${GREEN}✓ Database created${NC}"
    fi
    # Re-enable exit on error
    set -e
    save_checkpoint "2"
else
    echo -e "${YELLOW}Step 2: Database creation (already completed)${NC}"
fi

echo ""
if ! is_step_completed "3"; then
    echo -e "${BLUE}Step 3: Granting full privileges to user...${NC}"
    psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE \"$DB_NAME\" TO \"$PG_USER\";"
    echo -e "${GREEN}✓ Privileges granted${NC}"
    save_checkpoint "3"
else
    echo -e "${YELLOW}Step 3: Granting privileges (already completed)${NC}"
fi

echo ""
if ! is_step_completed "4"; then
    echo -e "${BLUE}Step 4: Installing pgvector extension...${NC}"
    
    # Temporarily disable exit on error for conditional checks
    set +e
    # First check if pgvector is available
    if psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>&1 | grep -q "ERROR"; then
        echo -e "${YELLOW}⚠ pgvector extension not available${NC}"
        echo ""
        echo "Please install pgvector first:"
        echo "  - macOS: brew install pgvector"
        echo "  - Ubuntu/Debian: sudo apt install postgresql-16-pgvector"
        echo "  - From source: https://github.com/pgvector/pgvector#installation"
        echo ""
        read -p "Continue without vector extension? (y/n): " CONTINUE_NO_VECTOR
        if [ "$CONTINUE_NO_VECTOR" != "y" ] && [ "$CONTINUE_NO_VECTOR" != "Y" ]; then
            exit 1
        fi
    else
        echo -e "${GREEN}✓ Vector extension installed${NC}"
    fi
    # Re-enable exit on error
    set -e
    save_checkpoint "4"
else
    echo -e "${YELLOW}Step 4: pgvector extension (already completed)${NC}"
fi

echo ""
if ! is_step_completed "5"; then
    echo -e "${BLUE}Step 5: Setting up environment configuration...${NC}"
    
    # Construct the actual DATABASE_URL
    DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${DB_NAME}"
    
    # Check if .env exists and DATABASE_URL is working
    if [ -f .env ] && grep -q "DATABASE_URL=" .env; then
        echo -e "${YELLOW}⚠ .env file already exists with DATABASE_URL${NC}"
    else
        # Backup existing .env file if it exists
        if [ -f .env ]; then
            cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
            echo -e "${YELLOW}⚠ Backed up existing .env file${NC}"
        fi
        
        # Copy .env.example to .env as the base
        if [ -f .env.example ]; then
            cp .env.example .env
            echo -e "${GREEN}✓ Copied .env.example to .env${NC}"
        else
            # Create minimal .env file if .env.example doesn't exist
            touch .env
            echo -e "${YELLOW}⚠ .env.example not found, created empty .env file${NC}"
        fi
        
        # Remove existing database lines from .env
        sed -i.tmp '/^DB_HOST=/d; /^DB_USER=/d; /^DB_PASSWORD=/d; /^DB_NAME=/d; /^DB_PORT=/d; /^DATABASE_URL=/d' .env && rm -f .env.tmp
        
        # Generate new BETTER_AUTH_SECRET if it's still the placeholder
        if grep -q 'BETTER_AUTH_SECRET="your-secret-here"' .env 2>/dev/null; then
            BETTER_AUTH_SECRET=$(openssl rand -base64 32)
            sed -i.tmp "s|BETTER_AUTH_SECRET=\"your-secret-here\"|BETTER_AUTH_SECRET=\"${BETTER_AUTH_SECRET}\"|" .env && rm -f .env.tmp
            echo -e "${GREEN}✓ Generated new BETTER_AUTH_SECRET${NC}"
        fi
        
        # Add new database configuration to .env with interpolation
        cat >> .env << EOF

# Database Configuration
DB_HOST=${PG_HOST}
DB_USER=${PG_USER}
DB_PASSWORD=${PG_PASSWORD}
DB_NAME=${DB_NAME}
DB_PORT=${PG_PORT}
# Use variable interpolation for maintainability
DATABASE_URL=postgresql://\${DB_USER}:\${DB_PASSWORD}@\${DB_HOST}:\${DB_PORT}/\${DB_NAME}
EOF
        echo -e "${GREEN}✓ Database configuration added to .env file${NC}"
    fi
    
    # Create/update .env files in all necessary locations
    # 1. packages/database/.env (Prisma needs expanded DATABASE_URL)
    mkdir -p packages/database
    cat > packages/database/.env << EOF
# Database configuration for Prisma
# This must be the expanded URL (no variable interpolation)
DATABASE_URL=${DATABASE_URL}
EOF
    echo -e "${GREEN}✓ Created/updated .env file in packages/database directory${NC}"
    
    # 2. apps/web/.env (Next.js needs server-side variables)
    if [ -f apps/web/.env ]; then
        # Update existing file - preserve other variables
        sed -i.tmp '/^DATABASE_URL=/d; /^DB_HOST=/d; /^DB_USER=/d; /^DB_PASSWORD=/d; /^DB_NAME=/d; /^DB_PORT=/d' apps/web/.env && rm -f apps/web/.env.tmp
        
        # Append database configuration
        cat >> apps/web/.env << EOF

# Database Configuration (SERVER-SIDE ONLY)
DB_HOST=${PG_HOST}
DB_USER=${PG_USER}
DB_PASSWORD=${PG_PASSWORD}
DB_NAME=${DB_NAME}
DB_PORT=${PG_PORT}
DATABASE_URL=${DATABASE_URL}
EOF
        echo -e "${GREEN}✓ Updated apps/web/.env with database configuration${NC}"
    else
        # Create from example if it doesn't exist
        if [ -f apps/web/.env.example ]; then
            cp apps/web/.env.example apps/web/.env
            # Add database configuration
            cat >> apps/web/.env << EOF

# Database Configuration (SERVER-SIDE ONLY)
DB_HOST=${PG_HOST}
DB_USER=${PG_USER}
DB_PASSWORD=${PG_PASSWORD}
DB_NAME=${DB_NAME}
DB_PORT=${PG_PORT}
DATABASE_URL=${DATABASE_URL}
EOF
            echo -e "${GREEN}✓ Created apps/web/.env from example and added database configuration${NC}"
        fi
    fi
    
    save_checkpoint "5"
else
    echo -e "${YELLOW}Step 5: Environment configuration (already completed)${NC}"
    # Ensure DATABASE_URL is constructed for later steps
    DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${DB_NAME}"
    
    # Always ensure all .env files have correct DATABASE_URL
    # 1. packages/database/.env
    mkdir -p packages/database
    cat > packages/database/.env << EOF
# Database configuration for Prisma
# This must be the expanded URL (no variable interpolation)
DATABASE_URL=${DATABASE_URL}
EOF
    echo -e "${GREEN}✓ Updated packages/database/.env${NC}"
    
    # 2. apps/web/.env - ensure it has DATABASE_URL
    if [ -f apps/web/.env ]; then
        if ! grep -q "^DATABASE_URL=" apps/web/.env; then
            cat >> apps/web/.env << EOF

# Database Configuration (SERVER-SIDE ONLY)
DATABASE_URL=${DATABASE_URL}
EOF
            echo -e "${GREEN}✓ Added DATABASE_URL to apps/web/.env${NC}"
        fi
    fi
fi

echo ""
if ! is_step_completed "6"; then
    echo -e "${BLUE}Step 6: Installing dependencies...${NC}"
    bun install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Dependencies installed${NC}"
        save_checkpoint "6"
    else
        echo -e "${RED}✗ Failed to install dependencies${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Step 6: Installing dependencies (already completed)${NC}"
fi

echo ""
if ! is_step_completed "7"; then
    echo -e "${BLUE}Step 7: Running database migrations...${NC}"
    
    # Construct DATABASE_URL using the variables collected earlier
    DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${DB_NAME}"
    
    # Source .env file to make other variables available
    set -a  # automatically export all variables
    source .env
    set +a  # stop automatically exporting
    
    # Temporarily disable exit on error for fallback logic
    set +e
    DATABASE_URL="$DATABASE_URL" bun run db:migrate:dev
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Migrations completed${NC}"
        set -e
        save_checkpoint "7"
    else
        echo -e "${RED}✗ Migration failed${NC}"
        echo "Trying to push schema directly..."
        DATABASE_URL="$DATABASE_URL" bun run db:push
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Schema pushed successfully${NC}"
            set -e
            save_checkpoint "7"
        else
            echo -e "${RED}✗ Schema push failed${NC}"
            echo "Attempting direct Prisma commands in packages/database directory..."
            
            # Try running Prisma directly in the packages/database directory
            cd packages/database
            echo "Running Prisma migrate dev from packages/database directory..."
            npx prisma migrate dev --name init
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ Direct Prisma migration completed${NC}"
                cd ../..
                set -e
                save_checkpoint "7"
            else
                echo "Trying Prisma db push from packages/database directory..."
                npx prisma db push
                if [ $? -eq 0 ]; then
                    echo -e "${GREEN}✓ Direct Prisma push completed${NC}"
                    cd ../..
                    set -e
                    save_checkpoint "7"
                else
                    cd ../..
                    echo -e "${RED}✗ All migration attempts failed${NC}"
                    exit 1
                fi
            fi
        fi
    fi
else
    echo -e "${YELLOW}Step 7: Database migrations (already completed)${NC}"
fi

echo ""
if ! is_step_completed "8"; then
    echo -e "${BLUE}Step 8: Generating Prisma files...${NC}"
    
    # Source .env file to make all variables available
    set -a  # automatically export all variables
    source .env
    set +a  # stop automatically exporting
    
    # Temporarily disable exit on error since this step may just warn about no changes
    set +e
    bun run generate
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Prisma files generated${NC}"
    else
        echo -e "${YELLOW}⚠ No schema changes detected${NC}"
    fi
    # Re-enable exit on error
    set -e
    save_checkpoint "8"
else
    echo -e "${YELLOW}Step 8: Generating Prisma files (already completed)${NC}"
fi

# Clear sensitive environment variables
unset PGPASSWORD
unset DATABASE_URL
unset DB_HOST
unset DB_USER
unset DB_PASSWORD
unset DB_NAME
unset DB_PORT

# Clean up checkpoint file since setup completed successfully
cleanup_checkpoint

echo ""
echo -e "${GREEN}=================================================${NC}"
echo -e "${GREEN}     Database Setup Complete! 🎉                 ${NC}"
echo -e "${GREEN}=================================================${NC}"
echo ""
echo "Your database is ready with:"
echo "  ✓ Database: $DB_NAME"
echo "  ✓ User: $PG_USER with full privileges"
echo "  ✓ Vector extension: $(if psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$DB_NAME" -tc "SELECT 1 FROM pg_extension WHERE extname = 'vector'" 2>/dev/null | grep -q 1; then echo "Installed"; else echo "Not installed"; fi)"
echo "  ✓ Migrations: Applied"
echo ""
echo "You can now run:"
echo "  bun run dev        - Start the development server"
echo "  bun run db:studio  - Open Prisma Studio"
echo ""
echo -e "${YELLOW}Note: Your .env file has been created/updated with the database connection.${NC}"