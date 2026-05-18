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
echo -e "${WHITE}        AI-Powered Medical Triage for Mass Casualty Events${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${YELLOW}[1/3] Starting Ollama AI Engine...${NC}"
OLLAMA_HOST=0.0.0.0:11434 OLLAMA_ORIGINS=* ollama serve > /tmp/ollama.log 2>&1 &
sleep 3
echo -e "${GREEN}      ✅ Ollama running on port 11434${NC}"
echo ""

echo -e "${YELLOW}[2/3] Starting Backend Server...${NC}"
cd "$PROJECT_DIR/triageai-server" && node server.js > /tmp/backend.log 2>&1 &
sleep 2
echo -e "${GREEN}      ✅ Backend running on port 3000${NC}"
echo ""

echo -e "${YELLOW}[3/3] Starting Frontend...${NC}"
cd "$PROJECT_DIR" && npm run dev > /tmp/frontend.log 2>&1 &
sleep 4
echo -e "${GREEN}      ✅ Frontend running on port 5174${NC}"
echo ""

IP=$(ipconfig getifaddr en0)
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${WHITE}  📱 Responder (Phone):  ${GREEN}https://$IP:5174${NC}"
echo -e "${WHITE}  🗺️  Commander (Laptop): ${GREEN}https://$IP:5174/commander${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${RED}  TriageAI is ready. Lives can be saved.${NC}"
echo ""

wait
