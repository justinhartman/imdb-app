#!/bin/bash
set -euo pipefail

# If set in Vercel Dashboard (or elsewhere), respect it.
if [[ -n "${APP_URL:-}" ]]; then
  echo "Using existing APP_URL=$APP_URL"
  exit 0
fi

# Fall back to deriving from VERCEL_BRANCH_URL
if [[ -z "${VERCEL_BRANCH_URL:-}" ]]; then
  echo "VERCEL_BRANCH_URL is not set; cannot derive APP_URL. Skipping."
  exit 0
fi

# Prefix https:// if needed
branch_url="$VERCEL_BRANCH_URL"
if [[ "$branch_url" != http://* && "$branch_url" != https://* ]]; then
  branch_url="https://$branch_url"
fi

printf "APP_URL=%s\n" "$branch_url" > .env.local
echo "Derived APP_URL=$branch_url → wrote to .env.local"
