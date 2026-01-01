import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// 修复 Leaflet 图标
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
        // 请求 API
        axios.get('http://127.0.0.1:5000/api/stations')
            .then(res => {
                setStations(res.data);
            })
            .catch(err => console.error("Map load failed:", err));
    }, []);

    // 默认地图中心 (悉尼)
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
                            {/* 弹窗标题 */}
                            <div className="border-b border-gray-200 pb-2 mb-2">
                                <h3 className="font-bold text-gray-900 text-sm">{station.name}</h3>
                                <div className="text-xs text-gray-500 flex justify-between mt-1">
                                    <span>{station.brand}</span>
                                    {/* 简单的导航链接 (可选) */}
                                    <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-blue-500 hover:underline"
                                    >
                                        导航
                                    </a>
                                </div>
                            </div>

                            {/* 弹窗内容：所有油价列表 */}
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
                                    <p className="text-xs text-gray-400 italic text-center py-2">No Price Information</p>
                                )}
                            </div>
                            
                            <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-400 truncate">
                                {station.address}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapComponent;