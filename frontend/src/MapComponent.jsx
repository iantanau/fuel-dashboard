import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// 解决 Leaflet 默认图标缺失问题
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

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
// 接收父组件传来的 focusedStation 属性
const MapComponent = ({ focusedStation }) => {
    const [stations, setStations] = useState([]);

    // 创建一个引用字典，用来存储地图上所有的 Marker 实例
    // 结构: { "station_id_1": markerInstance, "station_id_2": markerInstance ... }
    const markerRefs = useRef({});

    useEffect(() => {
        axios.get('http://127.0.0.1:5000/api/stations')
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
                //稍微延迟一点点，等地图飞过去再打开，体验更好
                setTimeout(() => {
                    marker.openPopup();
                }, 500); 
            }
        }
    }, [focusedStation]);

    // 添加时间格式化函数 (和 App.jsx 保持一致)
    const formatLocalTime = (isoString) => {
        if (!isoString) return "N/A";
        let date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString;

        return new Intl.DateTimeFormat('en-AU', {
          month: '2-digit', day: '2-digit',     // 地图弹窗空间小，可以不显示年份
          hour: '2-digit', minute: '2-digit',
          hour12: false,
          // timeZoneName: 'short'              // 地图里空间小，可以去掉时区后缀，或者保留看你喜好
        }).format(date);
    };

    // 悉尼中心为默认坐标
    const centerPosition = [-33.8688, 151.2093]; 

    return (
        <MapContainer 
            center={centerPosition} 
            zoom={12} 
            style={{ height: '100%', width: '100%'}}
            zoomControl={false} // 隐藏默认的缩放按钮，让界面更干净 (可选)
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
                                    <p className="text-xs text-gray-400 italic text-center py-2">暂无价格信息</p>
                                )}
                            </div>
                            
                            <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-end">
                                <span className="text-[10px] text-gray-400 leading-tight">
                                    {station.address}
                                </span>
                                <span className="text-[10px] text-blue-400 font-medium whitespace-nowrap ml-2">
                                    {station.prices && station.prices.length > 0 
                                        ? formatLocalTime(station.prices[0].updated) 
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