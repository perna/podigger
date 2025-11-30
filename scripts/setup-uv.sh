#!/bin/bash
# Setup script for UV package manager and Python environment
# This script installs UV if not present and sets up the virtual environment

set -e  # Exit on error

echo "🚀 Podigger Development Environment Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if UV is installed
if ! command -v uv &> /dev/null; then
    echo -e "${YELLOW}UV not found. Installing UV...${NC}"
    curl -LsSf https://astral.sh/uv/install.sh | sh
    
    # Add UV to PATH for current session
    export PATH="$HOME/.cargo/bin:$PATH"
    
    echo -e "${GREEN}✓ UV installed successfully!${NC}"
else
    echo -e "${GREEN}✓ UV is already installed${NC}"
fi

# Display UV version
echo -e "${BLUE}UV version: $(uv --version)${NC}"
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."

# Check if .python-version exists
if [ ! -f ".python-version" ]; then
    echo -e "${YELLOW}Creating .python-version file...${NC}"
    echo "3.12.7" > .python-version
fi

PYTHON_VERSION=$(cat .python-version)
echo -e "${BLUE}Target Python version: ${PYTHON_VERSION}${NC}"
echo ""

# Create virtual environment with UV
echo -e "${YELLOW}Creating virtual environment with Python ${PYTHON_VERSION}...${NC}"
uv venv --python "${PYTHON_VERSION}"

echo -e "${GREEN}✓ Virtual environment created at .venv${NC}"
echo ""

# Activate virtual environment
source .venv/bin/activate

# Install dependencies
echo -e "${YELLOW}Installing dependencies from backend/requirements.txt...${NC}"
cd backend
uv pip install -r requirements.txt

echo ""
echo -e "${GREEN}✓ Dependencies installed successfully!${NC}"
echo ""

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created. Please review and update as needed.${NC}"
else
    echo -e "${BLUE}ℹ .env file already exists${NC}"
fi

cd ..

echo ""
echo -e "${GREEN}=========================================="
echo "✅ Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Activate the virtual environment:"
echo -e "     ${BLUE}source .venv/bin/activate${NC}"
echo ""
echo "  2. Start local services (Postgres + Redis):"
echo -e "     ${BLUE}make services${NC}"
echo ""
echo "  3. Run migrations:"
echo -e "     ${BLUE}make migrate${NC}"
echo ""
echo "  4. Start Django development server:"
echo -e "     ${BLUE}cd backend && python manage.py runserver${NC}"
echo ""
echo "Or simply run:"
echo -e "  ${BLUE}make dev${NC}"
echo ""
echo "For all available commands, run:"
echo -e "  ${BLUE}make help${NC}"
echo ""
