import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import {
    MapPin, Cpu, Weight, AlertTriangle, Search, Activity,
    ChevronLeft, ChevronRight, ImageOff, Truck, CheckCircle,
    ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom"; 

// Import the new API methods you just added!
import { getPendingRequests, claimPickUpRequest, getMyAssignments, updateRequestStatus } from "../../../api/pickupApi";

// Gold marker for pending items
const pendingIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// Blue marker for assigned items
const assignedIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

function MapFlyTo({ target }: { target: L.LatLng | null }) {
    const map = useMap();
    useEffect(() => {
        if (target) map.flyTo(target, 14, { animate: true, duration: 1.5 });
    }, [target, map]);
    return null;
}

// Quick helper for conditions
const getConditionLabel = (cond: number) => {
    switch (cond) {
        case 0: return "Scrap";
        case 1: return "Damaged";
        case 2: return "Working";
        default: return "Unknown";
    }
};

function ImageCarousel({ urls }: { urls?: string[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!urls || urls.length === 0) {
        return (
            <div className="w-full h-32 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400 mb-3 ring-1 ring-slate-200">
                <ImageOff size={24} className="mb-2 opacity-50" />
                <span className="text-[10px] uppercase tracking-widest font-bold">No Image Provided</span>
            </div>
        );
    }

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? urls.length - 1 : prev - 1));
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === urls.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 group ring-1 ring-slate-200 shadow-sm">
            <img src={urls[currentIndex]} alt="E-waste condition" className="w-full h-full object-cover" />
            {urls.length > 1 && (
                <>
                    <button onClick={handlePrev} className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1 bg-slate-900/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-900/90 backdrop-blur-sm">
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={handleNext} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 bg-slate-900/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-900/90 backdrop-blur-sm">
                        <ChevronRight size={16} />
                    </button>
                    <div className="absolute bottom-1.5 right-1.5 bg-slate-900/70 text-white text-[9px] px-2 py-0.5 rounded-md font-bold shadow-sm backdrop-blur-md tracking-wider">
                        {currentIndex + 1} / {urls.length}
                    </div>
                </>
            )}
        </div>
    );
}

export default function FleetDashboard() {
    const { getToken } = useAuth();
    const navigate = useNavigate();

    // UI State
    const [activeTab, setActiveTab] = useState<"pending" | "assigned">("pending");
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Data State
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [myAssignments, setMyAssignments] = useState<any[]>([]);

    // Map Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchTarget, setSearchTarget] = useState<L.LatLng | null>(null);

    // Fetch both datasets
    const fetchData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const [pending, assigned] = await Promise.all([
                getPendingRequests(token),
                getMyAssignments(token)
            ]);
            setPendingRequests(pending);
            setMyAssignments(assigned);
        } catch (error) {
            console.error("Dashboard sync error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Action 1: Claim a Pending Request
    const handleClaim = async (id: string) => {
        setProcessingId(id);
        try {
            const token = await getToken();
            const res = await claimPickUpRequest(id, token);
            if (res.ok) {
                // Move it from pending array to assignments array locally!
                const claimedItem = pendingRequests.find(r => r.id === id);
                setPendingRequests(prev => prev.filter(req => req.id !== id));
                if (claimedItem) {
                    setMyAssignments(prev => [...prev, { ...claimedItem, status: 1 }]);
                }
                alert("Successfully assigned to your route!");
            }
        } catch (error) {
            alert("Failed to assign request.");
        } finally {
            setProcessingId(null);
        }
    };

    // Action 2: Mark Assigned Request as Picked Up
    const handlePickUp = async (id: string) => {
        if (!window.confirm("Confirm you have physically collected this item?")) return;

        setProcessingId(id);
        try {
            const token = await getToken();
            // 2 is the Enum for 'PickedUp'
            const res = await updateRequestStatus(id, 2, token);
            if (res.ok) {
                // Remove from local list so the driver knows it's done
                setMyAssignments(prev => prev.filter(req => req.id !== id));
                alert("Extraction logged successfully!");
            }
        } catch (error) {
            alert("Failed to update status.");
        } finally {
            setProcessingId(null);
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

    // Decide which list to show based on the active tab
    const activeList = activeTab === "pending" ? pendingRequests : myAssignments;

    return (
        <div className="w-full flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">

            {/* SIDEBAR */}
            <div className="w-full lg:w-1/3 flex flex-col bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">

                {/* Header & Tabs */}
                <div className="border-b border-slate-100 bg-white">
                    <div className="p-6 pb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xl font-black tracking-tight text-slate-900">Fleet Command</h2>
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                                {activeList.length} Nodes
                            </span>
                        </div>

                        {/* Tab Toggles */}
                        <div className="flex p-1 bg-slate-100 rounded-lg">
                            <button
                                onClick={() => setActiveTab("pending")}
                                className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold py-2 rounded-md transition-all ${activeTab === "pending" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                <Activity size={14} /> Live Dispatch
                            </button>
                            <button
                                onClick={() => setActiveTab("assigned")}
                                className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold py-2 rounded-md transition-all ${activeTab === "assigned" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                <Truck size={14} /> My Route
                            </button>
                        </div>
                    </div>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                    {loading ? (
                        <div className="text-center p-8 text-slate-400 font-medium">Scanning network...</div>
                    ) : activeList.length === 0 ? (
                        <div className="text-center p-8 text-slate-400 flex flex-col items-center">
                            <AlertTriangle size={32} className="mb-3 opacity-30 text-slate-400" />
                            <span className="font-bold text-slate-600">
                                {activeTab === "pending" ? "Grid is clear" : "No active assignments"}
                            </span>
                        </div>
                    ) : (
                        activeList.map((req) => (
                            <div key={req.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md">

                                {/* New header with Details link */}
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">ID: {req.id}</span>
                                    <button
                                        onClick={() => navigate(`/request/${req.id}`)}
                                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest flex items-center gap-1"
                                    >
                                        Details <ExternalLink size={12} />
                                    </button>
                                </div>

                                <ImageCarousel urls={req.imageUrls} />

                                <div className="flex justify-between items-start mb-3">
                                    <div className="space-y-1">
                                        <div className="font-bold text-slate-900 leading-tight">{req.brandAndModel || req.category}</div>
                                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                                            <MapPin size={12} className={activeTab === "pending" ? "text-emerald-500" : "text-blue-500"} />
                                            {req.pickUpAddress}
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 text-white px-2.5 py-1 rounded-lg text-xs font-black tracking-tight shrink-0">
                                        ৳{req.estimatedValue.toLocaleString()}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4 py-3 border-y border-slate-50">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 bg-slate-50 p-2 rounded-lg">
                                        <Weight size={14} className="text-slate-400" /> {req.weightKg} kg
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 bg-slate-50 p-2 rounded-lg">
                                        <Cpu size={14} className="text-slate-400" /> Cond: {getConditionLabel(req.condition)}
                                    </div>
                                </div>

                                {/* Dynamic Button based on Tab */}
                                {activeTab === "pending" ? (
                                    <button
                                        onClick={() => handleClaim(req.id)}
                                        disabled={processingId === req.id}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_4px_12px_-2px_rgba(16,185,129,0.3)] transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {processingId === req.id ? "Syncing..." : "Assign to Me"}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handlePickUp(req.id)}
                                        disabled={processingId === req.id}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 shadow-[0_4px_12px_-2px_rgba(37,99,235,0.3)] transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {processingId === req.id ? "Syncing..." : <><CheckCircle size={16} /> Confirm Pickup</>}
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* MAP VIEW */}
            <div className="w-full lg:w-2/3 rounded-2xl overflow-hidden shadow-sm ring-1 ring-slate-200 bg-slate-50 relative">

                <div className="absolute top-4 left-4 z-[1000] w-full max-w-sm pr-8 lg:pr-0">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Scan city sector..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-semibold shadow-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-95">
                            Scan
                        </button>
                    </form>
                </div>

                <MapContainer center={[23.8103, 90.4125]} zoom={12} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

                    {/* Render Pins based on the active tab */}
                    {activeList.map(req => (
                        <Marker
                            key={req.id}
                            position={[req.latitude, req.longitude]}
                            icon={activeTab === "pending" ? pendingIcon : assignedIcon}
                        >
                            <Popup className="font-sans w-56">
                                <div className="p-1">
                                    <ImageCarousel urls={req.imageUrls} />

                                    <div className="font-black text-slate-900 text-base mb-0.5 leading-tight">{req.brandAndModel || req.category}</div>
                                    <div className="text-[10px] font-bold text-slate-500 mb-2.5 uppercase tracking-wide">{req.weightKg} kg • Cond: {getConditionLabel(req.condition)}</div>

                                    <div className="text-sm font-black text-slate-700 mb-3 bg-slate-100 py-1.5 px-2.5 rounded-lg inline-block border border-slate-200">
                                        Est: ৳{req.estimatedValue.toLocaleString()}
                                    </div>

                                    {activeTab === "pending" ? (
                                        <button onClick={() => handleClaim(req.id)} className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest w-full hover:bg-emerald-700 transition-colors">
                                            Claim Extraction
                                        </button>
                                    ) : (
                                        <button onClick={() => handlePickUp(req.id)} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest w-full hover:bg-blue-700 transition-colors">
                                            Confirm Pickup
                                        </button>
                                    )}
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