#!/bin/sh
# TODO reduce logging of mitmdump
mitmdump \
  -p $LISTEN_PORT \
  --mode reverse:$TARGET_URL \
  -s ./log-metrics.py
