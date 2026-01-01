import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';

// 修复 Leaflet 默认图标不显示的问题
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
        // 请求所有的加油站数据
        axios.get('http://127.0.0.1:5000/api/stations')
            .then(res => {
                setStations(res.data);
            })
            .catch(err => console.error("地图数据加载失败:", err));
    }, []);

    // 默认中心点：悉尼
    const position = [-33.8688, 151.2093]; 

    return (
        <MapContainer center={position} zoom={11} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
            {/* 地图底图：使用免费的 OpenStreetMap */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* 遍历所有加油站，在地图上插旗 */}
            {stations.map((station) => (
                <Marker 
                    key={station.code} 
                    position={[station.latitude, station.longitude]}
                >
                    <Popup>
                        <div className="p-1">
                            <h3 className="font-bold text-sm">{station.name}</h3>
                            <p className="text-xs text-gray-500">{station.address}</p>
                            <div className="mt-2 text-lg font-bold text-blue-600">
                                {station.current_price ? `${station.current_price}c` : "暂无价格"}
                            </div>
                            <div className="text-xs bg-gray-100 rounded px-1 mt-1 inline-block">
                                {station.fuel_type || "N/A"}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapComponent;