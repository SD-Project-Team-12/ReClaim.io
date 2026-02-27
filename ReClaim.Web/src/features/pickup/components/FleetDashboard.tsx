import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, Cpu, Weight, AlertTriangle, Search, Activity } from "lucide-react";
import { getPendingRequests, claimPickUpRequest } from "../../../api/pickupApi";

const pendingIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function MapFlyTo({ target }: { target: L.LatLng | null }) {
    const map = useMap();
    useEffect(() => {
        if (target) {
            map.flyTo(target, 14, { animate: true, duration: 1.5 });
        }
    }, [target, map]);
    return null;
}

export default function FleetDashboard() {
    const { getToken } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchTarget, setSearchTarget] = useState<L.LatLng | null>(null);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const data = await getPendingRequests(token);
            setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPending(); }, []);

    const handleClaim = async (id: string) => {
        setClaimingId(id);
        try {
            const token = await getToken();
            const res = await claimPickUpRequest(id, token);
            if (res.ok) {
                setRequests(prev => prev.filter(req => req.id !== id));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setClaimingId(null);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setSearchTarget(new L.LatLng(parseFloat(lat), parseFloat(lon)));
            }
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="w-full flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
            
            {/* LIGHT SIDEBAR: Minimalist & Clean */}
            <div className="w-full lg:w-1/3 flex flex-col bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
                {/* Header is now white with an emerald top-border accent */}
                <div className="p-6 border-b border-slate-100 bg-white border-t-4 border-t-emerald-500">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 mb-3 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] tracking-widest uppercase">
                        <Activity size={12} /> Live Dispatch
                    </div>
                    <h2 className="text-xl font-black tracking-tight text-slate-900">Fleet Command</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Available Extractions: <span className="text-emerald-600 font-bold">{requests.length}</span></p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                    {loading ? (
                        <div className="text-center p-8 text-slate-400 font-medium">Scanning network...</div>
                    ) : requests.length === 0 ? (
                        <div className="text-center p-8 text-slate-400 flex flex-col items-center">
                            <AlertTriangle size={32} className="mb-3 opacity-30 text-slate-400" />
                            <span className="font-bold text-slate-600">Grid is clear</span>
                        </div>
                    ) : (
                        requests.map((req) => (
                            <div key={req.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="space-y-1">
                                        <div className="font-bold text-slate-900 leading-tight">{req.brandAndModel || req.category}</div>
                                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                                            <MapPin size={12} className="text-emerald-500" /> {req.pickUpAddress}
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 text-white px-2.5 py-1 rounded-lg text-xs font-black tracking-tight">
                                        ৳{req.estimatedValue.toLocaleString()}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 mb-5 py-3 border-y border-slate-50">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 bg-slate-50 p-2 rounded-lg">
                                        <Weight size={14} className="text-emerald-500"/> {req.weightKg} kg
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 bg-slate-50 p-2 rounded-lg">
                                        <Cpu size={14} className="text-emerald-500"/> Cond: {req.condition}
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleClaim(req.id)}
                                    disabled={claimingId === req.id}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_4px_12px_-2px_rgba(16,185,129,0.3)] transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {claimingId === req.id ? "Syncing..." : "Assign to Me"}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* MAP: Still Dark for contrast, but refined */}
            <div className="w-full lg:w-2/3 rounded-2xl overflow-hidden shadow-sm ring-1 ring-slate-200 bg-slate-50 relative">
                
                <div className="absolute top-4 left-4 z-[1000] w-full max-w-sm pr-8 lg:pr-0">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Scan city sector..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-semibold shadow-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-95"
                        >
                            Scan
                        </button>
                    </form>
                </div>

                <MapContainer center={[23.8103, 90.4125]} zoom={12} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                    {/* Swapping to a slightly more detailed dark mode (Voyager Dark) */}
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    
                    {requests.map(req => (
                        <Marker key={req.id} position={[req.latitude, req.longitude]} icon={pendingIcon}>
                            <Popup className="font-sans">
                                <div className="p-1">
                                    <div className="font-black text-slate-900 text-sm mb-1">{req.category}</div>
                                    <div className="text-xs font-bold text-emerald-600 mb-3">Est: ৳{req.estimatedValue}</div>
                                    <button 
                                        onClick={() => handleClaim(req.id)}
                                        className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest w-full hover:bg-black transition-colors"
                                    >
                                        Claim Now
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                    <MapFlyTo target={searchTarget} />
                </MapContainer>
            </div>
        </div>
    );
}