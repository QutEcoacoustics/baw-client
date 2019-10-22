#!/bin/env pwsh

$ErrorActionPreference = "Stop"

try {
  docker build . -t qutecoacoustics/workbench-client:latest --pull --no-cache

  docker push qutecoacoustics/workbench-client:latest


}
finally {

}

