# -*- coding: utf-8 -*-
import json
import logging
import math
import os
import urllib.request
import numpy as np
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

ODDS_FILE = "public/data/upcoming_odds.json"
RHO = -0.13

LEAGUES_TO_SCRAPE = [
    {"slug": "usa.1", "name": "MLS"},
    {"slug": "usa.nwsl", "name": "NWSL"},
    {"slug": "usa.usl.1", "name": "USL Championship"},
    {"slug": "usa.usl.2", "name": "USL League One"},
    {"slug": "usa.usl.l1", "name": "USL League One"},
    {"slug": "usa.mls_next", "name": "MLS NEXT Pro"},
    {"slug": "usa.w.usl.1", "name": "USL Super League"}
]

TEAM_RATINGS = {
    # NWSL
    "North Carolina Courage": {"elo": 1540, "val": 4300000, "form": 7.0, "player_rating": 7.6, "key_players": [{"name": "Ashley Sanchez", "goal_share": 0.29, "xa_per90": 0.31, "shots_per90": 2.8}]},
    "Denver Summit FC": {"elo": 1510, "val": 4000000, "form": 7.2, "player_rating": 7.3, "key_players": [{"name": "Summit Forward", "goal_share": 0.33, "xa_per90": 0.22, "shots_per90": 3.0}]},
    "Washington Spirit": {"elo": 1570, "val": 4900000, "form": 7.5, "player_rating": 8.0, "key_players": [{"name": "Trinity Rodman", "goal_share": 0.34, "xa_per90": 0.29, "shots_per90": 3.6}]},
    "Chicago Stars FC": {"elo": 1420, "val": 3500000, "form": 5.8, "player_rating": 6.8, "key_players": [{"name": "Mallory Swanson", "goal_share": 0.38, "xa_per90": 0.25, "shots_per90": 3.4}]},
    "Gotham FC": {"elo": 1580, "val": 5200000, "form": 7.7, "player_rating": 8.2, "key_players": [{"name": "Esther Gonzalez", "goal_share": 0.36, "xa_per90": 0.24, "shots_per90": 3.2}]},
    "Portland Thorns FC": {"elo": 1550, "val": 4600000, "form": 7.1, "player_rating": 7.8, "key_players": [{"name": "Sophia Smith", "goal_share": 0.42, "xa_per90": 0.26, "shots_per90": 4.1}]},

    # MLS
    "Inter Miami CF": {"elo": 1650, "val": 45000000, "form": 8.4, "player_rating": 8.9, "key_players": [{"name": "Lionel Messi", "goal_share": 0.38, "xa_per90": 0.42, "shots_per90": 4.2}]},
    "Atlanta United": {"elo": 1470, "val": 14000000, "form": 5.9, "player_rating": 7.0, "key_players": [{"name": "Saba Lobjanidze", "goal_share": 0.28, "xa_per90": 0.22, "shots_per90": 2.6}]},
    "FC Cincinnati": {"elo": 1610, "val": 26000000, "form": 7.8, "player_rating": 8.2, "key_players": [{"name": "Lucho Acosta", "goal_share": 0.34, "xa_per90": 0.38, "shots_per90": 3.5}]},
    "Columbus Crew": {"elo": 1630, "val": 31000000, "form": 8.1, "player_rating": 8.5, "key_players": [{"name": "Cucho Hernandez", "goal_share": 0.40, "xa_per90": 0.30, "shots_per90": 4.1}]}
}

def get_team_rating(team_name):
    if team_name in TEAM_RATINGS:
        return TEAM_RATINGS[team_name]
    # Unique deterministic positional ratings per team name string
    name_sum = sum(ord(c) * (i + 1) for i, c in enumerate(team_name))
    elo = 1250 + (name_sum % 350)
    val = 1500000 + (name_sum % 40) * 200000
    form = round(4.5 + ((name_sum % 45) / 10.0), 1)
    player_rating = round(5.0 + ((name_sum % 38) / 10.0), 1)
    return {
        "elo": elo,
        "val": val,
        "form": form,
        "player_rating": player_rating,
        "key_players": [
            {"name": f"Key Attacker ({team_name[:3]})", "goal_share": 0.30, "xa_per90": 0.20, "shots_per90": 2.8}
        ]
    }

def dixon_coles_tau(h, a, home_xg, away_xg, rho=RHO):
    if h == 0 and a == 0: return max(0.0, 1.0 - (home_xg * away_xg * rho))
    elif h == 1 and a == 0: return max(0.0, 1.0 + (away_xg * rho))
    elif h == 0 and a == 1: return max(0.0, 1.0 + (home_xg * rho))
    elif h == 1 and a == 1: return max(0.0, 1.0 - rho)
    return 1.0

def to_american(prob):
    if prob <= 0: return "+9900"
    if prob >= 1: return "-9900"
    if prob >= 0.5:
        return f"-{int(round((prob / (1 - prob)) * 100))}"
    else:
        return f"+{int(round(((1 - prob) / prob) * 100))}"

def calculate_model_markets(home_team, away_team, home_r, away_r):
    home_comp = (0.45 * home_r["elo"]) + (0.25 * home_r["player_rating"] * 180) + (0.15 * math.log10(max(home_r["val"], 100000)) * 180) + (0.15 * (home_r["form"] - 5.0) * 100) + 40.0
    away_comp = (0.45 * away_r["elo"]) + (0.25 * away_r["player_rating"] * 180) + (0.15 * math.log10(max(away_r["val"], 100000)) * 180) + (0.15 * (away_r["form"] - 5.0) * 100)
    
    diff = home_comp - away_comp
    
    home_xg = max(0.40, round(1.48 + (diff / 220.0), 2))
    away_xg = max(0.30, round(1.18 - (diff / 220.0), 2))

    matrix = np.zeros((6, 6))
    for h in range(6):
        for a in range(6):
            p_h = (home_xg ** h * math.exp(-home_xg)) / math.factorial(h)
            p_a = (away_xg ** a * math.exp(-away_xg)) / math.factorial(a)
            matrix[h, a] = p_h * p_a * dixon_coles_tau(h, a, home_xg, away_xg)

    total_p = np.sum(matrix)
    if total_p > 0: matrix /= total_p

    p_home = float(np.sum(np.tril(matrix, -1)))
    p_draw = float(np.sum(np.diag(matrix)))
    p_away = float(np.sum(np.triu(matrix, 1)))

    tnb_denom = max(p_home + p_away, 0.001)
    p_tnb_home = p_home / tnb_denom
    p_tnb_away = p_away / tnb_denom

    totals = {}
    for line in [1.5, 2.5, 3.5]:
        p_over = float(sum(matrix[h, a] for h in range(6) for a in range(6) if (h + a) > line))
        totals[f"over_{str(line).replace('.', '_')}"] = {"prob": round(p_over * 100, 1), "fair_american": to_american(p_over)}
        totals[f"under_{str(line).replace('.', '_')}"] = {"prob": round((1 - p_over) * 100, 1), "fair_american": to_american(1 - p_over)}

    p_home_m15 = float(sum(matrix[h, a] for h in range(6) for a in range(6) if (h - a) > 1.5))
    p_away_p15 = 1.0 - p_home_m15

    player_props = []
    for team_name, rating, is_home in [(home_team, home_r, True), (away_team, away_r, False)]:
        t_xg = home_xg if is_home else away_xg
        for pl in rating.get("key_players", []):
            p_goal = 1.0 - math.exp(-1.0 * (t_xg * pl["goal_share"]))
            p_assist = 1.0 - math.exp(-1.0 * (t_xg * pl["xa_per90"]))
            
            lambda_shots = pl["shots_per90"] * (t_xg / 1.40)
            p_shots_o25 = 1.0 - sum((lambda_shots**k * math.exp(-lambda_shots)) / math.factorial(k) for k in range(3))

            player_props.append({
                "player_name": pl["name"],
                "team": team_name,
                "anytime_goalscorer": {"prob": round(p_goal * 100, 1), "fair_american": to_american(p_goal)},
                "anytime_assist": {"prob": round(p_assist * 100, 1), "fair_american": to_american(p_assist)},
                "shots_over_25": {"prob": round(p_shots_o25 * 100, 1), "fair_american": to_american(p_shots_o25)}
            })

    return {
        "home_xg": home_xg,
        "away_xg": away_xg,
        "moneyline": {
            "home": {"prob": round(p_home * 100, 1), "fair_american": to_american(p_home)},
            "draw": {"prob": round(p_draw * 100, 1), "fair_american": to_american(p_draw)},
            "away": {"prob": round(p_away * 100, 1), "fair_american": to_american(p_away)}
        },
        "tie_no_bet": {
            "home": {"prob": round(p_tnb_home * 100, 1), "fair_american": to_american(p_tnb_home)},
            "away": {"prob": round(p_tnb_away * 100, 1), "fair_american": to_american(p_tnb_away)}
        },
        "totals": totals,
        "spread": {
            "home_minus_1_5": {"prob": round(p_home_m15 * 100, 1), "fair_american": to_american(p_home_m15)},
            "away_plus_1_5": {"prob": round(p_away_p15 * 100, 1), "fair_american": to_american(p_away_p15)}
        },
        "player_props": player_props
    }

def fetch_live_espn_events():
    events_found = []
    seen_ids = set()
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

    for lg in LEAGUES_TO_SCRAPE:
        url = f"https://site.api.espn.com/apis/site/v2/sports/soccer/{lg['slug']}/scoreboard"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=6) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    for event in data.get("events", []):
                        eid = event.get("id")
                        if eid in seen_ids:
                            continue
                        seen_ids.add(eid)

                        event_date = event.get("date")
                        competitions = event.get("competitions", [])
                        if not competitions:
                            continue

                        competitors = competitions[0].get("competitors", [])
                        home_team, away_team = None, None

                        for comp in competitors:
                            t_name = comp.get("team", {}).get("displayName") or comp.get("team", {}).get("name")
                            if comp.get("homeAway") == "home":
                                home_team = t_name
                            else:
                                away_team = t_name

                        if home_team and away_team:
                            events_found.append({
                                "id": f"espn_{eid}",
                                "slug": lg["slug"],
                                "league": lg["name"],
                                "home": home_team,
                                "away": away_team,
                                "time": event_date
                            })
        except Exception as e:
            logging.warning(f"Live fetch warning for {lg['name']} ({lg['slug']}): {e}")

    return events_found

def run_pipeline():
    logging.info("Executing Dynamic Live ESPN Scoreboard Scraper Pipeline...")
    
    live_slate = fetch_live_espn_events()
    logging.info(f"Live API scraper retrieved {len(live_slate)} match events from ESPN endpoints.")

    live_slate.sort(key=lambda x: x["time"])

    output_fixtures = []
    for item in live_slate:
        home_r = get_team_rating(item["home"])
        away_r = get_team_rating(item["away"])
        model_markets = calculate_model_markets(item["home"], item["away"], home_r, away_r)

        output_fixtures.append({
            "fixture_id": item["id"],
            "league": item["league"],
            "kickoff_iso": item["time"],
            "home_team": item["home"],
            "away_team": item["away"],
            "model_markets": model_markets
        })

    payload = {
        "metadata": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "engine_status": "live_espn_scraper_active",
            "fixture_count": len(output_fixtures)
        },
        "fixtures": output_fixtures
    }

    os.makedirs("public/data", exist_ok=True)
    with open(ODDS_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    logging.info(f"Updated {ODDS_FILE} with {len(output_fixtures)} dynamic live fixtures.")

if __name__ == "__main__":
    run_pipeline()
