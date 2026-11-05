import React, { useState, useEffect } from 'react';

export default function App() {
  const [data, setData] = useState(null);
  const [modelStats, setModelStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState('ALL');
  const [activeMarketTabs, setActiveMarketTabs] = useState({});
  const [showDkCompare, setShowDkCompare] = useState({});
  const [customDkLines, setCustomDkLines] = useState({});
  const [parlayPicks, setParlayPicks] = useState([]);

  const fetchAppData = () => {
    setLoading(true);
    Promise.all([
      fetch('/data/upcoming_odds.json?t=' + Date.now()).then((res) => {
        if (!res.ok) throw new Error('HTTP error! status: ' + res.status);
        return res.json();
      }),
      fetch('/data/model_stats.json?t=' + Date.now())
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null)
    ])
      .then(([oddsData, statsData]) => {
        setData(oddsData);
        if (statsData) setModelStats(statsData);
        setLoading(false);
        setRefreshing(false);
      })
      .catch((err) => {
        console.error('Failed to load match data:', err);
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchAppData();
  }, []);

  const handleManualScrapeTrigger = () => {
    const userConfirmed = window.confirm(
      "WARNING: Manual Scrape Requested\n\n" +
      "Manual updates re-query live ESPN API endpoints and replace current match lines. " +
      "Please only trigger a manual update if necessary.\n\n" +
      "Do you want to execute a fresh data update now?"
    );
    if (!userConfirmed) return;
    setRefreshing(true);
    setTimeout(() => {
      fetchAppData();
    }, 1200);
  };

  const setCardTab = (fixtureId, tabKey) => {
    setActiveMarketTabs((prev) => ({ ...prev, [fixtureId]: tabKey }));
  };

  const toggleDkCompare = (fixtureId) => {
    setShowDkCompare((prev) => ({ ...prev, [fixtureId]: !prev[fixtureId] }));
  };

  const updateDkLine = (key, val) => {
    setCustomDkLines((prev) => ({ ...prev, [key]: val }));
  };

  // Local Logo Path Helper with Comprehensive Mapping Dictionary
  function getTeamLogoPath(teamName) {
    if (!teamName) return '/logos/default.png';

    const customLogos = {
      // NWSL & USL Women
      'Tampa Bay Sun FC': '/logos/tampa_bay_sun.png',
      'San Diego Wave FC': '/logos/san_diego_wave_fc.svg',
      'Angel City FC': '/logos/angel_city_fc.png',
      'Bay FC': '/logos/bay_fc.svg',
      'Boston Legacy': '/logos/boston_legacy.svg',
      'Boston Fleet': '/logos/boston_legacy.svg',
      'Brooklyn FC': '/logos/brooklyn_fc.svg',
      'Carolina Ascent FC': '/logos/carolina_ascent_fc.png',
      'Chicago Stars': '/logos/chicago_stars.svg',
      'Chicago Red Stars': '/logos/chicago_stars.svg',
      'Dallas Trinity FC': '/logos/dallas_trinity_fc.png',
      'DC Power FC': '/logos/dc_power_fc.png',
      'Fort Lauderdale United FC': '/logos/fort_lauderdale_united_fc.png',
      'Gotham FC': '/logos/gotham_fc.png',
      'NJ/NY Gotham FC': '/logos/gotham_fc.png',
      'Houston Dash': '/logos/houston_dash.png',
      'Kansas City Current': '/logos/kansas_city_current.png',
      'North Carolina Courage': '/logos/north_carolina_courage.png',
      'Orlando Pride': '/logos/orlando_pride.png',
      'Portland Thorns FC': '/logos/portland_thorns_fc.png',
      'Racing Louisville FC': '/logos/racing_louisville_fc.png',
      'Seattle Reign FC': '/logos/seattle_reign_fc.png',
      'Utah Royals': '/logos/utah_royals.png',
      'Washington Spirit': '/logos/washington_spirit.svg',

      // MLS, USL, MLSNP Men & Expansion Sides
      'Atlanta United FC': '/logos/atlanta_united_fc.png',
      'Atlanta United 2': '/logos/atlanta_united_2.svg',
      'Austin FC': '/logos/austin_fc.png',
      'Austin FC II': '/logos/austin_fc_2.svg',
      'AV Alta FC': '/logos/av_alta_fc.png',
      'Birmingham Legion FC': '/logos/birmingham_legion_fc.svg',
      'Charleston Battery': '/logos/charleston_battery.png',
      'Charlotte FC': '/logos/charlotte_fc.png',
      'Charlotte Independence': '/logos/charlotte_independence.svg',
      'Chattanooga FC': '/logos/chattanooga_fc.svg',
      'Chattanooga Red Wolves': '/logos/chattanooga_red_wolves_sc.svg',
      'Chattanooga Red Wolves SC': '/logos/chattanooga_red_wolves_sc.svg',
      'Chicago Fire FC': '/logos/chicago_fire_fc.png',
      'Chicago Fire FC II': '/logos/chicago_fire_fc_2.png',
      'Colorado Rapids': '/logos/colorado_rapids.png',
      'Colorado Rapids 2': '/logos/colorado_rapids_2.png',
      'Colorado Springs Switchbacks FC': '/logos/colorado_springs_switchbacks_fc.png',
      'Columbus Crew': '/logos/columbus_crew.png',
      'Columbus Crew 2': '/logos/columbus_crew_2.png',
      'Crown Legacy FC': '/logos/crown_legacy_fc.png',
      'CT United FC': '/logos/ct_united_fc.png',
      'D.C. United': '/logos/dc_united.png',
      'Detroit City FC': '/logos/detroit_city_fc.png',
      'El Paso Locomotive FC': '/logos/el_paso_locomotive_fc.png',
      'FC Cincinnati': '/logos/fc_cincinnati.png',
      'FC Cincinnati 2': '/logos/fc_cincinnati_2.png',
      'FC Dallas': '/logos/fc_dallas.png',
      'FC Tulsa': '/logos/fc_tulsa.png',
      'Forward Madison FC': '/logos/forward_madison_fc.png',
      'Greenville Triumph SC': '/logos/greenville_triumph_sc.png',
      'Hartford Athletic': '/logos/hartford_athletic.png',
      'Houston Dynamo FC': '/logos/houston_dynamo_fc.png',
      'Houston Dynamo 2': '/logos/houston_dynamo_fc_2.png',
      'Huntsville City FC': '/logos/huntsville_city_fc.png',
      'Indy Eleven': '/logos/indy_eleven.png',
      'Inter Miami CF': '/logos/inter_miami_cf.png',
      'Inter Miami CF II': '/logos/inter_miami_cf_2.png',
      'LA Galaxy': '/logos/la_galaxy.png',
      'LA Galaxy II': '/logos/la_galaxy_2.png',
      'Las Vegas Lights FC': '/logos/las_vegas_lights_fc.png',
      'Lexington SC': '/logos/lexington_sc.png',
      'Los Angeles FC': '/logos/los_angeles_fc.png',
      'LAFC': '/logos/los_angeles_fc.png',
      'Los Angeles FC 2': '/logos/los_angeles_fc_2.png',
      'Loudoun United FC': '/logos/loudoun_united_fc.png',
      'Louisville City FC': '/logos/lousiville_city_fc.png',
      'Lousiville City FC': '/logos/lousiville_city_fc.png',
      'Miami FC': '/logos/miami_fc.png',
      'Minnesota United FC': '/logos/minnesota_united_fc.png',
      'Minnesota United FC 2': '/logos/minnesota_united_fc_2.png',
      'Monterey Bay FC': '/logos/monterey_bay_fc.png',
      'Nashville SC': '/logos/nashville_sc.svg',
      'New England Revolution': '/logos/new_england_revolution.png',
      'New England Revolution II': '/logos/new_england_revolution_2.png',
      'New Mexico United': '/logos/new_mexico_united.svg',
      'New York City FC': '/logos/new_york_city_fc.png',
      'NYCFC': '/logos/new_york_city_fc.png',
      'New York City FC II': '/logos/new_york_city_fc_2.png',
      'New York Red Bulls': '/logos/new_york_red_bulls.png',
      'Red Bull New York': '/logos/new_york_red_bulls.png',
      'New York Red Bulls II': '/logos/new_york_red_bulls_2.png',
      'Oakland Roots SC': '/logos/oakland_roots_sc.png',
      'One Knoxville SC': '/logos/one_knoxville_sc.png',
      'Orange County SC': '/logos/orange_county_sc.png',
      'Orlando City SC': '/logos/orlando_city_sc.png',
      'Orlando City B': '/logos/orlando_city_sc_b.svg',
      'Philadelphia Union': '/logos/philadelphia_union.png',
      'Philadelphia Union II': '/logos/philadelphia_union_2.png',
      'Phoenix Rising FC': '/logos/phoenix_rising_fc.svg',
      'Pittsburgh Riverhounds SC': '/logos/pittsburgh_riverhounds_sc.png',
      'Portland Hearts of Pine': '/logos/portland_hearts_of_pine.png',
      'Portland Thorns FC': '/logos/portland_thorns_fc.png',
      'Portland Timbers': '/logos/portland_timbers.png',
      'Portland Timbers 2': '/logos/portland_timbers_2.svg',
      'Real Monarchs': '/logos/real_monarchs.svg',
      'Real Salt Lake': '/logos/real_salt_lake.png',
      'Rhode Island FC': '/logos/rhode_island_fc.png',
      'Richmond Kickers': '/logos/richmond_kickers.svg',
      'Sacramento Republic FC': '/logos/sacramento_republic_fc.png',
      'San Antonio FC': '/logos/san_antonio_fc.png',
      'San Diego FC': '/logos/san_diego_fc.svg',
      'San Jose Earthquakes': '/logos/san_jose_earthquakes.png',
      'San Jose Earthquakes II': '/logos/san_jose_earthquakes_2.png',
      'Seattle Sounders FC': '/logos/seattle_sounders_fc.svg',
      'Spokane Velocity': '/logos/spokane_velocity.png',
      'Sporting Kansas City': '/logos/sporting_kansas_city.png',
      'Sporting KC II': '/logos/sporting_kansas_city_2.svg',
      'St. Louis CITY SC': '/logos/st_louis_city_sc.svg',
      'St. Louis City 2': '/logos/st_louis_city_sc_2.png',
      'Tacoma Defiance': '/logos/tacoma_defiance.png',
      'Tampa Bay Rowdies': '/logos/tampa_bay_rowdies.png',
      'Tampa Bay Sun': '/logos/tampa_bay_sun.png',
      'Toronto FC': '/logos/toronto_fc.png',
      'Toronto FC II': '/logos/toronto_fc_2.svg',
      'Union Omaha': '/logos/union_omaha.png',
      'Vancouver Whitecaps FC': '/logos/vancouver_whitecaps.png',
      'Whitecaps FC 2': '/logos/vancouver_whitecaps_2.png',
      'Ventura County FC': '/logos/ventura_county_fc.png',
      'CF Montreal': '/logos/cf_montreal.webp',
      'CF Montréal': '/logos/cf_montreal.webp',
      'Athletic Club Boise': '/logos/athletic_club_boise.webp'
    };

    if (customLogos[teamName]) {
      return customLogos[teamName];
    }

    const slug = teamName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
    return `/logos/${slug}.png`;
  }

  // Exact Team Hex Color Helper (Defaults to #FFFFFF if unlisted)
  function getTeamColor(teamName) {
    if (!teamName) return '#FFFFFF';

    const teamHexMap = {
      // MLS
      'Atlanta United FC': '#80000A',
      'Austin FC': '#00B140',
      'Charlotte FC': '#1A85C8',
      'Chicago Fire FC': '#7CCDEF',
      'FC Cincinnati': '#F05323',
      'Colorado Rapids': '#960A2C',
      'Columbus Crew': '#FEDD00',
      'D.C. United': '#000000',
      'FC Dallas': '#E81F3E',
      'Houston Dynamo FC': '#F4911E',
      'Inter Miami CF': '#F7B5CD',
      'LA Galaxy': '#00245D',
      'Los Angeles FC': '#C39E6D',
      'LAFC': '#C39E6D',
      'Minnesota United FC': '#8CD2F4',
      'Nashville SC': '#ECE83A',
      'New England Revolution': '#0A2240',
      'New York City FC': '#6CACE4',
      'NYCFC': '#6CACE4',
      'New York Red Bulls': '#ED1E36',
      'Red Bull New York': '#ED1E36',
      'Orlando City SC': '#633492',
      'Philadelphia Union': '#071B2C',
      'Portland Timbers': '#00482B',
      'Real Salt Lake': '#B30838',
      'San Diego FC': '#051C2C',
      'San Jose Earthquakes': '#0067B1',
      'Seattle Sounders FC': '#61D332',
      'Sporting Kansas City': '#002F65',
      'St. Louis CITY SC': '#001837',
      'Toronto FC': '#B81137',
      'Vancouver Whitecaps FC': '#00245E',

      // USL Championship
      'Birmingham Legion FC': '#A28D5B',
      'Charleston Battery': '#FECB00',
      'Colorado Springs Switchbacks FC': '#00AEEF',
      'Detroit City FC': '#431211',
      'El Paso Locomotive FC': '#031D40',
      'FC Tulsa': '#BE9C60',
      'Hartford Athletic': '#009A4D',
      'Indy Eleven': '#14213A',
      'Las Vegas Lights FC': '#EE378B',
      'Loudoun United FC': '#EC222F',
      'Louisville City FC': '#400079',
      'Lousiville City FC': '#400079',
      'Miami FC': '#F03E1E',
      'Monterey Bay FC': '#03FEF7',
      'New Mexico United': '#FCF000',
      'North Carolina FC': '#AB0433',
      'Oakland Roots SC': '#000000',
      'Orange County SC': '#FF6720',
      'Phoenix Rising FC': '#EC1C24',
      'Pittsburgh Riverhounds SC': '#FFC72A',
      'Rhode Island FC': '#071A35',
      'Sacramento Republic FC': '#E8D3A2',
      'San Antonio FC': '#000000',
      'Tampa Bay Rowdies': '#4A8B2C',

      // MLS NEXT Pro & Reserve Sides
      'Chattanooga FC': '#002D56',
      'Huntsville City FC': '#0F1145',
      'Carolina Core FC': '#FD5101',
      'Ventura County FC': '#00245E',
      'Atlanta United 2': '#80000A',
      'Austin FC II': '#00B140',
      'Chicago Fire FC II': '#7CCDEF',
      'Colorado Rapids 2': '#960A2C',
      'Columbus Crew 2': '#FEDD00',
      'Crown Legacy FC': '#1A85C8',
      'FC Cincinnati 2': '#F05323',
      'Houston Dynamo 2': '#F4911E',
      'Inter Miami CF II': '#F7B5CD',
      'LA Galaxy II': '#00245D',
      'Los Angeles FC 2': '#C39E6D',
      'Minnesota United FC 2': '#8CD2F4',
      'New England Revolution II': '#0A2240',
      'New York City FC II': '#6CACE4',
      'New York Red Bulls II': '#ED1E36',
      'Orlando City B': '#633492',
      'Philadelphia Union II': '#071B2C',
      'Portland Timbers 2': '#00482B',
      'Real Monarchs': '#B30838',
      'San Jose Earthquakes II': '#0067B1',
      'Tacoma Defiance': '#61D332',
      'Sporting KC II': '#002F65',
      'St. Louis City 2': '#001837',
      'Toronto FC II': '#B81137',
      'Whitecaps FC 2': '#00245E',

      // USL League One
      'Antelope Valley United FC': '#13322B',
      'AV Alta FC': '#13322B',
      'Central Valley Fuego FC': '#60A511',
      'Charlotte Independence': '#DDCBA4',
      'Chattanooga Red Wolves SC': '#730B12',
      'Chattanooga Red Wolves': '#730B12',
      'Forward Madison FC': '#EF95CF',
      'Greenville Triumph SC': '#60A845',
      'Lexington SC': '#00FF1E',
      'One Knoxville SC': '#ECE7CF',
      'Union Omaha': '#D2FE01',
      'Portland Hearts of Pine': '#293D2A',
      'Richmond Kickers': '#E31735',
      'Spokane Velocity': '#0097B7',
      'South Georgia Tormenta FC': '#C5004C',
      'Athletic Club Boise': '#228848',

      // NWSL
      'Angel City FC': '#FFB3AB',
      'Bay FC': '#051C2C',
      'Boston Legacy': '#26D07C',
      'Boston Fleet': '#26D07C',
      'Chicago Stars': '#41B6E6',
      'Chicago Red Stars': '#41B6E6',
      'Houston Dash': '#FF6900',
      'Kansas City Current': '#64CCC9',
      'NJ/NY Gotham FC': '#9ADBE8',
      'Gotham FC': '#9ADBE8',
      'North Carolina Courage': '#01426A',
      'Orlando Pride': '#5F249F',
      'Portland Thorns FC': '#C8102E',
      'Racing Louisville FC': '#C5B4E3',
      'San Diego Wave FC': '#E31C79',
      'Seattle Reign FC': '#292431',
      'Utah Royals': '#00205B',
      'Washington Spirit': '#EDE939',

      // USL Super League
      'Brooklyn FC': '#000000',
      'Carolina Ascent FC': '#445CC7',
      'Dallas Trinity FC': '#54052B',
      'Fort Lauderdale United FC': '#003087',
      'Tampa Bay Sun FC': '#FBDF49',
      'Tampa Bay Sun': '#FBDF49',
      'DC Power FC': '#197CE2',

      // CF Montreal variants
      'CF Montreal': '#00245E',
      'CF Montréal': '#00245E'
    };

    return teamHexMap[teamName] || '#FFFFFF';
  }

  function parseOddsToDecimal(oddsStr) {
    if (typeof oddsStr === 'number') return oddsStr;
    const str = String(oddsStr || '').trim();
    if (str.startsWith('+')) {
      return 1.0 + (parseFloat(str.replace('+', '')) / 100.0);
    } else if (str.startsWith('-')) {
      const val = parseFloat(str.replace('-', ''));
      return val > 0 ? 1.0 + (100.0 / val) : 1.0;
    }
    const parsed = parseFloat(str);
    return isNaN(parsed) || parsed <= 1.0 ? 1.0 : parsed;
  }

  function calculateEV(modelProbPct, bookOddsStr) {
    if (!bookOddsStr || bookOddsStr.trim() === '') return null;
    const p = modelProbPct / 100.0;
    const decOdds = parseOddsToDecimal(bookOddsStr);
    const ev = (p * decOdds) - 1.0;
    return (ev * 100.0).toFixed(1);
  }

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
    <div className="min-h-screen bg-[#05070B] text-slate-100 flex items-center justify-center font-sans">
      <div className="text-center space-y-2">
        <div className="text-xl font-black tracking-wider text-cyan-400 font-mono">SYSTEM INITIALIZING...</div>
        <div className="text-xs text-slate-400 font-mono">Loading Matchday Data &amp; Model Engine...</div>
      </div>
    </div>
  );

  const fixtures = data?.fixtures || [];
  const metadata = data?.metadata || {};
  const allLeagues = ['ALL', 'MLS', 'USL Championship', 'USL League One', 'NWSL', 'MLS NEXT Pro', 'USL Super League'];
  
  const sortedFixtures = [...fixtures]
    .filter(f => (selectedLeague === 'ALL' || f.league === selectedLeague) && !f.is_completed)
    .sort((a, b) => new Date(a.kickoff_iso) - new Date(b.kickoff_iso));

  const parlayMetrics = calculateParlayMetrics();
  const formattedLastUpdate = metadata.generated_at
    ? new Date(metadata.generated_at).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      })
    : 'Unknown';

  return (
    <div className="min-h-screen bg-[#05070B] text-slate-100 font-sans p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Banner */}
        <header className="bg-[#090D16] border border-cyan-500/30 rounded-xl p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500 text-cyan-400 font-black text-xs flex items-center justify-center rounded shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                USA
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                U.S. Soccer Match Model Engine
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-400 font-mono">
              Monte Carlo Poisson &amp; Dixon-Coles Goal Probability Engine
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            <div className="bg-[#05070B] border border-slate-800 rounded-lg p-3 text-xs space-y-1 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold font-mono">
                <span>&#x1F552; Scheduled Update:</span>
                <span className="text-slate-200">Daily at 7:00 AM EST</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-mono">
                <span>&#x1F4C5; Last Updated:</span>
                <span className="text-emerald-400 font-bold">{formattedLastUpdate}</span>
              </div>
            </div>
            <button
              onClick={handleManualScrapeTrigger}
              disabled={refreshing}
              className={
                "w-full sm:w-auto px-4 py-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 border shadow-lg " +
                (refreshing
                  ? "bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed"
                  : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]")
              }
            >
              <span>&#x26A1; Run Manual Scrape</span>
            </button>
          </div>
        </header>

        {/* Model Performance Tracker Banner */}
        {modelStats && (
          <div className="bg-[#090D16] border border-emerald-500/30 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                <h3 className="text-sm font-bold tracking-wider text-emerald-400 uppercase font-mono">Model Accuracy Tracker</h3>
              </div>
              <p className="text-xs text-slate-400 font-mono">Automated SQLite logging &amp; grading pipeline results over time</p>
            </div>
            <div className="grid grid-cols-3 gap-6 text-center w-full md:w-auto">
              <div className="bg-[#05070B] border border-slate-800 rounded-lg p-3">
                <div className="text-xl md:text-2xl font-black text-emerald-400 font-mono">{modelStats.win_rate_pct}%</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5 font-mono">Win Rate</div>
              </div>
              <div className="bg-[#05070B] border border-slate-800 rounded-lg p-3">
                <div className="text-xl md:text-2xl font-black text-white font-mono">{modelStats.correct_predictions} / {modelStats.finished_matches}</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5 font-mono">Correct / Graded</div>
              </div>
              <div className="bg-[#05070B] border border-slate-800 rounded-lg p-3">
                <div className="text-xl md:text-2xl font-black text-slate-200 font-mono">{modelStats.total_tracked}</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5 font-mono">Total Tracked</div>
              </div>
            </div>
          </div>
        )}

        {/* League Navigation Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
          {allLeagues.map((lg) => (
            <button
              key={lg}
              onClick={() => setSelectedLeague(lg)}
              className={
                "px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap shadow-sm " +
                (selectedLeague === lg
                  ? "bg-cyan-500 text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                  : "bg-[#090D16] text-slate-400 hover:text-white border border-slate-800")
              }
            >
              {lg}
            </button>
          ))}
        </div>

        {/* Matchday Odds Slate */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white tracking-tight font-mono">Active Fixtures (Earliest Kickoff First)</h2>
            <span className="text-xs text-slate-400 font-mono">
              Total Matches: {sortedFixtures.length}
            </span>
          </div>

          {sortedFixtures.length === 0 ? (
            <div className="bg-[#090D16] border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm font-mono">
              No active fixtures currently listed for {selectedLeague}.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedFixtures.map((fix) => {
                const activeTab = activeMarketTabs[fix.fixture_id] || 'ML';
                const isComparingDk = showDkCompare[fix.fixture_id] || false;
                const m = fix.model_markets || {};
                const ml = m.moneyline || { home: { prob: 50, fair_american: '-110' }, draw: { prob: 25, fair_american: '+250' }, away: { prob: 25, fair_american: '+260' } };
                const tnb = m.tie_no_bet || { home: { prob: 66, fair_american: '-180' }, away: { prob: 34, fair_american: '+140' } };
                const totals = m.totals || { over_2_5: { prob: 55, fair_american: '-120' }, under_2_5: { prob: 45, fair_american: '+100' } };
                const spread = m.spread || { home_minus_1_5: { prob: 32, fair_american: '+175' }, away_plus_1_5: { prob: 68, fair_american: '-210' } };

                const homeProb = ml.home.prob;
                const awayProb = ml.away.prob;
                const drawProb = ml.draw.prob;
                const topProb = Math.max(homeProb, awayProb, drawProb);
                let modelPickLabel = 'Draw';
                if (topProb === homeProb) modelPickLabel = fix.home_team;
                else if (topProb === awayProb) modelPickLabel = fix.away_team;

                return (
                  <div key={fix.fixture_id} className="bg-[#090D16] border border-slate-800/80 rounded-xl p-5 shadow-xl space-y-4 overflow-hidden relative">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      
                      {/* Left Block: Team Logos & Kickoff Details */}
                      <div className="lg:w-1/3 space-y-3 border-b lg:border-b-0 lg:border-r border-slate-800 pb-4 lg:pb-0 lg:pr-6">
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="font-bold text-cyan-400 uppercase tracking-wide">{fix.league}</span>
                          <span className="text-amber-400 font-bold">
                            {new Date(fix.kickoff_iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} EST
                          </span>
                        </div>
                        
                        <div className="space-y-2.5">
                          {/* Home Team with Logo & Custom Color Border */}
                          <div
                            className="flex items-center justify-between pl-3 py-2 rounded-r bg-[#05070B] border border-slate-800/60"
                            style={{ borderLeft: `6px solid ${getTeamColor(fix.home_team)}` }}
                          >
                            <div className="flex items-center gap-2.5">
                              <img 
                                src={getTeamLogoPath(fix.home_team)} 
                                alt={fix.home_team} 
                                className="w-6 h-6 object-contain"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                              <span className="font-bold text-base text-white">{fix.home_team}</span>
                            </div>
                            <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mr-2">
                              xG {m.home_xg}
                            </span>
                          </div>
                          
                          <div className="text-[10px] text-slate-500 font-mono font-bold tracking-widest uppercase pl-4">VS</div>
                          
                          {/* Away Team with Logo & Custom Color Border */}
                          <div
                            className="flex items-center justify-between pl-3 py-2 rounded-r bg-[#05070B] border border-slate-800/60"
                            style={{ borderLeft: `6px solid ${getTeamColor(fix.away_team)}` }}
                          >
                            <div className="flex items-center gap-2.5">
                              <img 
                                src={getTeamLogoPath(fix.away_team)} 
                                alt={fix.away_team} 
                                className="w-6 h-6 object-contain"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                              <span className="font-bold text-base text-white">{fix.away_team}</span>
                            </div>
                            <span className="text-xs text-cyan-400 font-mono font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 mr-2">
                              xG {m.away_xg}
                            </span>
                          </div>
                        </div>

                        {/* Model Pick Badge */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                          <span className="text-slate-400 font-mono">&#x1F916; Model Pick:</span>
                          <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-bold font-mono border border-emerald-500/30">
                            {modelPickLabel} ({topProb}%)
                          </span>
                        </div>

                        <button
                          onClick={() => toggleDkCompare(fix.fixture_id)}
                          className={
                            "w-full text-[10px] font-mono font-bold px-2.5 py-2 rounded transition-all flex items-center justify-center gap-1 border " +
                            (isComparingDk
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                              : "bg-[#05070B] text-slate-400 hover:text-white border-slate-800")
                          }
                        >
                          <span>{isComparingDk ? '&#x25BC; Hide DK Line Input' : '&#x25B6; Compare Sportsbook Line (+EV)'}</span>
                        </button>
                      </div>

                      {/* Right Block: Markets & Odds */}
                      <div className="lg:w-2/3 space-y-3">
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
                          {[
                            { key: 'ML', label: 'Moneyline' },
                            { key: 'TNB', label: 'Tie No Bet' },
                            { key: 'TOTALS', label: 'Total Goals' },
                            { key: 'SPREAD', label: 'Spread' },
                            { key: 'PROPS', label: 'Player Props' }
                          ].map((tab) => (
                            <button
                              key={tab.key}
                              onClick={() => setCardTab(fix.fixture_id, tab.key)}
                              className={
                                "px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all whitespace-nowrap " +
                                (activeTab === tab.key
                                  ? "bg-cyan-500 text-slate-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                                  : "bg-[#05070B] text-slate-400 hover:text-white border border-slate-800")
                              }
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* MONEYLINE TAB */}
                        {activeTab === 'ML' && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                            {[
                              { key: fix.fixture_id + '_ml_home', label: fix.home_team, item: ml.home },
                              { key: fix.fixture_id + '_ml_draw', label: 'Draw', item: ml.draw },
                              { key: fix.fixture_id + '_ml_away', label: fix.away_team, item: ml.away }
                            ].map((sel) => {
                              const dkLine = customDkLines[sel.key] || '';
                              const ev = calculateEV(sel.item.prob, dkLine);
                              return (
                                <div key={sel.key} className="bg-[#05070B] p-3 rounded-lg border border-slate-800 flex flex-col justify-between space-y-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-slate-300 truncate">{sel.label}</span>
                                    <span className="text-emerald-400 font-mono font-bold">{sel.item.prob}%</span>
                                  </div>
                                  <button
                                    onClick={() => toggleParlayPick(fix, 'Moneyline', sel.label, dkLine || sel.item.fair_american, sel.item.prob)}
                                    className={"p-2 rounded border text-center transition-all " + (
                                      parlayPicks.some(p => p.pickId === fix.fixture_id + '_Moneyline_' + sel.label)
                                        ? "bg-cyan-500 text-slate-950 font-black border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                                        : "bg-[#090D16] border-slate-800 hover:border-slate-600 text-slate-200"
                                    )}
                                  >
                                    <div className="text-[9px] text-slate-400 uppercase font-sans font-semibold">Model Fair Odds</div>
                                    <div className="text-base font-black text-white">{sel.item.fair_american}</div>
                                  </button>
                                  {isComparingDk && (
                                    <div className="pt-2 border-t border-slate-800 space-y-1">
                                      <label className="text-[8px] text-cyan-400 uppercase font-semibold block font-mono">Sportsbook Line</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. +140"
                                        value={dkLine}
                                        onChange={(e) => updateDkLine(sel.key, e.target.value)}
                                        className="w-full bg-[#090D16] border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                                      />
                                      {ev !== null && (
                                        <div className="text-[9px] font-bold font-mono text-right pt-0.5">
                                          {parseFloat(ev) > 0 ? (
                                            <span className="text-emerald-400">+{ev}% EV</span>
                                          ) : (
                                            <span className="text-slate-500">{ev}% EV</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* TIE NO BET TAB */}
                        {activeTab === 'TNB' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                            {[
                              { key: fix.fixture_id + '_tnb_home', label: fix.home_team + ' (TNB)', item: tnb.home },
                              { key: fix.fixture_id + '_tnb_away', label: fix.away_team + ' (TNB)', item: tnb.away }
                            ].map((sel) => {
                              const dkLine = customDkLines[sel.key] || '';
                              const ev = calculateEV(sel.item.prob, dkLine);
                              return (
                                <div key={sel.key} className="bg-[#05070B] p-3 rounded-lg border border-slate-800 flex flex-col justify-between space-y-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-slate-300 truncate">{sel.label}</span>
                                    <span className="text-emerald-400 font-mono font-bold">{sel.item.prob}%</span>
                                  </div>
                                  <button
                                    onClick={() => toggleParlayPick(fix, 'Tie No Bet', sel.label, dkLine || sel.item.fair_american, sel.item.prob)}
                                    className="p-2 bg-[#090D16] border border-slate-800 hover:border-slate-600 text-slate-200 rounded text-center"
                                  >
                                    <div className="text-[9px] text-slate-400 font-sans font-semibold">Model Fair Odds</div>
                                    <div className="text-base font-black text-white">{sel.item.fair_american}</div>
                                  </button>
                                  {isComparingDk && (
                                    <div className="pt-2 border-t border-slate-800 space-y-1">
                                      <label className="text-[8px] text-cyan-400 uppercase font-semibold block font-mono">Sportsbook Line</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. -150"
                                        value={dkLine}
                                        onChange={(e) => updateDkLine(sel.key, e.target.value)}
                                        className="w-full bg-[#090D16] border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                                      />
                                      {ev !== null && (
                                        <div className="text-[9px] font-bold font-mono text-right pt-0.5">
                                          {parseFloat(ev) > 0 ? (
                                            <span className="text-emerald-400">+{ev}% EV</span>
                                          ) : (
                                            <span className="text-slate-500">{ev}% EV</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* TOTAL GOALS TAB */}
                        {activeTab === 'TOTALS' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                            {[
                              { key: fix.fixture_id + '_tot_over', label: 'Over 2.5 Goals', item: totals.over_2_5 },
                              { key: fix.fixture_id + '_tot_under', label: 'Under 2.5 Goals', item: totals.under_2_5 }
                            ].map((sel) => {
                              const dkLine = customDkLines[sel.key] || '';
                              const ev = calculateEV(sel.item.prob, dkLine);
                              return (
                                <div key={sel.key} className="bg-[#05070B] p-3 rounded-lg border border-slate-800 flex flex-col justify-between space-y-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-slate-300">{sel.label}</span>
                                    <span className="text-emerald-400 font-mono font-bold">{sel.item.prob}%</span>
                                  </div>
                                  <button
                                    onClick={() => toggleParlayPick(fix, 'Total Goals', sel.label, dkLine || sel.item.fair_american, sel.item.prob)}
                                    className="p-2 bg-[#090D16] border border-slate-800 hover:border-slate-600 text-slate-200 rounded text-center"
                                  >
                                    <div className="text-[9px] text-slate-400 font-sans font-semibold">Model Fair Odds</div>
                                    <div className="text-base font-black text-white">{sel.item.fair_american}</div>
                                  </button>
                                  {isComparingDk && (
                                    <div className="pt-2 border-t border-slate-800 space-y-1">
                                      <label className="text-[8px] text-cyan-400 uppercase font-semibold block font-mono">Sportsbook Line</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. -115"
                                        value={dkLine}
                                        onChange={(e) => updateDkLine(sel.key, e.target.value)}
                                        className="w-full bg-[#090D16] border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                                      />
                                      {ev !== null && (
                                        <div className="text-[9px] font-bold font-mono text-right pt-0.5">
                                          {parseFloat(ev) > 0 ? (
                                            <span className="text-emerald-400">+{ev}% EV</span>
                                          ) : (
                                            <span className="text-slate-500">{ev}% EV</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* SPREAD TAB */}
                        {activeTab === 'SPREAD' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                            {[
                              { key: fix.fixture_id + '_spr_home', label: fix.home_team + ' -1.5', item: spread.home_minus_1_5 },
                              { key: fix.fixture_id + '_spr_away', label: fix.away_team + ' +1.5', item: spread.away_plus_1_5 }
                            ].map((sel) => {
                              const dkLine = customDkLines[sel.key] || '';
                              const ev = calculateEV(sel.item.prob, dkLine);
                              return (
                                <div key={sel.key} className="bg-[#05070B] p-3 rounded-lg border border-slate-800 flex flex-col justify-between space-y-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-slate-300 truncate">{sel.label}</span>
                                    <span className="text-emerald-400 font-mono font-bold">{sel.item.prob}%</span>
                                  </div>
                                  <button
                                    onClick={() => toggleParlayPick(fix, 'Spread', sel.label, dkLine || sel.item.fair_american, sel.item.prob)}
                                    className="p-2 bg-[#090D16] border border-slate-800 hover:border-slate-600 text-slate-200 rounded text-center"
                                  >
                                    <div className="text-[9px] text-slate-400 font-sans font-semibold">Model Fair Odds</div>
                                    <div className="text-base font-black text-white">{sel.item.fair_american}</div>
                                  </button>
                                  {isComparingDk && (
                                    <div className="pt-2 border-t border-slate-800 space-y-1">
                                      <label className="text-[8px] text-cyan-400 uppercase font-semibold block font-mono">Sportsbook Line</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. +160"
                                        value={dkLine}
                                        onChange={(e) => updateDkLine(sel.key, e.target.value)}
                                        className="w-full bg-[#090D16] border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                                      />
                                      {ev !== null && (
                                        <div className="text-[9px] font-bold font-mono text-right pt-0.5">
                                          {parseFloat(ev) > 0 ? (
                                            <span className="text-emerald-400">+{ev}% EV</span>
                                          ) : (
                                            <span className="text-slate-500">{ev}% EV</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* PLAYER PROPS TAB */}
                        {activeTab === 'PROPS' && (
                          <div className="space-y-2 text-xs font-mono">
                            {(m.player_props || []).map((pl, idx) => {
                              const pKey = fix.fixture_id + '_prop_' + idx;
                              const dkGoalLine = customDkLines[pKey + '_goal'] || '';
                              const goalEV = calculateEV(pl.anytime_goalscorer.prob, dkGoalLine);
                              return (
                                <div key={idx} className="bg-[#05070B] p-3 rounded-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                  <div>
                                    <div className="font-sans font-bold text-slate-100 text-xs">{pl.player_name}</div>
                                    <div className="text-[10px] text-slate-400 font-sans">{pl.team}</div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-center">
                                      <div className="text-[8px] text-slate-400 font-sans">GOAL PROB</div>
                                      <div className="font-bold text-emerald-400 text-xs">{pl.anytime_goalscorer.prob}%</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-[8px] text-slate-400 font-sans">FAIR ODDS</div>
                                      <div className="font-bold text-white text-xs">{pl.anytime_goalscorer.fair_american}</div>
                                    </div>
                                    {isComparingDk && (
                                      <div className="w-20">
                                        <input
                                          type="text"
                                          placeholder="Line"
                                          value={dkGoalLine}
                                          onChange={(e) => updateDkLine(pKey + '_goal', e.target.value)}
                                          className="w-full bg-[#090D16] border border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono text-cyan-300"
                                        />
                                        {goalEV !== null && (
                                          <div className="text-[8px] font-bold text-right pt-0.5">
                                            {parseFloat(goalEV) > 0 ? <span className="text-emerald-400">+{goalEV}% EV</span> : <span className="text-slate-500">{goalEV}% EV</span>}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    <button
                                      onClick={() => toggleParlayPick(fix, 'Anytime Goal', pl.player_name, dkGoalLine || pl.anytime_goalscorer.fair_american, pl.anytime_goalscorer.prob)}
                                      className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded text-xs font-bold font-mono shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all"
                                    >
                                      + Add
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
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
        <div className="fixed bottom-0 left-0 right-0 bg-[#090D16] border-t border-cyan-500/40 p-4 shadow-[0_-10px_25px_rgba(0,0,0,0.8)] z-50">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-cyan-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded font-mono shadow-[0_0_8px_rgba(6,182,212,0.5)]">SLIP</span>
                <span className="text-sm font-bold text-white font-mono">{parlayPicks.length} {parlayPicks.length === 1 ? 'Leg' : 'Legs'} Selected</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {parlayPicks.map((p) => (
                  <span key={p.pickId} className="bg-[#05070B] text-slate-300 text-xs px-2.5 py-1 rounded border border-slate-800 flex items-center gap-1 font-mono">
                    <span className="text-slate-400 text-[10px] uppercase font-sans">{p.marketName}:</span>
                    <span className="text-cyan-400 font-bold">{p.selectionLabel}</span> ({p.oddsStr})
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider font-mono">Combined Fair Odds</div>
                <div className="text-lg font-black text-amber-400 font-mono">{parlayMetrics.americanOdds}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider font-mono">Model Combined Prob</div>
                <div className="text-lg font-black text-cyan-300 font-mono">{parlayMetrics.combinedProb}%</div>
              </div>
              <button
                onClick={() => setParlayPicks([])}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-2 rounded border border-slate-700 font-mono"
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