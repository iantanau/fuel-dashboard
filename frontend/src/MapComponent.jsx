import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';

// 解决 Leaflet 默认图标缺失问题
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

// --- 新增：地图控制器组件 ---
// 作用：监听 focusedStation 的变化，然后控制地图移动
const MapController = ({ focusedStation }) => {
    const map = useMap();

    useEffect(() => {
        if (focusedStation) {
            // map.flyTo(坐标, 缩放级别, 动画选项)
            map.flyTo(
                [focusedStation.lat, focusedStation.lng], 
                15, 
                { duration: 1.5 } // 1.5秒飞过去
            );
        }
    }, [focusedStation, map]);

    return null; // 这个组件不渲染任何可见元素
};

// --- 主地图组件 ---
const MapComponent = ({ focusedStation, fuelType }) => {
    const [stations, setStations] = useState([]);

    // 创建一个引用字典，用来存储地图上所有的 Marker 实例
    const markerRefs = useRef({});

    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/stations`)
            .then(res => {
                setStations(res.data);
            })
            .catch(err => console.error("Error fetching stations:", err));
    }, []);

    // 监听 focusedStation 变化，自动打开气泡
    useEffect(() => {
        if (focusedStation && focusedStation.code) {
            const marker = markerRefs.current[focusedStation.code];
            if (marker) {
                // 稍微延迟一点点，等地图飞过去再打开，体验更好 (通常延迟 1.6s 略大于飞行动画)
                setTimeout(() => {
                    marker.openPopup();
                }, 1600); 
            }
        }
    }, [focusedStation]);

    // 添加时间格式化函数 (和 App.jsx 保持一致)
    const formatLocalTime = (isoString) => {
        if (!isoString) return "N/A";
        let date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString;

        return new Intl.DateTimeFormat('en-AU', {
          month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit',
          hour12: false,
        }).format(date);
    };

    // 悉尼中心为默认坐标
    const centerPosition = [-33.8688, 151.2093]; 

    return (
        <MapContainer 
            center={centerPosition} 
            zoom={12} 
            style={{ height: '100%', width: '100%'}}
            zoomControl={false} 
        >
            <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController focusedStation={focusedStation} />
            
            {stations.map((station) => (
                <Marker 
                    key={station.code} 
                    position={[station.latitude || 0, station.longitude || 0]}
                    // 将当前 Marker 的实例存入 ref 字典中
                    ref={element => {
                        if (element) {
                            markerRefs.current[station.code] = element;
                        }
                    }}
                >
                    <Popup>
                        <div className="min-w-[200px] p-1 font-sans">
                            <div className="border-b border-gray-100 pb-2 mb-2">
                                <h3 className="font-bold text-gray-900 text-sm leading-tight">{station.name}</h3>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold tracking-wider">{station.brand}</p>
                            </div>

                            <div className="space-y-1 max-h-[160px] overflow-y-auto custom-scrollbar">
                                {station.prices && station.prices.length > 0 ? (
                                    station.prices.map((p, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`flex justify-between items-center text-xs p-1.5 rounded transition-all ${
                                                p.type === fuelType 
                                                ? 'bg-blue-600 text-white font-bold shadow-sm' 
                                                : 'hover:bg-gray-50 text-gray-700'
                                            }`}
                                        >
                                            <span>{p.type}</span>
                                            <div className="text-right">
                                                <span className="font-black">{p.price}</span>
                                                <span className="text-[9px] opacity-70 ml-0.5">c/L</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 italic text-center py-2">No price data</p>
                                )}
                            </div>
                            
                            <div className="mt-3 pt-2 border-t border-gray-100 flex flex-col gap-1">
                                <span className="text-[9px] text-gray-400 leading-tight">
                                    {station.address}
                                </span>
                                <span className="text-[9px] text-blue-400 font-bold">
                                    Updated: {station.prices?.[0] ? formatLocalTime(station.prices[0].updated) : ""}
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