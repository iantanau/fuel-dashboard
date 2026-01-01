import { useEffect, useState } from 'react';
import axios from 'axios';
import { Fuel, MapPin, TrendingDown } from 'lucide-react';

import MapComponent from './MapComponent';

function App() {
  // 定义状态：存数据
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect: 页面加载时自动触发
  useEffect(() => {
    // 调用 Flask API
    // 注意：Flask 默认端口是 5000
    axios.get('http://127.0.0.1:5000/api/stats')
      .then(response => {
        console.log("数据获取成功:", response.data);
        setStats(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("API 请求失败:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* 标题栏 */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Fuel className="text-blue-600" />
          NSW Fuel Dashboard
        </h1>
        <p className="text-gray-500 mt-2">Real-time monitoring of fuel prices across New South Wales</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 左侧：统计卡片 (Stats Card) */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-700">
              {stats ? stats.title : "Ranked Cheapest 5 Stations"}
            </h2>
            <TrendingDown className="text-green-500" />
          </div>

          {loading ? (
            <p className="text-gray-400 animate-pulse">Loading Data...</p>
          ) : (
            <div className="space-y-4">
              {stats && stats.cheapest_5.map((item, index) => (
                <div key={index} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0">
                  <div>
                    <div className="font-medium text-gray-800">{item.station}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin size={12} />
                      {item.address}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {item.price}
                    </div>
                    <div className="text-xs text-gray-400">{item.fuel_type}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t text-xs text-gray-400 text-center">
             Total Records: {stats?.total_records || 0}
          </div>
        </div>

        {/* 右侧：地图占位符 */}
        <div className="bg-white p-1 rounded-xl shadow-lg border border-gray-100 col-span-2 min-h-[500px] z-0">
          <MapComponent />
        </div>

      </div>
    </div>
  );
}

export default App;