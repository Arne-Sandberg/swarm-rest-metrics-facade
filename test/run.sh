#!/bin/bash
# run the tests
set -e
cd `dirname "$0"`

FLASK_PORT=35000

export FLASK_APP=server.py
flask run --port=$FLASK_PORT &
serverPid=$!
cd ..
sleep 1
mitmdump -p 33333 --mode reverse:http://localhost:$FLASK_PORT -s ./log-metrics.py &
mitmPid=$!
sleep 1
curl localhost:33333/text
curl localhost:33333/json-not-array
curl localhost:33333/json-no-id
curl localhost:33333/json

kill $mitmPid
kill $serverPid
wait

