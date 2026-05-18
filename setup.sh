cat > ~/Documents/GitHub/TriageAI/setup.sh << 'EOF'
#!/bin/bash
clear

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

echo ""
echo -e "${RED}"
echo "  ████████╗██████╗ ██╗ █████╗  ██████╗ ███████╗ █████╗ ██╗"
echo "     ██╔══╝██╔══██╗██║██╔══██╗██╔════╝ ██╔════╝██╔══██╗██║"
echo "     ██║   ██████╔╝██║███████║██║  ███╗█████╗  ███████║██║"
echo "     ██║   ██╔══██╗██║██╔══██║██║   ██║██╔══╝  ██╔══██║██║"
echo "     ██║   ██║  ██║██║██║  ██║╚██████╔╝███████╗██║  ██║██║"
echo "     ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝"
echo -e "${NC}"
echo -e "${WHITE}           TriageAI — First Time Setup${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check Node.js
echo -e "${YELLOW}[1/6] Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    echo -e "${GREEN}      ✅ Node.js $(node --version) found${NC}"
else
    echo -e "${RED}      ❌ Node.js not found!${NC}"
    echo -e "${WHITE}         Install from: https://nodejs.org${NC}"
    echo -e "${WHITE}         Then run this script again.${NC}"
    exit 1
fi

# Check Ollama
echo ""
echo -e "${YELLOW}[2/6] Checking Ollama...${NC}"
if command -v ollama &> /dev/null; then
    echo -e "${GREEN}      ✅ Ollama found${NC}"
else
    echo -e "${RED}      ❌ Ollama not found!${NC}"
    echo -e "${WHITE}         Install from: https://ollama.com${NC}"
    echo -e "${WHITE}         Then run this script again.${NC}"
    exit 1
fi

# Download Gemma model
echo ""
echo -e "${YELLOW}[3/6] Checking Gemma 4 model (~9.6GB)...${NC}"
if ollama list | grep -q "gemma4:e4b"; then
    echo -e "${GREEN}      ✅ gemma4:e4b already downloaded${NC}"
else
    echo -e "${YELLOW}      Downloading gemma4:e4b - this may take 10-20 minutes...${NC}"
    ollama pull gemma4:e4b
    echo -e "${GREEN}      ✅ gemma4:e4b downloaded${NC}"
fi

# Install frontend dependencies
echo ""
echo -e "${YELLOW}[4/6] Installing frontend dependencies...${NC}"
cd "$PROJECT_DIR"
npm install --silent
echo -e "${GREEN}      ✅ Frontend dependencies installed${NC}"

# Install backend dependencies
echo ""
echo -e "${YELLOW}[5/6] Installing backend dependencies...${NC}"
cd "$PROJECT_DIR/triageai-server"
npm install --silent
echo -e "${GREEN}      ✅ Backend dependencies installed${NC}"

# Generate SSL certificate
echo ""
echo -e "${YELLOW}[6/6] Generating security certificate...${NC}"
if [ -f "$PROJECT_DIR/triageai-server/key.pem" ] && [ -f "$PROJECT_DIR/triageai-server/cert.pem" ]; then
    echo -e "${GREEN}      ✅ Certificate already exists${NC}"
else
    cd "$PROJECT_DIR/triageai-server"
    openssl req -x509 -newkey rsa:2048 -nodes \
        -keyout key.pem -out cert.pem -days 365 \
        -subj "/CN=triageai" \
        -addext "subjectAltName=IP:0.0.0.0,IP:127.0.0.1,DNS:localhost" \
        2>/dev/null
    echo -e "${GREEN}      ✅ Certificate generated${NC}"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}  ✅ Setup complete!${NC}"
echo ""
echo -e "${WHITE}  Now run: ${GREEN}./start.sh${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
EOF

chmod +x ~/Documents/GitHub/TriageAI/setup.sh