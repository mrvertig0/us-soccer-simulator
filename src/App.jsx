import React, { useState, useEffect } from 'react';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState('ALL');
  const [activeMarketTabs, setActiveMarketTabs] = useState({}); // { [fixture_id]: 'ML' | 'TNB' | 'TOTALS' | 'SPREAD' | 'PROPS' }
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

  const setCardTab = (fixtureId, tabKey) => {
    setActiveMarketTabs((prev) => ({ ...prev, [fixtureId]: tabKey }));
  };

  const toggleParlayPick = (fixture, marketName, selectionLabel, oddsStr, probVal) => {
    const pickId = fixture.fixture_id + '_' + marketName + '_' + selectionLabel;
    const existingIndex = parlayPicks.findIndex((p) => p.pickId === pickId);

    if (existingIndex >= 0) {
      setParlayPicks(parlayPicks.filter((_, idx) => idx !== existingIndex));
    } else {
      const filtered = parlayPicks.filter((p) => !(p.fixture_id === fixture.fixture_id && p.marketName === marketName));
      setParlayPicks([
        ...filtered,
        {
          pickId,
          fixture_id: fixture.fixture_id,
          matchup: fixture.home_team + ' vs ' + fixture.away_team,
          marketName,
          selectionLabel,
          oddsStr,
          probVal
        }
      ]);
    }
  };

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

  const calculateParlayMetrics = () => {
    if (parlayPicks.length === 0) return { americanOdds: 'N/A', combinedProb: 0 };
    
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
      americanOdds: american,
      combinedProb: (combinedProbFrac * 100).toFixed(1)
    };
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0E131F] text-slate-100 flex items-center justify-center font-sans">
      <div className="text-center space-y-2">
        <div className="text-xl font-bold tracking-tight text-white">U.S. SOCCER SIMULATOR</div>
        <div className="text-xs text-slate-400 font-mono">Loading DraftKings 7-market slate...</div>
      </div>
    </div>
  );

  const fixtures = data?.fixtures || [];
  const metadata = data?.metadata || {};
  const allLeagues = ['ALL', 'MLS', 'USL Championship', 'USL League One', 'NWSL', 'MLS NEXT Pro', 'USL Super League'];
  const filteredFixtures = selectedLeague === 'ALL' ? fixtures : fixtures.filter(f => f.league === selectedLeague);
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
              DraftKings 7-Market Odds Matrix & Monte Carlo Model Engine
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-[#0E131F] border border-slate-700/80 rounded-lg px-4 py-2 text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Model Status</div>
              <div className="text-base font-bold text-emerald-400 font-mono">DK Markets Active</div>
            </div>
            <div className="bg-[#0E131F] border border-slate-700/80 rounded-lg px-4 py-2 text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active Slate</div>
              <div className="text-base font-bold text-slate-100 font-mono">{metadata.fixture_count || 0} Matches</div>
            </div>
          </div>
        </header>

        {/* League Navigation Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
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

        {/* Matchday Odds Slate */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white tracking-tight">Upcoming Fixtures</h2>
            <span className="text-xs text-slate-400 font-mono">
              Scraped: {metadata.generated_at ? new Date(metadata.generated_at).toLocaleTimeString() : 'N/A'}
            </span>
          </div>

          {filteredFixtures.length === 0 ? (
            <div className="bg-[#182032] border border-slate-700/60 rounded-xl p-8 text-center text-slate-400 text-sm">
              No active fixtures currently listed for {selectedLeague}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFixtures.map((fix) => {
                const activeTab = activeMarketTabs[fix.fixture_id] || 'ML';
                const dk = fix.dk_markets || {};
                const ml = dk.moneyline || { home: { prob: 50, american: '-110' }, draw: { prob: 25, american: '+240' }, away: { prob: 25, american: '+280' } };
                const tnb = dk.tie_no_bet || { home: { prob: 66, american: '-200' }, away: { prob: 34, american: '+150' } };
                const totals = dk.totals || { over_2_5: { prob: 55, american: '-120' }, under_2_5: { prob: 45, american: '+100' } };
                const spread = dk.spread || { home_minus_1_5: { prob: 32, american: '+180' }, away_plus_1_5: { prob: 68, american: '-220' } };
                const playerProps = dk.player_props || [];

                return (
                  <div key={fix.fixture_id} className="bg-[#182032] border border-slate-700/60 rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4">
                    
                    {/* Card Header */}
                    <div>
                      <div className="flex justify-between items-center mb-3 text-xs">
                        <span className="font-bold text-red-400 uppercase tracking-wide">{fix.league}</span>
                        <span className="text-slate-400 font-mono">{new Date(fix.kickoff_iso).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center font-bold text-base text-white">
                          <span>{fix.home_team}</span>
                          <span className="text-xs text-slate-400 font-mono font-normal">xG {dk.home_xg || '1.40'}</span>
                        </div>
                        <div className="text-center text-[10px] text-slate-500 font-semibold tracking-widest">VS</div>
                        <div className="flex justify-between items-center font-bold text-base text-white">
                          <span>{fix.away_team}</span>
                          <span className="text-xs text-slate-400 font-mono font-normal">xG {dk.away_xg || '1.40'}</span>
                        </div>
                      </div>
                    </div>

                    {/* DraftKings Card Market Selector Tabs */}
                    <div className="bg-[#0E131F] p-3 rounded-lg border border-slate-800 space-y-3">
                      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800 pb-2">
                        {[
                          { key: 'ML', label: 'Moneyline' },
                          { key: 'TNB', label: 'Tie No Bet' },
                          { key: 'TOTALS', label: 'Totals' },
                          { key: 'SPREAD', label: 'Spread' },
                          { key: 'PROPS', label: 'Player Props' }
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            onClick={() => setCardTab(fix.fixture_id, tab.key)}
                            className={
                              "px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all whitespace-nowrap " +
                              (activeTab === tab.key
                                ? "bg-red-700 text-white"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800")
                            }
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* TAB 1: MONEYLINE */}
                      {activeTab === 'ML' && (
                        <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                          {[
                            { label: 'HOME', data: ml.home },
                            { label: 'DRAW', data: ml.draw },
                            { label: 'AWAY', data: ml.away }
                          ].map((item) => (
                            <button
                              key={item.label}
                              onClick={() => toggleParlayPick(fix, 'Moneyline', item.label, item.data.american, item.data.prob)}
                              className={"p-2 rounded border transition-all text-center " + (
                                parlayPicks.some(p => p.fixture_id === fix.fixture_id && p.selectionLabel === item.label)
                                  ? "bg-red-700 text-white border-red-500"
                                  : "bg-[#182032] border-slate-700 hover:border-slate-500 text-slate-200"
                              )}
                            >
                              <div className="text-[9px] text-slate-400 font-sans font-semibold">{item.label}</div>
                              <div className="font-bold text-sm">{item.data.american}</div>
                              <div className="text-[9px] text-slate-400">{item.data.prob}%</div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* TAB 2: TIE NO BET */}
                      {activeTab === 'TNB' && (
                        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                          {[
                            { label: fix.home_team + ' (TNB)', data: tnb.home },
                            { label: fix.away_team + ' (TNB)', data: tnb.away }
                          ].map((item) => (
                            <button
                              key={item.label}
                              onClick={() => toggleParlayPick(fix, 'Tie No Bet', item.label, item.data.american, item.data.prob)}
                              className="p-2 rounded border border-slate-700 bg-[#182032] hover:border-slate-500 text-slate-200 text-center"
                            >
                              <div className="text-[9px] text-slate-400 font-sans truncate">{item.label}</div>
                              <div className="font-bold text-sm">{item.data.american}</div>
                              <div className="text-[9px] text-slate-400">{item.data.prob}%</div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* TAB 3: TOTAL GOALS */}
                      {activeTab === 'TOTALS' && (
                        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                          <button
                            onClick={() => toggleParlayPick(fix, 'Total Goals', 'Over 2.5', totals.over_2_5.american, totals.over_2_5.prob)}
                            className="p-2 rounded border border-slate-700 bg-[#182032] hover:border-slate-500 text-slate-200 text-center"
                          >
                            <div className="text-[9px] text-slate-400 font-sans">OVER 2.5 GOALS</div>
                            <div className="font-bold text-sm">{totals.over_2_5.american}</div>
                            <div className="text-[9px] text-slate-400">{totals.over_2_5.prob}%</div>
                          </button>
                          <button
                            onClick={() => toggleParlayPick(fix, 'Total Goals', 'Under 2.5', totals.under_2_5.american, totals.under_2_5.prob)}
                            className="p-2 rounded border border-slate-700 bg-[#182032] hover:border-slate-500 text-slate-200 text-center"
                          >
                            <div className="text-[9px] text-slate-400 font-sans">UNDER 2.5 GOALS</div>
                            <div className="font-bold text-sm">{totals.under_2_5.american}</div>
                            <div className="text-[9px] text-slate-400">{totals.under_2_5.prob}%</div>
                          </button>
                        </div>
                      )}

                      {/* TAB 4: SPREAD */}
                      {activeTab === 'SPREAD' && (
                        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                          <button
                            onClick={() => toggleParlayPick(fix, 'Spread', fix.home_team + ' -1.5', spread.home_minus_1_5.american, spread.home_minus_1_5.prob)}
                            className="p-2 rounded border border-slate-700 bg-[#182032] hover:border-slate-500 text-slate-200 text-center"
                          >
                            <div className="text-[9px] text-slate-400 font-sans truncate">{fix.home_team} -1.5</div>
                            <div className="font-bold text-sm">{spread.home_minus_1_5.american}</div>
                            <div className="text-[9px] text-slate-400">{spread.home_minus_1_5.prob}%</div>
                          </button>
                          <button
                            onClick={() => toggleParlayPick(fix, 'Spread', fix.away_team + ' +1.5', spread.away_plus_1_5.american, spread.away_plus_1_5.prob)}
                            className="p-2 rounded border border-slate-700 bg-[#182032] hover:border-slate-500 text-slate-200 text-center"
                          >
                            <div className="text-[9px] text-slate-400 font-sans truncate">{fix.away_team} +1.5</div>
                            <div className="font-bold text-sm">{spread.away_plus_1_5.american}</div>
                            <div className="text-[9px] text-slate-400">{spread.away_plus_1_5.prob}%</div>
                          </button>
                        </div>
                      )}

                      {/* TAB 5: PLAYER PROPS */}
                      {activeTab === 'PROPS' && (
                        <div className="space-y-2 text-xs font-mono">
                          {playerProps.length === 0 ? (
                            <div className="text-center text-slate-500 py-2 font-sans text-[11px]">No player prop data listed for this fixture.</div>
                          ) : (
                            playerProps.map((pl, idx) => (
                              <div key={idx} className="bg-[#182032] p-2 rounded border border-slate-700 space-y-1.5">
                                <div className="flex justify-between items-center text-[10px] font-sans font-bold text-slate-200">
                                  <span>{pl.player_name}</span>
                                  <span className="text-slate-400 font-normal">{pl.team}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1 text-[10px] text-center">
                                  <button
                                    onClick={() => toggleParlayPick(fix, 'Anytime Goal', pl.player_name, pl.anytime_goalscorer.american, pl.anytime_goalscorer.prob)}
                                    className="p-1 rounded bg-[#0E131F] border border-slate-800 hover:border-slate-600"
                                  >
                                    <div className="text-[8px] text-slate-400 font-sans">GOAL</div>
                                    <div className="font-bold text-emerald-400">{pl.anytime_goalscorer.american}</div>
                                  </button>
                                  <button
                                    onClick={() => toggleParlayPick(fix, 'Anytime Assist', pl.player_name, pl.anytime_assist.american, pl.anytime_assist.prob)}
                                    className="p-1 rounded bg-[#0E131F] border border-slate-800 hover:border-slate-600"
                                  >
                                    <div className="text-[8px] text-slate-400 font-sans">ASSIST</div>
                                    <div className="font-bold text-sky-400">{pl.anytime_assist.american}</div>
                                  </button>
                                  <button
                                    onClick={() => toggleParlayPick(fix, 'Shots > 2.5', pl.player_name, pl.shots_over_25.american, pl.shots_over_25.prob)}
                                    className="p-1 rounded bg-[#0E131F] border border-slate-800 hover:border-slate-600"
                                  >
                                    <div className="text-[8px] text-slate-400 font-sans">SHOTS &gt; 2.5</div>
                                    <div className="font-bold text-amber-400">{pl.shots_over_25.american}</div>
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* Parlay Builder Slip */}
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
                  <span key={p.pickId} className="bg-[#0E131F] text-slate-300 text-xs px-2.5 py-1 rounded border border-slate-700 flex items-center gap-1 font-mono">
                    <span className="text-slate-400 text-[10px] uppercase font-sans">{p.marketName}:</span>
                    <span className="text-red-400 font-bold">{p.selectionLabel}</span> ({p.oddsStr})
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
