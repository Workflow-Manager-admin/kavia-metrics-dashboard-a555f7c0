#!/bin/bash
cd /home/kavia/workspace/code-generation/kavia-metrics-dashboard-a555f7c0/kavia_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

