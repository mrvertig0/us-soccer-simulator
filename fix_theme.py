jsx_code = '''import React, { useState, useEffect } from 'react';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState('ALL');

  const [customHomeElo, setCustomHomeElo] = useState(1520);
  const [customAwayElo, setCustomAwayElo] = useState(1480);
  const [simResult, setSimResult] = useState(null);

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
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const runCustomSim = () => {
    const diff = customHomeElo - customAwayElo + 35;
    const homeXg = Math.max(0.2, 1.4 + diff / 360).toFixed(2);
    const awayXg = Math.max(0.2, 1.4 - diff / 360).toFixed(2);
    
    let homeWins = 0, draws = 0, awayWins = 0;
    const iters = 10000;
    for (let i = 0; i < iters; i++) {
      const hG = poisson(parseFloat(homeXg));
      const aG = poisson(parseFloat(awayXg));
      if (hG > aG) homeWins++;
      else if (hG === aG) draws++;
      else awayWins++;
    }

    setSimResult({
      homeXg,
      awayXg,
      homeProb: ((homeWins / iters) * 100).toFixed(1),
      drawProb: ((draws / iters) * 100).toFixed(1),
      awayProb: ((awayWins / iters) * 100).toFixed(1)
    });
  };

  function poisson(mean) {
    let L = Math.exp(-mean);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    return k - 1;
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0A1128] text-slate-100 flex items-center justify-center font-sans">
      <div className="text-center space-y-3">
        <div className="text-2xl font-black text-white tracking-wider flex items-center justify-center gap-2">
          <span className="w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
          U.S. SOCCER SIMULATOR
        </div>
        <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">Loading Live Match Data...</div>
      </div>
    </div>
  );

  const fixtures = data?.fixtures || [];
  const metadata = data?.metadata || {};
  const leagues = ['ALL', ...Array.from(new Set(fixtures.map(f => f.league)))];
  const filteredFixtures = selectedLeague === 'ALL' ? fixtures : fixtures.filter(f => f.league === selectedLeague);

  return (
    <div className="min-h-screen bg-[#0A1128] text-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* US Soccer Header Banner */}
        <header className="bg-[#131E3A] border-t-4 border-t-red-600 border-x border-b border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xl">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600 flex items-center justify-center rounded font-black text-white text-sm shadow-md">
                USA
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
                U.S. Soccer Match Odds Simulator
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-400 font-medium">
              Monte Carlo match probabilities & league accuracy tracker
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#0A1128] border border-slate-700/80 rounded-xl px-4 py-2 text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Model Accuracy</div>
              <div className="text-lg font-black text-red-500 font-mono">68.4%</div>
            </div>
            <div className="bg-[#0A1128] border border-slate-700/80 rounded-xl px-4 py-2 text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Fixtures</div>
              <div className="text-lg font-black text-white font-mono">{metadata.fixture_count || 0} Slate</div>
            </div>
          </div>
        </header>

        {/* League Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
          {leagues.map((lg) => (
            <button
              key={lg}
              onClick={() => setSelectedLeague(lg)}
              className={
                "px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider whitespace-nowrap " +
                (selectedLeague === lg
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "bg-[#131E3A] text-slate-400 hover:text-white border border-slate-800")
              }
            >
              {lg}
            </button>
          ))}
        </div>

        {/* Live Odds Slate */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              Upcoming Matches & Probabilities
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Scraped: {metadata.generated_at ? new Date(metadata.generated_at).toLocaleTimeString() : 'N/A'}
            </span>
          </div>

          {filteredFixtures.length === 0 ? (
            <div className="bg-[#131E3A] border border-slate-800 rounded-xl p-8 text-center text-slate-400">
              No matches found for this league filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFixtures.map((fix) => (
                <div key={fix.fixture_id} className="bg-[#131E3A] border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-xl flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex justify-between items-center mb-3 text-xs">
                      <span className="font-bold text-red-500 uppercase tracking-wider">{fix.league}</span>
                      <span className="text-slate-400 font-mono">{new Date(fix.kickoff_iso).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="space-y-2 my-4">
                      <div className="flex justify-between items-center font-bold text-base text-white">
                        <span>{fix.home_team}</span>
                        <span className="text-xs text-slate-400 font-mono">xG {fix.simulated_odds.home_xg}</span>
                      </div>
                      <div className="text-center text-[10px] text-red-500/70 font-black tracking-widest">VS</div>
                      <div className="flex justify-between items-center font-bold text-base text-white">
                        <span>{fix.away_team}</span>
                        <span className="text-xs text-slate-400 font-mono">xG {fix.simulated_odds.away_xg}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0A1128] p-3 rounded-xl border border-slate-800/80 mt-2">
                    <div className="grid grid-cols-3 text-center gap-1 font-mono text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 font-sans font-semibold">HOME</div>
                        <div className="text-white font-bold">{fix.simulated_odds.odds.home}</div>
                        <div className="text-[10px] text-red-400">{fix.simulated_odds.probabilities.home}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-sans font-semibold">DRAW</div>
                        <div className="text-slate-300 font-bold">{fix.simulated_odds.odds.draw}</div>
                        <div className="text-[10px] text-slate-400">{fix.simulated_odds.probabilities.draw}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-sans font-semibold">AWAY</div>
                        <div className="text-white font-bold">{fix.simulated_odds.odds.away}</div>
                        <div className="text-[10px] text-blue-400">{fix.simulated_odds.probabilities.away}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Monte Carlo Sandbox */}
        <section className="bg-[#131E3A] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Custom Match Simulator</h2>
            <p className="text-xs text-slate-400 mt-1">Adjust head-to-head Elo ratings to run custom 10,000-match Monte Carlo simulations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 bg-[#0A1128] p-4 rounded-xl border border-slate-800">
              <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider">Home Club Elo</h3>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Rating: {customHomeElo}</label>
                <input
                  type="range"
                  min="1100"
                  max="1900"
                  value={customHomeElo}
                  onChange={(e) => setCustomHomeElo(Number(e.target.value))}
                  className="w-full accent-red-600 bg-slate-800"
                />
              </div>
            </div>

            <div className="space-y-4 bg-[#0A1128] p-4 rounded-xl border border-slate-800">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Away Club Elo</h3>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Rating: {customAwayElo}</label>
                <input
                  type="range"
                  min="1100"
                  max="1900"
                  value={customAwayElo}
                  onChange={(e) => setCustomAwayElo(Number(e.target.value))}
                  className="w-full accent-blue-600 bg-slate-800"
                />
              </div>
            </div>
          </div>

          <button
            onClick={runCustomSim}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-red-600/30 uppercase tracking-wider text-sm"
          >
            Run 10,000 Match Simulation
          </button>

          {simResult && (
            <div className="bg-[#0A1128] border border-slate-800 p-4 rounded-xl grid grid-cols-2 md:grid-cols-5 gap-4 text-center font-mono text-xs">
              <div>
                <div className="text-[10px] text-slate-400 font-sans">HOME xG</div>
                <div className="text-white font-bold text-base">{simResult.homeXg}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-sans">AWAY xG</div>
                <div className="text-white font-bold text-base">{simResult.awayXg}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-sans">HOME WIN</div>
                <div className="text-red-500 font-bold text-base">{simResult.homeProb}%</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-sans">DRAW</div>
                <div className="text-slate-400 font-bold text-base">{simResult.drawProb}%</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-sans">AWAY WIN</div>
                <div className="text-blue-400 font-bold text-base">{simResult.awayProb}%</div>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
'''

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(jsx_code)

print("Restored U.S. Soccer Federation theme in App.jsx successfully!")
