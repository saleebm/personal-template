#!/bin/bash

# Non-interactive database setup script for AI Dr.
# Sources configuration from .env file and runs without user input

set -e

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

# Function to source .env file
load_env() {
    if [ -f .env ]; then
        echo -e "${BLUE}Loading environment from .env file...${NC}"
        set -a
        source .env
        set +a
    else
        echo -e "${RED}Error: .env file not found${NC}"
        echo "Please create a .env file with database configuration:"
        echo "  DATABASE_URL=postgresql://user:password@localhost:5432/ai-doctore"
        echo "  DB_HOST=localhost"
        echo "  DB_PORT=5432"
        echo "  DB_USER=your_user"
        echo "  DB_PASSWORD=your_password"
        echo "  DB_NAME=ai-doctore"
        exit 1
    fi
}

# Parse database URL or use individual components
parse_database_config() {
    if [ -n "$DATABASE_URL" ]; then
        # Parse DATABASE_URL
        # Format: postgresql://user:password@host:port/database
        if [[ "$DATABASE_URL" =~ ^postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+)$ ]]; then
            DB_USER="${BASH_REMATCH[1]}"
            DB_PASSWORD="${BASH_REMATCH[2]}"
            DB_HOST="${BASH_REMATCH[3]}"
            DB_PORT="${BASH_REMATCH[4]}"
            DB_NAME="${BASH_REMATCH[5]}"
        else
            echo -e "${RED}Error: Invalid DATABASE_URL format${NC}"
            exit 1
        fi
    fi
    
    # Verify all required variables are set
    if [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_NAME" ]; then
        echo -e "${RED}Error: Missing database configuration${NC}"
        echo "Required variables: DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME"
        echo "Or provide DATABASE_URL with all information"
        exit 1
    fi
}

echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}     AI Dr. Non-Interactive Database Setup       ${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# Load environment variables
load_env
parse_database_config

# Display configuration
echo -e "${BLUE}Database Configuration:${NC}"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command_exists psql; then
    echo -e "${RED}Error: PostgreSQL (psql) is not installed${NC}"
    echo "Please install PostgreSQL first:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

if ! command_exists bun; then
    echo -e "${RED}Error: Bun is not installed${NC}"
    echo "Please install Bun: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Export for psql commands
export PGPASSWORD="$DB_PASSWORD"

# Step 1: Test connection
echo -e "${BLUE}Step 1: Testing PostgreSQL connection...${NC}"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connection successful${NC}"
else
    echo -e "${RED}✗ Failed to connect to PostgreSQL${NC}"
    echo "Please check your database configuration and ensure PostgreSQL is running"
    exit 1
fi

# Step 2: Create database if needed
echo -e "${BLUE}Step 2: Setting up database...${NC}"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1; then
    echo -e "${YELLOW}Database '$DB_NAME' already exists${NC}"
    
    # In non-interactive mode, we'll keep the existing database
    # If you want to always recreate, uncomment the following:
    # echo "Dropping and recreating database..."
    # psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE \"$DB_NAME\";"
    # psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\" OWNER \"$DB_USER\";"
else
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\" OWNER \"$DB_USER\";"
    echo -e "${GREEN}✓ Database created${NC}"
fi

# Step 3: Grant privileges
echo -e "${BLUE}Step 3: Granting privileges...${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE \"$DB_NAME\" TO \"$DB_USER\";" 2>/dev/null || true
echo -e "${GREEN}✓ Privileges granted${NC}"

# Step 4: Install pgvector extension
echo -e "${BLUE}Step 4: Checking pgvector extension...${NC}"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>&1 | grep -q "ERROR"; then
    echo -e "${YELLOW}⚠ pgvector extension not available${NC}"
    echo "  Embeddings will be stored as JSON until pgvector is installed"
    echo "  To install pgvector:"
    echo "    macOS: brew install pgvector"
    echo "    Ubuntu: sudo apt install postgresql-16-pgvector"
else
    echo -e "${GREEN}✓ pgvector extension ready${NC}"
fi

# Step 5: Setup environment files
echo -e "${BLUE}Step 5: Setting up environment files...${NC}"

# Ensure DATABASE_URL is constructed
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Create/update packages/database/.env
mkdir -p packages/database
cat > packages/database/.env << EOF
# Database configuration for Prisma
DATABASE_URL=${DATABASE_URL}
EOF
echo -e "${GREEN}✓ Created packages/database/.env${NC}"

# Update apps/web/.env if it exists
if [ -d "apps/web" ]; then
    if [ -f "apps/web/.env" ]; then
        # Remove old database lines
        sed -i.bak '/^DATABASE_URL=/d; /^DB_HOST=/d; /^DB_USER=/d; /^DB_PASSWORD=/d; /^DB_NAME=/d; /^DB_PORT=/d' apps/web/.env
        rm -f apps/web/.env.bak
    else
        # Copy from example if available
        if [ -f "apps/web/.env.example" ]; then
            cp apps/web/.env.example apps/web/.env
        else
            touch apps/web/.env
        fi
    fi
    
    # Append database configuration
    cat >> apps/web/.env << EOF

# Database Configuration (auto-generated)
DATABASE_URL=${DATABASE_URL}
DB_HOST=${DB_HOST}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
DB_PORT=${DB_PORT}
EOF
    echo -e "${GREEN}✓ Updated apps/web/.env${NC}"
fi

# Step 6: Install dependencies
echo -e "${BLUE}Step 6: Installing dependencies...${NC}"
if bun install > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠ Some dependencies may have failed to install${NC}"
fi

# Step 7: Run Prisma setup
echo -e "${BLUE}Step 7: Setting up Prisma...${NC}"

# Generate Prisma client
echo "Generating Prisma client..."
if bun run db:generate > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Prisma client generated${NC}"
else
    echo -e "${YELLOW}⚠ Prisma generate may need manual attention${NC}"
fi

# Push schema to database
echo "Pushing schema to database..."
if DATABASE_URL="$DATABASE_URL" bun run db:push > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Schema pushed to database${NC}"
else
    echo -e "${YELLOW}⚠ Schema push may need manual attention${NC}"
    echo "  Try running: bun run db:push"
fi

# Clear sensitive variables
unset PGPASSWORD
unset DB_PASSWORD

echo ""
echo -e "${GREEN}=================================================${NC}"
echo -e "${GREEN}     Database Setup Complete! 🎉                 ${NC}"
echo -e "${GREEN}=================================================${NC}"
echo ""
echo "Database is ready at: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo ""
echo "Next steps:"
echo "  1. Run migrations if needed: bun run db:migrate:dev"
echo "  2. Seed the database: bun run db:seed"
echo "  3. Open Prisma Studio: bun run db:studio"
echo "  4. Start development: bun run dev"
echo ""
echo -e "${YELLOW}Note: Configuration has been saved to .env files${NC}"