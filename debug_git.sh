#!/bin/bash
LOG_FILE="git_debug.log"

echo "=== GIT DEBUG START: $(date) ===" > $LOG_FILE
echo "PWD: $(pwd)" >> $LOG_FILE

echo "--- GIT STATUS ---" >> $LOG_FILE
git status >> $LOG_FILE 2>&1

echo "--- GIT ADD ---" >> $LOG_FILE
git add . >> $LOG_FILE 2>&1

echo "--- GIT COMMIT ---" >> $LOG_FILE
git commit -m "feat: unified loading screens and fixes" --no-verify >> $LOG_FILE 2>&1

echo "--- GIT PUSH ---" >> $LOG_FILE
git push origin dev >> $LOG_FILE 2>&1

echo "=== GIT DEBUG END ===" >> $LOG_FILE
