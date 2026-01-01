import { useEffect, useState } from 'react';
import axios from 'axios';
import { Fuel, MapPin, TrendingDown, Clock, RefreshCw } from 'lucide-react';
import MapComponent from './MapComponent';

function App() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 核心状态：用户当前选择的燃油类型
  const [selectedFuel, setSelectedFuel] = useState("E10");

  // 支持的燃油列表 (你可以根据需要增减)
  const fuelTypes = ["E10", "U91", "P95", "P98", "Diesel", "LPG", "EV"];

  // 获取数据的函数
  const fetchStats = () => {
    setLoading(true);
    // 动态请求后端，带上 fuel_type 参数
    axios.get(`http://127.0.0.1:5000/api/stats?fuel_type=${selectedFuel}`)
      .then(response => {
        setStats(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("API Request Error:", error);
        setLoading(false);
      });
  };

  // 监听 selectedFuel 变化，一旦变化自动触发 fetchStats
  useEffect(() => {
    fetchStats();
  }, [selectedFuel]);

  // 时间格式化工具
  const formatTime = (isoString) => {
    if (!isoString) return "Waiting Data...";
    return new Date(isoString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      
      {/* --- 顶部控制栏 --- */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Fuel className="text-blue-600" />
            NSW Fuel Watch
          </h1>
          {/* 显示更新时间 */}
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
            <Clock size={14} />
            Latest Data Update: <span className="font-medium text-blue-600">{stats ? formatTime(stats.data_updated_at) : "--"}</span>
          </p>
        </div>

        {/* 右侧：下拉菜单选择器 */}
        <div className="mt-4 md:mt-0 flex items-center gap-3">
            <label className="text-gray-600 text-sm font-medium">Select Fuel Type:</label>
            <select 
                value={selectedFuel}
                onChange={(e) => setSelectedFuel(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 outline-none"
            >
                {fuelTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                ))}
            </select>
            
            <button 
                onClick={fetchStats}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                title="Manual Refresh"
            >
                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
        </div>
      </div>

      {/* --- 主要内容区域 --- */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 左侧：排行榜列表 */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 col-span-1 h-fit">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
               <TrendingDown className="text-green-500" />
               {selectedFuel} Lowest Price List
            </h2>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
                {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 rounded"></div>)}
            </div>
          ) : (
            <div className="space-y-3">
              {stats && stats.cheapest_5.length > 0 ? (
                  stats.cheapest_5.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200">
                      <div className="overflow-hidden">
                          <div className="font-semibold text-gray-800 truncate pr-2">{item.station}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                            <MapPin size={10} />
                            {item.address}
                          </div>
                      </div>
                      <div className="text-right whitespace-nowrap pl-2">
                          <div className="text-xl font-bold text-green-600">{item.price}</div>
                          <div className="text-[10px] text-gray-400">c/L</div>
                      </div>
                    </div>
                ))
              ) : (
                  <div className="text-center py-8 text-gray-400">
                      No {selectedFuel} price data available
                  </div>
              )}
            </div>
          )}
        </div>

        {/* 右侧：地图组件 */}
        <div className="bg-white p-1 rounded-xl shadow-lg border border-gray-100 col-span-1 lg:col-span-2 min-h-[600px] z-0 relative">
          <MapComponent />
        </div>

      </div>
    </div>
  );
}

export default App;