import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapComponent = () => {
    const [stations, setStations] = useState([]);

    useEffect(() => {
        axios.get('http://127.0.0.1:5000/api/stations')
            .then(res => {
                setStations(res.data);
            })
            .catch(err => console.error("Error fetching stations:", err));
    }, []);

    // --- 关键：添加时间格式化函数 (和 App.jsx 保持一致) ---
    const formatTime = (isoString) => {
        if (!isoString) return "N/A";
        let date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString;

        return new Intl.DateTimeFormat('en-AU', {
          month: '2-digit', day: '2-digit',     // 地图弹窗空间小，我们可以不显示年份
          hour: '2-digit', minute: '2-digit',
          hour12: false,
          // timeZoneName: 'short'              // 地图里空间小，可以去掉时区后缀，或者保留看你喜好
        }).format(date);
    };

    const centerPosition = [-33.8688, 151.2093]; 

    return (
        <MapContainer 
            center={centerPosition} 
            zoom={12} 
            style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {stations.map((station) => (
                <Marker 
                    key={station.code} 
                    position={[station.latitude || 0, station.longitude || 0]}
                >
                    <Popup>
                        <div className="min-w-[200px] p-1">
                            <div className="border-b border-gray-200 pb-2 mb-2">
                                <h3 className="font-bold text-gray-900 text-sm">{station.name}</h3>
                                <p className="text-xs text-gray-500">{station.brand}</p>
                            </div>

                            <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                                {station.prices && station.prices.length > 0 ? (
                                    station.prices.map((p, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm p-1.5 rounded hover:bg-gray-50 border border-transparent hover:border-gray-100">
                                            <span className={`font-semibold ${p.type === 'E10' ? 'text-blue-600' : 'text-gray-700'}`}>
                                                {p.type}
                                            </span>
                                            <div className="text-right">
                                                <span className="font-bold text-gray-900">{p.price}</span>
                                                <span className="text-[10px] text-gray-400 ml-0.5">c/L</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 italic text-center py-2">No prices available</p>
                                )}
                            </div>
                            
                            {/* --- 底部显示该站点的最后更新时间 (Last Updated) --- */}
                            <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-end">
                                <span className="text-[10px] text-gray-400 max-w-[60%] truncate" title={station.address}>
                                    {station.address}
                                </span>
                                <span className="text-[10px] text-blue-400 font-medium">
                                    {/* 这里取价格列表里第一个元素的更新时间作为展示 */}
                                    {station.prices && station.prices.length > 0 
                                        ? formatTime(station.prices[0].updated) 
                                        : ""}
                                </span>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapComponent;