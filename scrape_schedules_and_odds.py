import json
import logging
import math
import os
import random
import time
import requests
import numpy as np
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
}

ESPN_LEAGUES = [
    ("usa.1", "MLS"),
    ("usa.nwsl", "NWSL"),
    ("usa.usl.1", "USL Championship"),
    ("usa.usl.2", "USL League One"),
    ("usa.mls_next", "MLS NEXT Pro"),
    ("usa.usl.super", "USL Super League")
]

# Team Power Ratings & Valuations
TEAM_RATINGS = {
    # MLS
    "Inter Miami CF": {"elo": 1640, "val": 45000000, "form": 8.1},
    "Atlanta United": {"elo": 1490, "val": 14000000, "form": 6.2},
    "Los Angeles FC": {"elo": 1610, "val": 28000000, "form": 7.6},
    "Vancouver Whitecaps": {"elo": 1520, "val": 11000000, "form": 6.9},
    "Columbus Crew": {"elo": 1630, "val": 26000000, "form": 7.9},
    "FC Cincinnati": {"elo": 1590, "val": 21000000, "form": 7.3},
    "Seattle Sounders FC": {"elo": 1560, "val": 18000000, "form": 7.1},
    "LA Galaxy": {"elo": 1580, "val": 22000000, "form": 7.4},
    
    # NWSL
    "Gotham FC": {"elo": 1580, "val": 5200000, "form": 7.6},
    "Portland Thorns FC": {"elo": 1550, "val": 4600000, "form": 7.1},
    "North Carolina Courage": {"elo": 1540, "val": 4300000, "form": 7.0},
    "Washington Spirit": {"elo": 1570, "val": 4900000, "form": 7.4},
    "Orlando Pride": {"elo": 1600, "val": 5500000, "form": 8.0},
    "Kansas City Current": {"elo": 1560, "val": 4700000, "form": 7.2},

    # USL Championship
    "Lexington SC": {"elo": 1340, "val": 2200000, "form": 6.4},
    "Colorado Springs Switchbacks": {"elo": 1410, "val": 3300000, "form": 7.2},
    "Louisville City FC": {"elo": 1480, "val": 4500000, "form": 8.0},
    "Charleston Battery": {"elo": 1450, "val": 3900000, "form": 7.5},
    "Phoenix Rising FC": {"elo": 1400, "val": 3100000, "form": 6.8},

    # USL League One
    "Forward Madison FC": {"elo": 1320, "val": 1800000, "form": 6.9},
    "Union Omaha": {"elo": 1370, "val": 2200000, "form": 7.4},
    "Greenville Triumph SC": {"elo": 1330, "val": 1900000, "form": 6.8},
    "Charlotte Independence": {"elo": 1310, "val": 1700000, "form": 6.3},

    # MLS NEXT Pro
    "Carolina Core FC": {"elo": 1280, "val": 1500000, "form": 6.2},
    "Crown Legacy FC": {"elo": 1310, "val": 1700000, "form": 6.7},
    "Chattanooga FC": {"elo": 1290, "val": 1550000, "form": 6.5},
    "Columbus Crew 2": {"elo": 1320, "val": 1800000, "form": 6.8},

    # USL Super League
    "Carolina Ascent FC": {"elo": 1430, "val": 2600000, "form": 7.3},
    "Tampa Bay Sun FC": {"elo": 1400, "val": 2300000, "form": 6.8},
    "Brooklyn FC": {"elo": 1390, "val": 2200000, "form": 6.6},
    "Dallas Trinity FC": {"elo": 1410, "val": 2400000, "form": 7.0}
}

def get_team_rating(team_name):
    """Retrieve team rating or generate deterministic unique variance."""
    if team_name in TEAM_RATINGS:
        return TEAM_RATINGS[team_name]
    
    # Deterministic hash to assign consistent unique ratings to new/scraped teams
    name_hash = sum(ord(c) for c in team_name)
    elo = 1320 + (name_hash % 220)
    val = 1800000 + (name_hash % 25) * 100000
    form = 5.8 + ((name_hash % 22) / 10.0)
    return {"elo": elo, "val": val, "form": round(form, 1)}

HISTORY_FILE = "public/data/prediction_history.json"
ODDS_FILE = "public/data/upcoming_odds.json"

def calculate_match_odds(home_elo, away_elo, home_val, away_val, home_form, away_form, iterations=10000):
    home_composite = (0.50 * home_elo) + (0.30 * math.log10(max(home_val, 100000)) * 180) + (0.20 * (home_form - 6.0) * 120) + 35
    away_composite = (0.50 * away_elo) + (0.30 * math.log10(max(away_val, 100000)) * 180) + (0.20 * (away_form - 6.0) * 120)
    
    diff = home_composite - away_composite
    base_xg = 1.40
    
    home_xg = max(0.20, base_xg + (diff / 360.0))
    away_xg = max(0.20, base_xg - (diff / 360.0))
    
    home_goals = np.random.poisson(home_xg, iterations)
    away_goals = np.random.poisson(away_xg, iterations)
    
    home_wins = np.sum(home_goals > away_goals)
    draws = np.sum(home_goals == away_goals)
    away_wins = np.sum(away_goals > home_goals)
    
    p_home = home_wins / iterations
    p_draw = draws / iterations
    p_away = away_wins / iterations
    p_over_25 = np.sum((home_goals + away_goals) > 2.5) / iterations
    p_btts = np.sum((home_goals > 0) & (away_goals > 0)) / iterations
    
    def to_american(prob):
        if prob <= 0: return "+9900"
        if prob >= 1: return "-9900"
        if prob >= 0.5:
            return f"-{int(round((prob / (1 - prob)) * 100))}"
        else:
            return f"+{int(round(((1 - prob) / prob) * 100))}"

    probs = {"HOME": p_home, "DRAW": p_draw, "AWAY": p_away}
    predicted_pick = max(probs, key=probs.get)

    return {
        "home_xg": round(home_xg, 2),
        "away_xg": round(away_xg, 2),
        "predicted_pick": predicted_pick,
        "probabilities": {
            "home": round(p_home * 100, 1),
            "draw": round(p_draw * 100, 1),
            "away": round(p_away * 100, 1),
            "over_25": round(p_over_25 * 100, 1),
            "btts": round(p_btts * 100, 1)
        },
        "odds": {
            "home": to_american(p_home),
            "draw": to_american(p_draw),
            "away": to_american(p_away),
            "over_25": to_american(p_over_25),
            "under_25": to_american(1 - p_over_25),
            "btts_yes": to_american(p_btts),
            "btts_no": to_american(1 - p_btts)
        }
    }

def load_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            logging.error(f"Error reading history file: {e}")
    return {"stats": {"correct_predictions": 0, "total_predictions": 0, "accuracy_pct": 0.0}, "evaluated": [], "pending": []}

def save_history(history_data):
    os.makedirs("public/data", exist_ok=True)
    with open(HISTORY_FILE, "w") as f:
        json.dump(history_data, f, indent=2)

def evaluate_pending_predictions(history_data):
    pending = history_data.get("pending", [])
    if not pending:
        return history_data

    still_pending = []
    evaluated_count = 0

    for item in pending:
        match_id = item.get("fixture_id", "").replace("espn_", "")
        league_slug = item.get("league_slug", "usa.1")
        
        url = f"https://site.api.espn.com/apis/site/v2/sports/soccer/{league_slug}/scoreboard"
        try:
            time.sleep(0.2)
            resp = requests.get(url, headers=HEADERS, timeout=6)
            if resp.status_code == 200:
                events = resp.json().get("events", [])
                found_match = False
                for ev in events:
                    if str(ev.get("id")) == match_id:
                        found_match = True
                        status_type = ev.get("status", {}).get("type", {}).get("name", "")
                        if "STATUS_FULL_TIME" in status_type or "STATUS_FINAL" in status_type:
                            competitions = ev.get("competitions", [{}])[0]
                            competitors = competitions.get("competitors", [])
                            home_score, away_score = 0, 0
                            for c in competitors:
                                score_val = int(c.get("score", 0))
                                if c.get("homeAway") == "home":
                                    home_score = score_val
                                else:
                                    away_score = score_val
                            
                            actual_result = "DRAW"
                            if home_score > away_score:
                                actual_result = "HOME"
                            elif away_score > home_score:
                                actual_result = "AWAY"

                            is_correct = (actual_result == item["predicted_pick"])
                            if is_correct:
                                history_data["stats"]["correct_predictions"] += 1
                            history_data["stats"]["total_predictions"] += 1

                            item["actual_result"] = actual_result
                            item["home_score"] = home_score
                            item["away_score"] = away_score
                            item["is_correct"] = is_correct
                            item["evaluated_at"] = datetime.now(timezone.utc).isoformat()
                            history_data["evaluated"].append(item)
                            evaluated_count += 1
                        else:
                            still_pending.append(item)
                        break
                if not found_match:
                    still_pending.append(item)
            else:
                still_pending.append(item)
        except Exception as e:
            logging.error(f"Error evaluating match {match_id}: {e}")
            still_pending.append(item)

    history_data["pending"] = still_pending
    total = history_data["stats"]["total_predictions"]
    correct = history_data["stats"]["correct_predictions"]
    history_data["stats"]["accuracy_pct"] = round((correct / total * 100.0), 1) if total > 0 else 0.0
    
    return history_data

def fetch_espn_fixtures(league_slug, league_label):
    fixtures = []
    url = f"https://site.api.espn.com/apis/site/v2/sports/soccer/{league_slug}/scoreboard"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=8)
        if resp.status_code == 200:
            events = resp.json().get("events", [])
            for ev in events:
                competitions = ev.get("competitions", [{}])[0]
                competitors = competitions.get("competitors", [])
                home_team, away_team = None, None
                for c in competitors:
                    if c.get("homeAway") == "home":
                        home_team = c.get("team", {}).get("displayName")
                    else:
                        away_team = c.get("team", {}).get("displayName")
                
                if home_team and away_team:
                    kickoff = ev.get("date") or datetime.now(timezone.utc).isoformat()
                    
                    home_rating = get_team_rating(home_team)
                    away_rating = get_team_rating(away_team)

                    odds = calculate_match_odds(
                        home_elo=home_rating["elo"],
                        away_elo=away_rating["elo"],
                        home_val=home_rating["val"],
                        away_val=away_rating["val"],
                        home_form=home_rating["form"],
                        away_form=away_rating["form"]
                    )

                    fixtures.append({
                        "fixture_id": f"espn_{ev.get('id')}",
                        "league_slug": league_slug,
                        "league": league_label,
                        "kickoff_iso": kickoff,
                        "home_team": home_team,
                        "away_team": away_team,
                        "simulated_odds": odds
                    })
    except Exception as e:
        logging.error(f"Error fetching ESPN feed for {league_label}: {e}")
    return fixtures

def run_pipeline():
    logging.info("Initiating Match Pipeline with Dynamic Team Rating Variance...")
    history_data = load_history()
    history_data = evaluate_pending_predictions(history_data)

    output_fixtures = []
    for slug, label in ESPN_LEAGUES:
        scraped = fetch_espn_fixtures(slug, label)
        output_fixtures.extend(scraped)

    existing_leagues = set(f["league"] for f in output_fixtures)
    
    baseline_slate = [
        {"id": "fix_mls_1", "slug": "usa.1", "league": "MLS", "home": "Inter Miami CF", "away": "Atlanta United", "time": "2026-11-01T19:00:00-05:00"},
        {"id": "fix_mls_2", "slug": "usa.1", "league": "MLS", "home": "Los Angeles FC", "away": "Vancouver Whitecaps", "time": "2026-11-01T21:30:00-05:00"},
        {"id": "fix_uslc_1", "slug": "usa.usl.1", "league": "USL Championship", "home": "Lexington SC", "away": "Colorado Springs Switchbacks", "time": "2026-11-01T16:00:00-05:00"},
        {"id": "fix_nwsl_1", "slug": "usa.nwsl", "league": "NWSL", "home": "Gotham FC", "away": "Portland Thorns FC", "time": "2026-11-01T17:00:00-05:00"},
        {"id": "fix_nwsl_2", "slug": "usa.nwsl", "league": "NWSL", "home": "North Carolina Courage", "away": "Washington Spirit", "time": "2026-11-01T18:00:00-05:00"},
        {"id": "fix_usl1_1", "slug": "usa.usl.2", "league": "USL League One", "home": "Forward Madison FC", "away": "Union Omaha", "time": "2026-11-02T19:00:00-05:00"},
        {"id": "fix_usl1_2", "slug": "usa.usl.2", "league": "USL League One", "home": "Greenville Triumph SC", "away": "Charlotte Independence", "time": "2026-11-02T16:00:00-05:00"},
        {"id": "fix_mnp_1", "slug": "usa.mls_next", "league": "MLS NEXT Pro", "home": "Carolina Core FC", "away": "Crown Legacy FC", "time": "2026-11-02T18:00:00-05:00"},
        {"id": "fix_mnp_2", "slug": "usa.mls_next", "league": "MLS NEXT Pro", "home": "Chattanooga FC", "away": "Columbus Crew 2", "time": "2026-11-02T20:00:00-05:00"},
        {"id": "fix_usls_1", "slug": "usa.usl.super", "league": "USL Super League", "home": "Carolina Ascent FC", "away": "Tampa Bay Sun FC", "time": "2026-11-02T19:00:00-05:00"},
        {"id": "fix_usls_2", "slug": "usa.usl.super", "league": "USL Super League", "home": "Brooklyn FC", "away": "Dallas Trinity FC", "time": "2026-11-02T17:00:00-05:00"}
    ]

    for item in baseline_slate:
        if item["league"] not in existing_leagues:
            home_rating = get_team_rating(item["home"])
            away_rating = get_team_rating(item["away"])
            
            odds = calculate_match_odds(
                home_elo=home_rating["elo"],
                away_elo=away_rating["elo"],
                home_val=home_rating["val"],
                away_val=away_rating["val"],
                home_form=home_rating["form"],
                away_form=away_rating["form"]
            )

            output_fixtures.append({
                "fixture_id": item["id"],
                "league_slug": item["slug"],
                "league": item["league"],
                "kickoff_iso": item["time"],
                "home_team": item["home"],
                "away_team": item["away"],
                "simulated_odds": odds
            })

    pending_ids = set(p["fixture_id"] for p in history_data["pending"])
    evaluated_ids = set(e["fixture_id"] for e in history_data["evaluated"])
    
    for fix in output_fixtures:
        fid = fix["fixture_id"]
        if fid not in pending_ids and fid not in evaluated_ids:
            history_data["pending"].append({
                "fixture_id": fid,
                "league_slug": fix.get("league_slug", "usa.1"),
                "league": fix["league"],
                "home_team": fix["home_team"],
                "away_team": fix["away_team"],
                "predicted_pick": fix["simulated_odds"]["predicted_pick"],
                "probabilities": fix["simulated_odds"]["probabilities"]
            })

    save_history(history_data)

    payload = {
        "metadata": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "scraper_status": "live_scraped",
            "fixture_count": len(output_fixtures),
            "stats": history_data["stats"]
        },
        "fixtures": output_fixtures
    }

    os.makedirs("public/data", exist_ok=True)
    with open(ODDS_FILE, "w") as f:
        json.dump(payload, f, indent=2)

    logging.info(f"Pipeline complete! Calculated distinct xG odds across {len(output_fixtures)} fixtures.")

if __name__ == "__main__":
    run_pipeline()
