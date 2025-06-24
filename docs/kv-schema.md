# BlockZone Lab KV Storage Schema (Phase 1)

## Namespaces
- **PLAYERS**: User profiles, wallet/email, streaks, payment history
- **SCORES**: Scores, leaderboards (championship, friend challenge, all-time)
- **SESSIONS**: Session analytics, game data, device info
- **CHALLENGES**: Viral challenge links, state, participants, results
- **REWARDS**: Prize distribution, streak rewards

---

## PLAYERS Namespace
- `profile:{player_id}`: {
    player_id: string,
    display_name: string,
    wallet_address: string,
    email: string | null,
    tier: 'anonymous' | 'social' | 'web3',
    created_at: number,
    last_activity: number,
    current_high_score: number,
    streak: number,
    streak_updated: number,
    payment_history: [
      { amount: number, type: 'entry'|'win'|'reward', timestamp: number, txid: string }
    ]
  }
- `email:{email}`: player_id
- `wallet:{wallet_address}`: player_id

## SCORES Namespace
- `score:{score_id}`: {
    id: string,
    player_id: string,
    score: number,
    replay_hash: string,
    metrics: object,
    timestamp: number,
    verified: boolean
  }
- `leaderboard:{game}:{period}`: {
    scores: [
      { player_id: string, display_name: string, score: number, timestamp: number }
    ]
  }
- `player:{player_id}`: {
    high_score: number,
    games_played: number,
    total_score: number
  }

## SESSIONS Namespace
- `session:{session_id}`: {
    player_id: string,
    session_id: string,
    game_data: object,
    device_info: object,
    timestamp: number,
    stored_at: number
  }

## CHALLENGES Namespace
- `challenge:{challenge_id}`: {
    creator_id: string,
    creator_score: number,
    link: string, // /challenge/[username]/[score]
    participants: [
      { player_id: string, score: number, timestamp: number, result: 'win'|'lose'|'pending' }
    ],
    created_at: number,
    expires_at: number,
    status: 'active'|'completed'|'expired',
    winner_id: string | null
  }

## REWARDS Namespace
- `reward:{player_id}:{cycle}`: {
    player_id: string,
    cycle: string, // championship cycle id
    reward_type: 'streak'|'championship'|'challenge',
    amount: number,
    txid: string,
    timestamp: number
  }

---

## Usage Notes
- All keys are unique and indexed for fast lookup.
- Player profiles are linked to wallet/email for easy auth.
- Leaderboards are split by game and period (daily, weekly, all-time, challenge).
- Challenge links are auto-expiring and track all participants/results.
- Rewards are tracked per player and cycle for instant payout and streak bonuses. 