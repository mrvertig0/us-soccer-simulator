import React, { useState, useEffect } from 'react';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState('ALL');
  const [showEVOnly, setShowEVOnly] = useState(false);
  const [parlayPicks, setParlayPicks] = useState([]);

  useEffect(() => {
    fetch('/data/upcoming_odds.json?t=' + Date.now())
      .then((res) => {
        if (!res.ok) throw new Error('HTTP error! status: ' + res.status);
        return res.json();
      })
      .then((jsonData) => {
        setData(jsonData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load live odds:', err);
        setLoading(false);
      });
  }, []);

  // Helper to parse American (+150, -110) or Decimal (2.50) odds into a decimal number
  function parseOddsToDecimal(oddsStr) {
    if (typeof oddsStr === 'number') return oddsStr;
    const str = String(oddsStr).trim();
    if (str.startsWith('+')) {
      return 1.0 + (parseFloat(str.replace('+', '')) / 100.0);
    } else if (str.startsWith('-')) {
      const val = parseFloat(str.replace('-', ''));
      return val > 0 ? 1.0 + (100.0 / val) : 1.0;
    }
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 1.0 : parsed;
  }

  // Calculate Expected Value percentage: EV = (Prob * Decimal_Odds) - 1
  function calculateEV(modelProbPct, oddsStr) {
    const p = modelProbPct / 100.0;
    const decOdds = parseOddsToDecimal(oddsStr);
    const ev = (p * decOdds) - 1.0;
    return ev * 100.0; // Return percentage e.g. +4.2
  }

  const toggleParlayPick = (fixture, selectionType, oddsStr, probVal) => {
    const existingIndex = parlayPicks.findIndex(
      (p) => p.fixture_id === fixture.fixture_id && p.selectionType === selectionType
    );

    if (existingIndex >= 0) {
      setParlayPicks(parlayPicks.filter((_, idx) => idx !== existingIndex));
    } else {
      const filtered = parlayPicks.filter((p) => p.fixture_id !== fixture.fixture_id);
      const teamLabel = selectionType === 'HOME' ? fixture.home_team : selectionType === 'AWAY' ? fixture.away_team : 'DRAW';
      setParlayPicks([
        ...filtered,
        {
          fixture_id: fixture.fixture_id,
          matchup: fixture.home_team + ' vs ' + fixture.away_team,
          selectionType,
          teamLabel,
          oddsStr,
          probVal
        }
      ]);
    }
  };

  const calculateParlayMetrics = () => {
    if (parlayPicks.length === 0) return { decimalOdds: 1.0, americanOdds: 'N/A', combinedProb: 0 };
    
    let combinedDecimal = 1.0;
    let combinedProbFrac = 1.0;

    parlayPicks.forEach((pick) => {
      combinedProbFrac *= (pick.probVal / 100.0);
      combinedDecimal *= parseOddsToDecimal(pick.oddsStr);
    });

    let american = '';
    if (combinedDecimal >= 2.0) {
      american = '+' + Math.round((combinedDecimal - 1.0) * 100);
    } else {
      american = '-' + Math.round(100 / (combinedDecimal - 1.0));
    }

    return {
      decimalOdds: combinedDecimal.toFixed(2),
      americanOdds: american,
      combinedProb: (combinedProbFrac * 100).toFixed(1)
    };
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0E131F] text-slate-100 flex items-center justify-center font-sans">
      <div className="text-center space-y-2">
        <div className="text-xl font-bold tracking-tight text-white">U.S. SOCCER SIMULATOR</div>
        <div className="text-xs text-slate-400 font-mono">Loading matchday schedule...</div>
      </div>
    </div>
  );

  const fixtures = data?.fixtures || [];
  const metadata = data?.metadata || {};
  const stats = metadata.stats || { correct_predictions: 0, total_predictions: 0, accuracy_pct: 0.0 };
  const allLeagues = ['ALL', 'MLS', 'USL Championship', 'USL League One', 'NWSL', 'MLS NEXT Pro', 'USL Super League'];
  
  // Filter by League & +EV threshold
  const filteredFixtures = fixtures.filter((fix) => {
    const matchesLeague = selectedLeague === 'ALL' || fix.league === selectedLeague;
    if (!matchesLeague) return false;

    if (showEVOnly) {
      const homeEV = calculateEV(fix.simulated_odds.probabilities.home, fix.simulated_odds.odds.home);
      const drawEV = calculateEV(fix.simulated_odds.probabilities.draw, fix.simulated_odds.odds.draw);
      const awayEV = calculateEV(fix.simulated_odds.probabilities.away, fix.simulated_odds.odds.away);
      return homeEV >= 2.0 || drawEV >= 2.0 || awayEV >= 2.0;
    }
    return true;
  });

  const parlayMetrics = calculateParlayMetrics();

  return (
    <div className="min-h-screen bg-[#0E131F] text-slate-100 font-sans p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <header className="bg-[#182032] border border-slate-700/60 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-700 text-white font-black text-xs flex items-center justify-center rounded uppercase tracking-wider">
                USA
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                U.S. Soccer Match Odds Simulator
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Monte Carlo Poisson engine with Dixon-Coles adjustments & +EV edge detection
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-[#0E131F] border border-slate-700/80 rounded-lg px-4 py-2 text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Model Accuracy</div>
              <div className="text-base font-bold text-slate-100 font-mono">
                {stats.accuracy_pct.toFixed(1)}% <span className="text-xs text-slate-400 font-normal">({stats.correct_predictions}/{stats.total_predictions})</span>
              </div>
            </div>
            <div className="bg-[#0E131F] border border-slate-700/80 rounded-lg px-4 py-2 text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active Slate</div>
              <div className="text-base font-bold text-slate-100 font-mono">{metadata.fixture_count || 0} Matches</div>
            </div>
          </div>
        </header>

        {/* League & EV Navigation Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {allLeagues.map((lg) => (
              <button
                key={lg}
                onClick={() => setSelectedLeague(lg)}
                className={
                  "px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap " +
                  (selectedLeague === lg
                    ? "bg-slate-100 text-slate-900 font-bold"
                    : "bg-[#182032] text-slate-400 hover:text-slate-200 border border-slate-700/60")
                }
              >
                {lg}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowEVOnly(!showEVOnly)}
            className={
              "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap border " +
              (showEVOnly
                ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20"
                : "bg-[#182032] text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10")
            }
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            {showEVOnly ? "Showing +EV Edges Only" : "Filter +EV Value Bets"}
          </button>
        </div>

        {/* Matchday Odds Slate */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white tracking-tight">Upcoming Fixtures</h2>
            <span className="text-xs text-slate-400 font-mono">
              Mode: {metadata.scraper_status || 'dixon_coles'}
            </span>
          </div>

          {filteredFixtures.length === 0 ? (
            <div className="bg-[#182032] border border-slate-700/60 rounded-xl p-8 text-center text-slate-400 text-sm">
              No active fixtures match the selected filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFixtures.map((fix) => {
                const homeEV = calculateEV(fix.simulated_odds.probabilities.home, fix.simulated_odds.odds.home);
                const drawEV = calculateEV(fix.simulated_odds.probabilities.draw, fix.simulated_odds.odds.draw);
                const awayEV = calculateEV(fix.simulated_odds.probabilities.away, fix.simulated_odds.odds.away);
                
                const hasEVEdge = homeEV >= 2.0 || drawEV >= 2.0 || awayEV >= 2.0;

                return (
                  <div key={fix.fixture_id} className={"bg-[#182032] border rounded-xl p-5 shadow-md flex flex-col justify-between transition-all " + (hasEVEdge ? "border-emerald-500/60 ring-1 ring-emerald-500/20" : "border-slate-700/60")}>
                    <div>
                      <div className="flex justify-between items-center mb-3 text-xs">
                        <span className="font-semibold text-red-400 uppercase tracking-wide">{fix.league}</span>
                        {hasEVEdge && (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            +EV Edge
                          </span>
                        )}
                        <span className="text-slate-400 font-mono">{new Date(fix.kickoff_iso).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="space-y-2 my-4">
                        <div className="flex justify-between items-center font-bold text-base text-white">
                          <span>{fix.home_team}</span>
                          <span className="text-xs text-slate-400 font-mono font-normal">xG {fix.simulated_odds.home_xg}</span>
                        </div>
                        <div className="text-center text-[10px] text-slate-500 font-semibold tracking-widest">VS</div>
                        <div className="flex justify-between items-center font-bold text-base text-white">
                          <span>{fix.away_team}</span>
                          <span className="text-xs text-slate-400 font-mono font-normal">xG {fix.simulated_odds.away_xg}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0E131F] p-3 rounded-lg border border-slate-800 mt-2">
                      <div className="grid grid-cols-3 text-center gap-1.5 font-mono text-xs">
                        
                        {/* HOME BUTTON WITH EV BADGE */}
                        <button
                          onClick={() => toggleParlayPick(fix, 'HOME', fix.simulated_odds.odds.home, fix.simulated_odds.probabilities.home)}
                          className={"p-2 rounded border transition-all text-left flex flex-col justify-between " + (
                            parlayPicks.some(p => p.fixture_id === fix.fixture_id && p.selectionType === 'HOME')
                              ? "bg-red-700 text-white border-red-500"
                              : homeEV >= 2.0
                                ? "bg-emerald-950/40 border-emerald-500/50 hover:border-emerald-400 text-slate-100"
                                : "bg-[#182032] border-slate-700 hover:border-slate-500 text-slate-200"
                          )}
                        >
                          <div>
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] text-slate-400 font-sans font-semibold">HOME</span>
                              {homeEV >= 2.0 && (
                                <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/20 px-1 rounded">+{homeEV.toFixed(1)}%</span>
                              )}
                            </div>
                            <div className="font-bold text-sm">{fix.simulated_odds.odds.home}</div>
                          </div>
                          <div className="text-[9px] text-slate-400 mt-1">{fix.simulated_odds.probabilities.home}%</div>
                        </button>

                        {/* DRAW BUTTON WITH EV BADGE */}
                        <button
                          onClick={() => toggleParlayPick(fix, 'DRAW', fix.simulated_odds.odds.draw, fix.simulated_odds.probabilities.draw)}
                          className={"p-2 rounded border transition-all text-left flex flex-col justify-between " + (
                            parlayPicks.some(p => p.fixture_id === fix.fixture_id && p.selectionType === 'DRAW')
                              ? "bg-amber-600 text-white border-amber-500"
                              : drawEV >= 2.0
                                ? "bg-emerald-950/40 border-emerald-500/50 hover:border-emerald-400 text-slate-100"
                                : "bg-[#182032] border-slate-700 hover:border-slate-500 text-slate-200"
                          )}
                        >
                          <div>
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] text-slate-400 font-sans font-semibold">DRAW</span>
                              {drawEV >= 2.0 && (
                                <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/20 px-1 rounded">+{drawEV.toFixed(1)}%</span>
                              )}
                            </div>
                            <div className="font-bold text-sm">{fix.simulated_odds.odds.draw}</div>
                          </div>
                          <div className="text-[9px] text-slate-400 mt-1">{fix.simulated_odds.probabilities.draw}%</div>
                        </button>

                        {/* AWAY BUTTON WITH EV BADGE */}
                        <button
                          onClick={() => toggleParlayPick(fix, 'AWAY', fix.simulated_odds.odds.away, fix.simulated_odds.probabilities.away)}
                          className={"p-2 rounded border transition-all text-left flex flex-col justify-between " + (
                            parlayPicks.some(p => p.fixture_id === fix.fixture_id && p.selectionType === 'AWAY')
                              ? "bg-blue-600 text-white border-blue-500"
                              : awayEV >= 2.0
                                ? "bg-emerald-950/40 border-emerald-500/50 hover:border-emerald-400 text-slate-100"
                                : "bg-[#182032] border-slate-700 hover:border-slate-500 text-slate-200"
                          )}
                        >
                          <div>
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] text-slate-400 font-sans font-semibold">AWAY</span>
                              {awayEV >= 2.0 && (
                                <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/20 px-1 rounded">+{awayEV.toFixed(1)}%</span>
                              )}
                            </div>
                            <div className="font-bold text-sm">{fix.simulated_odds.odds.away}</div>
                          </div>
                          <div className="text-[9px] text-slate-400 mt-1">{fix.simulated_odds.probabilities.away}%</div>
                        </button>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* Floating Parlay Slip */}
      {parlayPicks.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#182032] border-t border-slate-700 p-4 shadow-2xl z-50">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-red-700 text-white text-xs font-black px-2 py-0.5 rounded">PARLAY SLIP</span>
                <span className="text-sm font-bold text-white">{parlayPicks.length} {parlayPicks.length === 1 ? 'Leg' : 'Legs'} Selected</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {parlayPicks.map((p) => (
                  <span key={p.fixture_id} className="bg-[#0E131F] text-slate-300 text-xs px-2.5 py-1 rounded border border-slate-700 flex items-center gap-1 font-mono">
                    <span className="text-red-400 font-bold">{p.teamLabel}</span> ({p.oddsStr})
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Combined Odds</div>
                <div className="text-lg font-black text-amber-400 font-mono">{parlayMetrics.americanOdds}</div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Model Combined Prob</div>
                <div className="text-lg font-black text-slate-100 font-mono">{parlayMetrics.combinedProb}%</div>
              </div>

              <button
                onClick={() => setParlayPicks([])}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-2 rounded border border-slate-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
