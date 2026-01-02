import { useEffect, useState } from 'react';
import axios from 'axios';
import { Fuel, MapPin, TrendingDown, Clock, RefreshCw, ChevronRight } from 'lucide-react';
import MapComponent from './MapComponent';

function App() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 核心状态：用户当前选择的燃油类型
  const [selectedFuel, setSelectedFuel] = useState("E10");

  // 当前地图聚焦的加油站坐标
  const [focusedStation, setFocusedStation] = useState(null);

  // 支持的燃油列表 (可以根据需要增减)
  const fuelTypes = ["E10", "U91", "P95", "P98", "PDL", "DL", "LPG", "EV"];

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

// 时间格式化并转换当地时区工具
  const formatTime = (isoString) => {
    if (!isoString) return "Waiting Data...";
    
    // 1. 保留字符串格式
    let dateString = isoString; 
    
    // 2. 只有当它确实是字符串且没有 Z 时，才补 Z (强制 UTC)
    if (typeof dateString === 'string' && !dateString.endsWith('Z')) {
        dateString += 'Z';
    }

    // 3. 转换
    let date = new Date(dateString);
    if (isNaN(date.getTime())) return isoString;

    // 4. 使用 Intl.DateTimeFormat 获取浏览器所在地的本地格式
    return date.toLocaleString('en-AU', {
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false, 
      timeZoneName: 'short' 
    });
  };

  // 点击排行榜某一项的处理函数
  const handleStationClick = (item) => {
      // 这里的 item 是排行榜里的数据，通常只有 address, lat, lng, price
      // 把坐标传给 state
      if (item.lat && item.lng) {
          setFocusedStation({ lat: item.lat, lng: item.lng, code: item.code });
      }
  };

  return (
    // 使用 h-screen 让页面铺满屏幕，不出现滚动条 (除非内容过多)
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* ================= 左侧侧边栏 (Sidebar) ================= */}
      <div className="w-full lg:w-96 flex flex-col bg-white shadow-xl z-10 border-r border-gray-200">
        
        {/* 1. 顶部 Header */}
        <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Fuel className="text-blue-600 fill-blue-50" size={28} />
                NSW Fuel Watch
            </h1>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Clock size={12} />
                Update at: {stats ? formatTime(stats.data_updated_at) : "--"}
            </p>
        </div>

        {/* 2. 控制区：油号选择 */}
        <div className="p-6 pb-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                Settings
            </label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <select 
                        value={selectedFuel}
                        onChange={(e) => setSelectedFuel(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 appearance-none font-medium"
                    >
                        {fuelTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    {/* 自定义下拉箭头 */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
                
                <button 
                    onClick={fetchStats}
                    className="p-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    title="Refresh Data"
                >
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </div>
        </div>

        {/* 3. 排行榜列表 (可滚动) */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <TrendingDown className="text-green-500" size={18} />
                    Cheapest 5 Stations
                </h2>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                    {selectedFuel}
                </span>
            </div>

            <div className="space-y-3">
                {loading ? (
                    [1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>)
                ) : (
                    stats && stats.cheapest_5.map((item, index) => (
                        <div 
                            key={index} 
                            onClick={() => handleStationClick(item)} // 点击事件
                            className="group bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer relative overflow-hidden"
                        >
                            {/* 左侧蓝色条 */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-blue-500 transition-colors"></div>

                            <div className="flex justify-between items-center pl-2">
                                <div className="min-w-0 flex-1 mr-2">
                                    <div className="font-semibold text-gray-800 truncate text-sm">
                                        {index + 1}. {item.station}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                                        <MapPin size={10} />
                                        {item.address}
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                    <div>
                                        <div className="text-lg font-bold text-green-600 leading-tight">{item.price}</div>
                                        <div className="text-[10px] text-gray-400">c/L</div>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                </div>
                            </div>
                        </div>
                    ))
                )}
                
                {!loading && stats && stats.cheapest_5.length === 0 && (
                    <div className="text-center py-10 text-gray-400 text-sm">No data available</div>
                )}
            </div>
        </div>
        
        {/* 底部版权 (可选) */}
        <div className="p-4 border-t border-gray-100 text-[10px] text-center text-gray-400">
            Powered by NSW FuelCheck API
        </div>

      </div>

      {/* ================= 右侧地图 (Map) ================= */}
      <div className="flex-1 relative h-full bg-gray-200">
         {/* 把 focusedStation 传给地图 */}
         <MapComponent focusedStation={focusedStation} />
         
         {/* 移动端提示: 如果是手机看，地图在下面 */}
      </div>

    </div>
  );
}

export default App;