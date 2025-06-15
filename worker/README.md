# Cloudflare Worker - Leaderboard API

This is the backend API for the NEONDROP5 game leaderboard system, deployed as a Cloudflare Worker.

## Deployment

1. Deploy this file to Cloudflare Workers
2. Set up a KV namespace called `SCORES`
3. Bind the KV namespace to the worker
4. The worker will be available at: `https://leaderboard.hambomyers.workers.dev`

## API Endpoints

- `POST /api/scores` - Submit a new score
- `GET /api/leaderboard` - Get leaderboard (up to 100 entries)
- `GET /api/leaderboard/large` - Get large leaderboard (up to 1000 entries)
- `GET /api/players/{id}/stats` - Get player statistics

## Features

- Anti-cheat validation
- Duplicate submission prevention
- Player statistics tracking
- Daily/weekly/all-time leaderboards
- Scalable for competitive gaming (1000+ players)

## Current Status

✅ **DEPLOYED AND WORKING** - The API is live and functioning correctly.
