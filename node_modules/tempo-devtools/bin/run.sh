#!/bin/bash

NETCAT_PORT=2993

#############################################
# Pull in Env Variables
#############################################

# Path to the JSON configuration file
CONFIG_FILE="tempo.local.json"

# Read values from the JSON file into variables
RUN_COMMAND=$(jq -r '.run' "$CONFIG_FILE")
TEMPO_PROJECT_ID=$(jq -r '.tempo_project_id' "$CONFIG_FILE")
TEMPO_CANVAS_ID=$(jq -r '.tempo_canvas_id' "$CONFIG_FILE")
USER_ID=$(jq -r '.user_id' "$CONFIG_FILE")
DEV_SERVER_PORT=$(jq -r '.dev_server_port' "$CONFIG_FILE")

# Check if the value is empty and set to "PROD" if it is
if [ -z "$TEMPO_ENV" ]; then
    TEMPO_ENV="PROD"
fi

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cleanup () {
    echo "Shutting Tempo server down..."
    # echo "Ran Cleanup! $SERVER_PID $DEV_SERVER_PID"
    kill -9 $DEV_SERVER_PID >/dev/null 2>&1
    kill -9 $NETCAT_PID >/dev/null 2>&1
    exit
}

trap cleanup SIGTERM SIGINT ERR
trap cleanup EXIT

#############################################
# Kill any other dev server processes
#############################################

# Check if any process is running on the dev server port
if process_id=$(lsof -t -i:$DEV_SERVER_PORT); then
    echo "A process is running on port $DEV_SERVER_PORT. This port needs to be open to run Tempo locally."
    read -p "Do you want to kill this process? (Y/N): " user_input

    case $user_input in
        [Yy]* )
            kill -9 $process_id
            echo "Process killed."
            ;;
        [Nn]* )
            echo "Process on port $DEV_SERVER_PORT was not killed. Exiting script."
            exit 1
            ;;
        * )
            echo "Invalid input. Exiting script."
            exit 1
            ;;
    esac
fi

#############################################
# Start the dev server
#############################################

NEXT_PUBLIC_TEMPO=t $RUN_COMMAND &
DEV_SERVER_PID=$!

# Wait for the dev server to start
echo "Waiting for dev server to start..."
sleep 5

# Local directory and remote server details
LOCAL_DIR=$(pwd)

# Open the dev server in the browser
if [ "$TEMPO_ENV" = "DEV" ]; then
    open "http://localhost:3050/canvases/$TEMPO_CANVAS_ID/editor?localPort=$DEV_SERVER_PORT&localFilePath=$LOCAL_DIR"
elif [ "$TEMPO_ENV" = "STAGING" ]; then
    open "https://staging.tempolabs.ai/canvases/$TEMPO_CANVAS_ID/editor?localPort=$DEV_SERVER_PORT&localFilePath=$LOCAL_DIR"
else
    open "https://app.tempolabs.ai/canvases/$TEMPO_CANVAS_ID/editor?localPort=$DEV_SERVER_PORT&localFilePath=$LOCAL_DIR"
fi

# Always kill any process on the netcat port
if process_id=$(lsof -t -i:$NETCAT_PORT); then
    kill -9 $process_id
fi

while true; do
    {
        echo -ne "HTTP/1.1 200 OK\r\n"
        echo -ne "Content-Length: 7\r\n"
        echo -ne "Content-Type: text/plain\r\n"
        # Add CORS headers here
        echo -ne "Access-Control-Allow-Origin: *\r\n"
        echo -ne "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
        echo -ne "Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept\r\n"
        echo -ne "\r\nRunning\r\n"
    } | nc -l -p $NETCAT_PORT >/dev/null 2>&1
done &
NETCAT_PID=$!

sh $DIR/sync.sh
