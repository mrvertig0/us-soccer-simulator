import json
import logging
import math
import os
import random
import time
import requests
import numpy as np
from datetime import datetime, timedelta, timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.fotmob.com/",
}

# Target FotMob League IDs for US Soccer
TARGET_LEAGUES = {
    130: "MLS",
    8972: "USL Championship",
    9244: "USL League One",
    9134: "NWSL",
    10216: "MLS NEXT Pro"
}

def calculate_match_odds(home_elo=1500, away_elo=1480, home_val=3000000, away_val=2800000, home_form=7.0, away_form=6.8, iterations=10000):
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

    return {
        "home_xg": round(home_xg, 2),
        "away_xg": round(away_xg, 2),
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

def run_pipeline():
    logging.info("Initiating live FotMob match scrape...")
    output_fixtures = []
    
    today = datetime.now()
    # Check fixtures over the upcoming week
    for day_offset in range(7):
        target_date = (today + timedelta(days=day_offset)).strftime("%Y%m%d")
        url = f"https://www.fotmob.com/api/matches?date={target_date}&ccode3=USA&timezone=America%2FNew_York"
        
        time.sleep(random.uniform(1.2, 2.5))
        try:
            resp = requests.get(url, headers=HEADERS, timeout=10)
            if resp.status_code != 200:
                continue
            data = resp.json()
            leagues = data.get("leagues", [])
            
            for lg in leagues:
                lg_id = lg.get("primaryId") or lg.get("id")
                if lg_id in TARGET_LEAGUES:
                    league_name = TARGET_LEAGUES[lg_id]
                    for m in lg.get("matches", []):
                        home_name = m.get("home", {}).get("name")
                        away_name = m.get("away", {}).get("name")
                        match_id = str(m.get("id"))
                        status = m.get("status", {})
                        utc_time = status.get("utcTime") or target_date
                        
                        odds_data = calculate_match_odds()
                        
                        output_fixtures.append({
                            "fixture_id": f"fotmob_{match_id}",
                            "league": league_name,
                            "kickoff_iso": utc_time,
                            "home_team": home_name,
                            "away_team": away_name,
                            "simulated_odds": odds_data
                        })
        except Exception as e:
            logging.error(f"Error fetching date {target_date}: {e}")

    payload = {
        "metadata": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "scraper_status": "live_fotmob_scraped",
            "fixture_count": len(output_fixtures)
        },
        "fixtures": output_fixtures
    }

    os.makedirs("public/data", exist_ok=True)
    with open("public/data/upcoming_odds.json", "w") as f:
        json.dump(payload, f, indent=2)

    logging.info(f"Live FotMob scrape complete! Fetched {len(output_fixtures)} real fixtures.")

if __name__ == "__main__":
    run_pipeline()
