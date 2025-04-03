#!/bin/bash

CONFIG_FILE="tempo.local.json"

DOCKER_CONTAINER_NAME=$(jq -r '.container_name' "$CONFIG_FILE")
SSH_PORT=$(jq -r '.port' "$CONFIG_FILE")

# Check if the value is empty and set to "PROD" if it is
if [ -z "$TEMPO_ENV" ]; then
    TEMPO_ENV="PROD"
fi

# Local directory and remote server details
LOCAL_DIR=$(pwd)

# Output the SSH URL
if [ "$TEMPO_ENV" = "PROD" ]; then
    SSH_REMOTE="root@ssh-$DOCKER_CONTAINER_NAME.dev.tempolabs.ai"
elif [ "$TEMPO_ENV" = "STAGING" ]; then
    SSH_REMOTE="root@ssh-$DOCKER_CONTAINER_NAME.staging-dev.tempolabs.ai"
else
    SSH_REMOTE=root@localhost
fi

SSH_COMMAND="ssh -o StrictHostKeyChecking=no -p $SSH_PORT"

# Cooldown period in seconds to prevent immediate re-trigger
COOLDOWN=1

# Last sync time initialization
LAST_SYNC=0

# Function to sync from local to remote
sync_to_remote() {
    # echo "Syncing to remote..."
    rsync -zuPrc --del -e "$SSH_COMMAND" --exclude 'node_modules' --exclude '.next' --exclude '.git' $LOCAL_DIR/ $SSH_REMOTE:/app >/dev/null
}

# Function to sync from remote to local
sync_to_local() {
    # echo "Syncing to local..."
    rsync -zuPrc --del -e "$SSH_COMMAND" --exclude 'node_modules' --exclude '.next' --exclude '.git' $SSH_REMOTE:/app/ $LOCAL_DIR >/dev/null
}

# First do a sync to remote to start
sync_to_remote

# Start monitoring local directory in background
# Don't sync if the change is in the .next, .git, or node_modules directories
fswatch --exclude '/\.next/' --exclude '/\.git/' --exclude '/node_modules/' --exclude '/tempobook/dynamic/' --exclude '/tempobook/storyboards/' $LOCAL_DIR | while read change; do
    CURRENT_TIME=$(date +%s)
    if [ $(($CURRENT_TIME - $LAST_SYNC)) -gt $COOLDOWN ]; then
        # echo "Change detected, syncing to remote: $change"
        # echo "Syncing to remote..."
        sync_to_remote
        LAST_SYNC=$(date +%s)
    fi
done &
FSWATCH_PID=$!

cleanup () {
    # echo "Ran Sync Cleanup!"
    kill -9 $FSWATCH_PID
    exit
}

trap cleanup SIGTERM SIGINT ERR
trap cleanup EXIT


# Start monitoring remote directory
$SSH_COMMAND $SSH_REMOTE "
    inotifywait -m -r -e modify,create,delete --exclude '/\.next/' --exclude '/\.git/' --exclude '/node_modules/' --format '%w%f' /app | while read change; do
        echo \"Remote change detected, syncing to local: \$change\"
    done
" | while read change; do
    CURRENT_TIME=$(date +%s)
    if [ $(($CURRENT_TIME - $LAST_SYNC)) -gt $COOLDOWN ]; then
        # echo "$change"
        # echo "Remote change detected, syncing to local..."
        sync_to_local
        LAST_SYNC=$(date +%s)
    fi
done


