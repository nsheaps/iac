#!/usr/bin/env bash
set -euo pipefail

# pulumi-wrapper.sh — Wraps pulumi commands with 1Password secret injection
# and auto-detects the state backend (local file:// vs Cloudflare R2).
#
# Usage: bin/pulumi-wrapper.sh <pulumi-command> [args...]
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
PROJECT_DIR="${REPO_ROOT}/github-org"
ENV_FILE="${PROJECT_DIR}/.env.op"

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
  if [[ $# -lt 1 ]]; then
    echo "Usage: bin/pulumi-wrapper.sh <pulumi-command> [args...]" >&2
    echo "Example: bin/pulumi-wrapper.sh preview --stack prod" >&2
    exit 1
  fi

  detect_backend

  # If op CLI is available and env file exists, wrap with op run
  if command -v op &>/dev/null && [[ -f "${ENV_FILE}" ]]; then
    exec op run --env-file="${ENV_FILE}" -- pulumi -C "${PROJECT_DIR}" "$@"
  else
    # CI or environments without op — secrets should be in env already
    exec pulumi -C "${PROJECT_DIR}" "$@"
  fi
}

main "$@"
