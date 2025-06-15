#!/bin/bash
# deploy-with-cache-clear.sh
# Automatically purge Cloudflare cache after deployment

# Set your zone ID and API token
ZONE_ID="your-zone-id-here"
API_TOKEN="your-api-token-here"

echo "Purging Cloudflare cache..."

# Purge all cache for the zone
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
     -H "Authorization: Bearer $API_TOKEN" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'

echo "Cache purged successfully!"
