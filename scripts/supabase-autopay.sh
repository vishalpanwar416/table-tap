#!/usr/bin/env bash
# Supabase CLI helpers for subscription autopay ops.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEV_REF="vogixryubhpqziivspks"
PROD_REF="jkrhtaqlwcndozcynrgk"

usage() {
  cat <<EOF
Usage: $(basename "$0") <command> [project]

Commands:
  deploy [dev|prod|all]     Deploy subscription edge functions
  secrets [dev|prod|all]    Set SUBSCRIPTION_CRON_SECRET (generates if missing)
  migrate-cron [dev|prod] Apply cron migration + configure system_settings
  test-renewal [dev|prod]   Invoke process-subscription-renewals once
  status [dev|prod]         Show cron job + autopay ops config

Examples:
  ./scripts/supabase-autopay.sh deploy all
  ./scripts/supabase-autopay.sh migrate-cron dev
  ./scripts/supabase-autopay.sh test-renewal dev
EOF
}

ref_for() {
  case "${1:-dev}" in
    dev) echo "$DEV_REF" ;;
    prod) echo "$PROD_REF" ;;
    *) echo "Unknown project: $1" >&2; exit 1 ;;
  esac
}

deploy_functions() {
  local ref="$1"
  for fn in create-subscription-checkout complete-subscription-payment cancel-subscription-autopay; do
    supabase functions deploy "$fn" --project-ref "$ref" --use-api
  done
  supabase functions deploy process-subscription-renewals razorpay-subscription-webhook \
    --project-ref "$ref" --no-verify-jwt --use-api
}

set_secrets() {
  local ref="$1"
  local secret_file="${TMPDIR:-/tmp}/tabletap_cron_secret_${ref}.txt"
  if [[ ! -f "$secret_file" ]]; then
    openssl rand -hex 32 > "$secret_file"
  fi
  supabase secrets set "SUBSCRIPTION_CRON_SECRET=$(cat "$secret_file")" --project-ref "$ref"
  echo "SUBSCRIPTION_CRON_SECRET set for $ref (local copy: $secret_file)"
}

migrate_cron() {
  local ref="$1"
  local secret_file="${TMPDIR:-/tmp}/tabletap_cron_secret_${ref}.txt"
  supabase link --project-ref "$ref" --yes
  supabase db query --linked --yes -f "$ROOT/supabase/migrations/20260615_subscription_renewal_cron.sql"
  if [[ -f "$secret_file" ]]; then
    local base="https://${ref}.supabase.co/functions/v1"
    local secret
    secret="$(cat "$secret_file")"
    supabase db query --linked --yes "UPDATE public.system_settings SET value = value || jsonb_build_object('function_url', '${base}/process-subscription-renewals', 'cron_secret', '${secret}', 'webhook_url', '${base}/razorpay-subscription-webhook'), updated_at = now() WHERE key = 'subscription_autopay_ops';"
  fi
}

test_renewal() {
  local ref="$1"
  local secret
  secret="$(supabase secrets list --project-ref "$ref" 2>/dev/null | awk '/SUBSCRIPTION_CRON_SECRET/{found=1} found && NR>1{exit} END{}' || true)"
  if [[ -z "${secret:-}" ]]; then
    echo "Set secrets first: $(basename "$0") secrets $ref" >&2
    exit 1
  fi
  # Edge function reads secret from env; invoke using stored local secret file when available
  local secret_file="${TMPDIR:-/tmp}/tabletap_cron_secret_${ref}.txt"
  [[ -f "$secret_file" ]] || { echo "Missing $secret_file — run secrets command first" >&2; exit 1; }
  curl -s -X POST "https://${ref}.supabase.co/functions/v1/process-subscription-renewals" \
    -H "Content-Type: application/json" \
    -H "x-cron-secret: $(cat "$secret_file")" \
    -d '{}'
  echo
}

status() {
  local ref="$1"
  supabase link --project-ref "$ref" --yes
  supabase db query --linked --yes "SELECT jobname, schedule FROM cron.job WHERE jobname = 'process-subscription-renewals';"
  supabase db query --linked --yes "SELECT key, value->>'function_url' AS function_url, value->>'webhook_url' AS webhook_url, (length(value->>'cron_secret') > 0) AS has_cron_secret FROM system_settings WHERE key = 'subscription_autopay_ops';"
  supabase functions list --project-ref "$ref" | rg "subscription|razorpay-subscription" || true
}

cmd="${1:-}"
project="${2:-dev}"
case "$cmd" in
  deploy)
    if [[ "$project" == "all" ]]; then
      deploy_functions "$DEV_REF"
      deploy_functions "$PROD_REF"
    else
      deploy_functions "$(ref_for "$project")"
    fi
    ;;
  secrets)
    if [[ "$project" == "all" ]]; then
      set_secrets "$DEV_REF"
      set_secrets "$PROD_REF"
    else
      set_secrets "$(ref_for "$project")"
    fi
    ;;
  migrate-cron) migrate_cron "$(ref_for "$project")" ;;
  test-renewal) test_renewal "$(ref_for "$project")" ;;
  status) status "$(ref_for "$project")" ;;
  *) usage; exit 1 ;;
esac
