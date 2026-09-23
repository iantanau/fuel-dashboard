import { useCallback, useEffect, useState } from 'react';
import { Fuel, MapPin, TrendingDown, Clock, RefreshCw, ChevronRight, AlertCircle } from 'lucide-react';
import MapComponent from './MapComponent';
import { getStats } from './staticData';

function App() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFuel, setSelectedFuel] = useState('E10');
  const [focusedStation, setFocusedStation] = useState(null);

  const fuelTypes = ['E10', 'U91', 'P95', 'P98', 'PDL', 'DL', 'LPG', 'EV'];

  const fetchStats = useCallback(() => {
    setLoading(true);
    setError(null);
    let active = true;

    getStats(selectedFuel)
      .then((data) => {
        if (!active) return;
        setStats(data);
        setLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        console.error('Data Request Error:', error);
        setError('Unable to load fuel data');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedFuel]);

  useEffect(() => {
    const cancel = fetchStats();
    return cancel;
  }, [fetchStats]);

  const formatTime = (isoString) => {
    if (!isoString) return 'Waiting Data...';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return isoString;

    return date.toLocaleString('en-AU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const handleStationClick = (item) => {
    if (item.lat && item.lng) {
      setFocusedStation({
        lat: item.lat,
        lng: item.lng,
        code: item.code,
        timestamp: Date.now(),
      });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50 overflow-hidden font-sans">
      <div className="w-full lg:w-96 flex flex-col bg-white shadow-xl z-20 border-r border-gray-200 h-[45vh] lg:h-full">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Fuel className="text-blue-600" size={28} />
            NSW Fuel Watch
          </h1>
          <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1 uppercase tracking-widest font-semibold">
            <Clock size={12} />
            Update at: {stats ? formatTime(stats.data_updated_at) : '--'}
          </p>
        </div>

        <div className="p-6 pb-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">
            Fuel Type Selection
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={selectedFuel}
                onChange={(e) => setSelectedFuel(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 block p-2.5 appearance-none font-bold outline-none"
              >
                {fuelTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>

            <button
              onClick={fetchStats}
              className="p-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
              <TrendingDown className="text-green-500" size={16} />
              Cheapest 5
            </h2>
            <span className="text-[10px] bg-blue-100 text-blue-600 font-bold px-2 py-0.5 rounded">
              {selectedFuel}
            </span>
          </div>

          <div className="space-y-3">
            {error && (
              <div className="flex flex-col items-center justify-center py-10 text-red-400">
                <AlertCircle size={32} />
                <p className="text-sm mt-2">{error}</p>
              </div>
            )}

            {loading ? (
              [1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse"></div>)
            ) : (
              stats && stats.cheapest_5.map((item, index) => (
                <div
                  key={`${item.code}-${index}`}
                  onClick={() => handleStationClick(item)}
                  className="group bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer relative flex justify-between items-center"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="font-bold text-gray-800 truncate text-sm">
                      {index + 1}. {item.station}
                    </div>
                    <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-1 truncate">
                      <MapPin size={12} />
                      {item.address}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <div className="text-lg font-black text-green-600 leading-tight">{item.price}</div>
                      <div className="text-[9px] text-gray-400 uppercase font-medium">cents/L</div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              ))
            )}

            {!loading && !error && stats?.cheapest_5.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm italic">No data available in this area</div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 text-[10px] text-center text-gray-400 font-medium">
          Powered by NSW FuelCheck API
        </div>
      </div>

      <div className="flex-1 relative h-[55vh] lg:h-full bg-gray-200">
        <MapComponent focusedStation={focusedStation} fuelType={selectedFuel} />
      </div>
    </div>
  );
}

export default App;
