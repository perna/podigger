#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NODE_VERSION="24"
NVM_DIR="${HOME}/.nvm"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"

# echo_info prints a message to stdout prefixed with a green "[INFO]" tag.
echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# echo_warn prints a warning message prefixed with a yellow [WARN] tag.
echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# echo_error prints an error message prefixed with "[ERROR]" in red.
echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# check_os verifies the script is running on Linux or macOS; exits with status 1 on unsupported systems.
check_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
        echo_info "Detected OS: $OSTYPE"
    else
        echo_error "Unsupported OS: $OSTYPE"
        exit 1
    fi
}

# install_nvm installs NVM into $NVM_DIR if not already present, loads `nvm.sh` and `bash_completion` into the current shell, and prints status messages.
install_nvm() {
    if [ -d "$NVM_DIR" ]; then
        echo_warn "NVM already installed at $NVM_DIR"
        return 0
    fi

    echo_info "Installing NVM..."
    
    # Download and install NVM
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
    
    # Load NVM
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    echo_info "NVM installed successfully"
}

# load_nvm loads NVM into the current shell by sourcing nvm.sh and bash_completion if present. Exits with status 1 if `nvm` is not available after sourcing.
load_nvm() {
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    if ! command -v nvm &> /dev/null; then
        echo_error "Failed to load NVM"
        exit 1
    fi
}

# install_node installs the configured Node.js LTS version using nvm and sets it as the default.
# install_node installs the Node.js LTS version specified by NODE_VERSION, sets it as the default, and prints the installed Node.js and npm versions.
install_node() {
    echo_info "Installing Node.js ${NODE_VERSION} LTS..."
    
    nvm install ${NODE_VERSION} --lts
    nvm use ${NODE_VERSION}
    nvm alias default ${NODE_VERSION}
    
    echo_info "Node.js $(node --version) installed successfully"
    echo_info "npm $(npm --version) installed successfully"
}

# install_pnpm installs pnpm globally using npm unless pnpm is already installed, in which case it prints a warning and returns successfully.
install_pnpm() {
    echo_info "Installing pnpm..."
    
    if command -v pnpm &> /dev/null; then
        echo_warn "pnpm already installed: $(pnpm --version)"
        return 0
    fi
    
    npm install -g pnpm
    
    echo_info "pnpm $(pnpm --version) installed successfully"
}

# create_nvmrc creates a .nvmrc file in FRONTEND_DIR containing NODE_VERSION if one does not already exist and prints status messages.
create_nvmrc() {
    local nvmrc_file="${FRONTEND_DIR}/.nvmrc"
    
    if [ -f "$nvmrc_file" ]; then
        echo_warn ".nvmrc already exists"
        return 0
    fi
    
    echo_info "Creating .nvmrc file..."
    echo "${NODE_VERSION}" > "$nvmrc_file"
    echo_info ".nvmrc created with Node.js version ${NODE_VERSION}"
}

# setup_auto_nvm sets up automatic NVM version switching by appending an `autoload-nvmrc` function and appropriate hooks to the user's shell config (bash or zsh) so the Node version changes when entering directories with a .nvmrc.
# setup_auto_nvm appends an autoload-nvmrc hook to the user's shell config to automatically switch Node versions based on a project `.nvmrc` when changing directories.
# If no suitable shell config is found or the configuration already exists, it makes no changes and exits successfully.
setup_auto_nvm() {
    echo_info "Setting up automatic NVM version switching..."
    
    local shell_config=""
    
    # Detect shell and config file
    if [ -n "${BASH_VERSION:-}" ]; then
        if [ -f "$HOME/.bashrc" ]; then
            shell_config="$HOME/.bashrc"
        elif [ -f "$HOME/.bash_profile" ]; then
            shell_config="$HOME/.bash_profile"
        fi
    elif [ -n "${ZSH_VERSION:-}" ]; then
        shell_config="$HOME/.zshrc"
    fi
    
    if [ -z "$shell_config" ]; then
        echo_warn "Could not detect shell config file. Skipping auto-switching setup."
        return 0
    fi
    
    # Check if auto-switching is already configured
    if grep -q "autoload-nvmrc" "$shell_config" 2>/dev/null; then
        echo_warn "Auto NVM switching already configured in $shell_config"
        return 0
    fi
    
    echo_info "Adding auto NVM switching to $shell_config..."
    
    cat >> "$shell_config" << 'EOF'

# Automatically switch Node version when entering a directory with .nvmrc
autoload-nvmrc() {
    local nvmrc_path
    nvmrc_path="$(nvm_find_nvmrc)"

    if [ -n "$nvmrc_path" ]; then
        local nvmrc_node_version
        nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")

        if [ "$nvmrc_node_version" = "N/A" ]; then
            nvm install
        elif [ "$nvmrc_node_version" != "$(nvm version)" ]; then
            nvm use
        fi
    elif [ -n "$(PWD=$OLDPWD nvm_find_nvmrc)" ] && [ "$(nvm version)" != "$(nvm version default)" ]; then
        echo "Reverting to nvm default version"
        nvm use default
    fi
}

# Hook into directory change
if [ -n "${BASH_VERSION:-}" ]; then
    PROMPT_COMMAND="autoload-nvmrc; $PROMPT_COMMAND"
elif [ -n "${ZSH_VERSION:-}" ]; then
    autoload -U add-zsh-hook
    add-zsh-hook chpwd autoload-nvmrc
    autoload-nvmrc
fi
EOF
    
    echo_info "Auto NVM switching configured in $shell_config"
    echo_warn "Please restart your shell or run: source $shell_config"
}

# install_dependencies installs frontend dependencies in $FRONTEND_DIR by selecting the project's Node version with nvm and running `pnpm install`.
install_dependencies() {
    echo_info "Installing frontend dependencies..."
    
    cd "$FRONTEND_DIR"
    
    # Use the correct Node version
    nvm use
    
    pnpm install
    
    echo_info "Dependencies installed successfully"
}

# main orchestrates the frontend environment setup by running OS checks, installing and loading NVM, installing Node and pnpm, creating a .nvmrc, enabling automatic NVM switching, and installing frontend dependencies.
# main orchestrates frontend environment setup: it verifies the OS, installs and loads NVM, installs the specified Node.js and pnpm, creates the frontend .nvmrc, configures automatic NVM switching in the user's shell, installs frontend dependencies, and prints next-step instructions.
main() {
    echo_info "Starting frontend environment setup..."
    echo_info "Project root: $PROJECT_ROOT"
    echo_info "Frontend directory: $FRONTEND_DIR"
    
    check_os
    install_nvm
    load_nvm
    install_node
    install_pnpm
    create_nvmrc
    setup_auto_nvm
    install_dependencies
    
    echo ""
    echo_info "✅ Frontend environment setup complete!"
    echo ""
    echo_info "Next steps:"
    echo "  1. Restart your shell or run: source ~/.bashrc (or ~/.zshrc)"
    echo "  2. Navigate to the frontend directory: cd $FRONTEND_DIR"
    echo "  3. Node version will automatically switch to $(cat ${FRONTEND_DIR}/.nvmrc)"
    echo "  4. Run development server: pnpm dev"
    echo ""
}

main "$@"