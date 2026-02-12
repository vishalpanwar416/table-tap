#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== 🔄 Fetching latest updates from remote... ===${NC}"
git fetch origin > /dev/null 2>&1

echo -e "\n${BLUE}=== 📊 Branch Status Tracker ===${NC}"
printf "%-10s | %-10s | %-20s | %s\n" "Branch" "Commit" "Last Updated" "Message"
echo "------------------------------------------------------------------------------------------------"

for branch in dev staging main; do
    if git show-ref --verify --quiet refs/remotes/origin/$branch; then
        HASH=$(git log -1 --format="%h" origin/$branch)
        DATE=$(git log -1 --format="%cr" origin/$branch)
        MSG=$(git log -1 --format="%s" origin/$branch | cut -c1-60)
        
        printf "${GREEN}%-10s${NC} | ${YELLOW}%-10s${NC} | %-20s | %s\n" "$branch" "$HASH" "$DATE" "$MSG"
    else
        printf "${GREEN}%-10s${NC} | %s\n" "$branch" "Branch not found on remote"
    fi
done

echo -e "\n${BLUE}=== 📉 Recent Git Timeline (Last 15 Commits) ===${NC}"
echo "Visualizing flow across branches..."
git log --graph --abbrev-commit --decorate --format=format:'%C(bold blue)%h%C(reset) - %C(bold green)(%ar)%C(reset) %C(white)%s%C(reset) %C(dim white)- %an%C(reset)%C(auto)%d%C(reset)' --all -n 15
echo -e "\n"
