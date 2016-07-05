#!/usr/bin/env bash
#
set -e

echo "Running test with coverage..."
./tools/bin/coverage

echo "sending coverage report to coveralls..."
cat ./coverage/lcov.info | coveralls && rm -rf ./coverage