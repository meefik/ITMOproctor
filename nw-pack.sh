#!/bin/bash
APP_NAME="proctor-client"
FILES=$(find ./build -type f -name "${APP_NAME}*" -exec echo -n "{} " \;)
[ -n "$FILES" ] && upx $FILES
