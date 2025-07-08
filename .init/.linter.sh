#!/bin/bash
cd /home/kavia/workspace/code-generation/hme-campcoordinator-991-e8e6c828/camp_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

