#!/bin/bash

pushd /home/gregstoll/projects/mlb-triple-crown > /dev/null
. .venv/bin/activate
.venv/bin/python3 getleaders/getleaders.py -u
cp getleaders/data/NL.json showleaders/data
cp getleaders/data/AL.json showleaders/data
popd > /dev/null
