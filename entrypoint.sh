#!/bin/sh
if [ -z "$LOG_LEVEL" ]; then
  LOG_LEVEL=warn
fi
mitmdump \
  -p $LISTEN_PORT \
  --mode reverse:$TARGET_URL \
  -s ./log-metrics.py \
  --set termlog_verbosity=$LOG_LEVEL \
  --set block_global=false
