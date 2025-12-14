#!/bin/bash
# ABOUTME: Deploy script for Cloudflare Pages
# ABOUTME: Builds Quartz and deploys to remyjkim-blog project

set -e

PROJECT_NAME="remyjkim-blog"
BRANCH="${1:-$(git branch --show-current)}"

echo "🔨 Building Quartz..."
npx quartz build

echo "🚀 Deploying to Cloudflare Pages..."
echo "   Project: $PROJECT_NAME"
echo "   Branch: $BRANCH"

npx wrangler pages deploy public \
  --project-name "$PROJECT_NAME" \
  --branch "$BRANCH" \
  --commit-dirty=true

echo "✅ Deployment complete!"
echo "   Preview: https://$PROJECT_NAME.pages.dev"
