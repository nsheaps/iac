#!/usr/bin/env bash
set -euo pipefail

# pulumi-wrapper.sh — Wraps pulumi commands with 1Password secret injection
# and auto-detects the state backend (local file:// vs Cloudflare R2).
#
# Usage: bin/pulumi-wrapper.sh [-C <project-dir>] <pulumi-command> [args...]
#
# The project directory defaults to github-org. Use -C to specify a different
# Pulumi project directory (relative to repo root).
#
# Backend auto-detection:
#   1. If PULUMI_BACKEND_URL is already set, use it as-is.
#   2. If R2 credentials are available (via op or env), use the R2 bucket.
#   3. Otherwise, fall back to file:// local state.
#
# The R2 bucket URL is configured via PULUMI_R2_BUCKET_URL env var or
# defaults to s3://nsheaps-pulumi-state (with R2 endpoint).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_DIR=""  # set in main() after arg parsing

# R2 configuration
# IMPORTANT: Replace YOUR_ACCOUNT_ID with your Cloudflare account ID before using R2 backend.
# Find it at: https://dash.cloudflare.com/ → any zone → Overview → right sidebar → Account ID.
R2_ENDPOINT="${PULUMI_R2_ENDPOINT:-}"
R2_BUCKET="${PULUMI_R2_BUCKET:-nsheaps-pulumi-state}"
R2_BACKEND_URL="s3://${R2_BUCKET}?endpoint=${R2_ENDPOINT}&disableSSL=false&s3ForcePathStyle=true"

detect_backend() {
  # If explicitly set, respect it
  if [[ -n "${PULUMI_BACKEND_URL:-}" ]]; then
    echo "Using explicit backend: ${PULUMI_BACKEND_URL}" >&2
    return
  fi

  # Try to detect R2 credentials — requires both creds AND a configured endpoint
  if [[ -n "${AWS_ACCESS_KEY_ID:-}" ]] && [[ -n "${AWS_SECRET_ACCESS_KEY:-}" ]] && [[ -n "${R2_ENDPOINT}" ]]; then
    # R2 credentials and endpoint available (either from op run or CI env)
    export PULUMI_BACKEND_URL="${R2_BACKEND_URL}"
    echo "Auto-detected R2 backend: s3://${R2_BUCKET}" >&2
    return
  fi

  # Fall back to local file:// state
  local state_dir="${REPO_ROOT}/.pulumi-state"
  mkdir -p "${state_dir}"
  export PULUMI_BACKEND_URL="file://${state_dir}"
  echo "Using local file backend: ${PULUMI_BACKEND_URL}" >&2
}

main() {
  # Parse optional -C flag for project directory
  local project="github-org"
  if [[ "${1:-}" == "-C" ]]; then
    shift
    project="${1:-}"
    shift
    if [[ -z "$project" ]]; then
      echo "Error: -C requires a project directory argument" >&2
      exit 1
    fi
  fi

  PROJECT_DIR="${REPO_ROOT}/${project}"
  local env_file="${PROJECT_DIR}/.env.op"

  if [[ $# -lt 1 ]]; then
    echo "Usage: bin/pulumi-wrapper.sh [-C <project-dir>] <pulumi-command> [args...]" >&2
    echo "Example: bin/pulumi-wrapper.sh preview --stack prod" >&2
    echo "Example: bin/pulumi-wrapper.sh -C cloudflare-apps preview --stack prod" >&2
    exit 1
  fi

  if [[ ! -d "${PROJECT_DIR}" ]]; then
    echo "Error: project directory not found: ${PROJECT_DIR}" >&2
    exit 1
  fi

  detect_backend

  # If op CLI is available and env file exists, wrap with op run
  if command -v op &>/dev/null && [[ -f "${env_file}" ]]; then
    exec op run --env-file="${env_file}" -- pulumi -C "${PROJECT_DIR}" "$@"
  else
    # CI or environments without op — secrets should be in env already
    exec pulumi -C "${PROJECT_DIR}" "$@"
  fi
}

main "$@"
