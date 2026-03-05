import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, Cpu, MonitorSmartphone, Map as MapIcon, Zap, Search } from "lucide-react";
import { ItemCondition, type PickUpRequest } from "../../../types/pickup";
import { submitPickUpRequest } from "../../../api/pickupApi";
import ImageDropzone from "../../../components/common/ImageDropZone";

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

interface RequestFormProps {
    onSuccess?: () => void;
}

// Helper Component: Forces the map to fly to a new location when searched
function MapFlyTo({ target }: { target: L.LatLng | null }) {
    const map = useMap();
    useEffect(() => {
        if (target) {
            map.flyTo(target, 15, { animate: true, duration: 1.5 });
        }
    }, [target, map]);
    return null;
}

export default function RequestPickUp({ onSuccess }: RequestFormProps) {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [estimate, setEstimate] = useState(0);
    const [position, setPosition] = useState<L.LatLng>(new L.LatLng(23.8103, 90.4125));

    // Search States
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchTarget, setSearchTarget] = useState<L.LatLng | null>(null);

    const [formData, setFormData] = useState<Partial<PickUpRequest>>({
        category: "Computing",
        subCategory: "General",
        brandAndModel: "",
        itemDescription: "No description provided",
        condition: ItemCondition.Working,
        weightKg: 1,
        isPoweringOn: false,
        pickUpAddress: "",
        preferredPickUpTime: new Date().toISOString().slice(0, 16),
        latitude: 23.8103,
        longitude: 90.4125,
        imageUrls: [],
    });

    useEffect(() => {
        let base = formData.category === "Computing" ? 200 : 100;
        let currentEstimate = (formData.weightKg || 1) * base;
        if (formData.isPoweringOn) currentEstimate += 500;
        setEstimate(currentEstimate);
    }, [formData]);

    // Handle the Geocoding API Request
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            // Using OpenStreetMap's free Nominatim API
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const newPos = new L.LatLng(parseFloat(lat), parseFloat(lon));

                setPosition(newPos); // Move the pin
                setSearchTarget(newPos); // Trigger the map to fly there
                setFormData({ ...formData, latitude: newPos.lat, longitude: newPos.lng });
            } else {
                alert("Location not found. Try adding a city name.");
            }
        } catch (error) {
            console.error("Geocoding error:", error);
            alert("Search failed. Please try again.");
        } finally {
            setIsSearching(false);
        }
    };

    function LocationMarker() {
        const markerRef = useRef<L.Marker>(null);

        useMapEvents({
            click(e) {
                setPosition(e.latlng);
                setFormData({ ...formData, latitude: e.latlng.lat, longitude: e.latlng.lng });
            },
        });

        const eventHandlers = useMemo(
            () => ({
                dragend() {
                    const marker = markerRef.current;
                    if (marker != null) {
                        const newPos = marker.getLatLng();
                        setPosition(newPos);
                        setFormData({ ...formData, latitude: newPos.lat, longitude: newPos.lng });
                    }
                },
            }),
            [formData]
        );

        return position === null ? null : (
            <Marker draggable={true} eventHandlers={eventHandlers} position={position} ref={markerRef}>
                <Popup className="font-sans font-medium text-slate-700">Extraction Point Set</Popup>
            </Marker>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = await getToken();
            const response = await submitPickUpRequest(formData, token);

            if (response.ok) {
                alert("Pickup Requested Successfully!");
                if (onSuccess) onSuccess();
            }
        } catch (err) {
            alert("Network error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        // 1. Increased height from 540px to 650px
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 overflow-hidden flex flex-col lg:flex-row lg:h-[650px]">

            {/* LEFT SIDE: Split into Scrollable Form + Sticky Footer */}
            <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col bg-white">

                {/* SCROLLABLE FORM AREA */}
                <div className="p-5 flex-1 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Segmented Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                                    <MonitorSmartphone size={14} className="text-emerald-500" /> Category
                                </label>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    {["Computing", "Mobile", "Appliances"].map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, category: cat })}
                                            className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all ${formData.category === cat ? "bg-white shadow-sm text-emerald-600 ring-1 ring-slate-900/5" : "text-slate-500 hover:text-slate-700"
                                                }`}
                                        >
                                            {cat === "Appliances" ? "Other" : cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                                    <Cpu size={14} className="text-emerald-500" /> Condition
                                </label>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    {[
                                        { label: "Working", val: ItemCondition.Working },
                                        { label: "Damaged", val: ItemCondition.Damaged },
                                        { label: "Dead", val: ItemCondition.Scrap },
                                    ].map((cond) => (
                                        <button
                                            key={cond.label}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, condition: cond.val })}
                                            className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all ${formData.condition === cond.val ? "bg-white shadow-sm text-emerald-600 ring-1 ring-slate-900/5" : "text-slate-500 hover:text-slate-700"
                                                }`}
                                        >
                                            {cond.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Text Inputs */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Brand & Model</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Dell XPS 13"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium placeholder-slate-400"
                                    onChange={(e) => setFormData({ ...formData, brandAndModel: e.target.value })}
                                />
                            </div>
                            <div className="w-24">
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Weight(Kg)</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium text-center"
                                    value={formData.weightKg}
                                    onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        {/* Inline Power Toggle + Description */}
                        <div className="flex gap-3 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2 pl-2 border-r border-slate-200 pr-3">
                                <Zap size={14} className={formData.isPoweringOn ? "text-emerald-500" : "text-slate-400"} />
                                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Powers On</span>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isPoweringOn: !formData.isPoweringOn })}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${formData.isPoweringOn ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${formData.isPoweringOn ? 'translate-x-4.5' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="Optional defects (e.g. broken screen)..."
                                className="flex-1 bg-transparent outline-none text-xs text-slate-700 placeholder-slate-400 font-medium"
                                onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                            />
                        </div>

                        {/* Image Dropzone */}
                        <div className="pt-2">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                                Item Condition Photo
                            </label>
                            <ImageDropzone
                                onUploadComplete={(urls) => setFormData({ ...formData, imageUrls: urls })}
                            />
                        </div>

                        {/* Single-line Address */}
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                                <MapPin size={14} className="text-emerald-500" /> Exact Address
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium placeholder-slate-400"
                                placeholder="House #, Road #, Area..."
                                onChange={(e) => setFormData({ ...formData, pickUpAddress: e.target.value })}
                                required
                            />
                        </div>
                    </form>
                </div>

                {/* STICKY FOOTER: Price Card & Deploy Button */}
                <div className="p-5 bg-white border-t border-slate-100 shrink-0">
                    <div className="bg-slate-900 p-4 rounded-xl text-white shadow-inner flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-1/2 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                        <div className="relative z-10">
                            <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold block mb-0.5">Spot Estimate</span>
                            <div className="text-2xl font-black text-white tracking-tight leading-none">৳ {estimate.toLocaleString()}</div>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="relative z-10 px-6 py-2.5 bg-emerald-primary text-white text-sm font-bold rounded-lg hover:bg-emerald-hover transition-all active:scale-95 disabled:opacity-50 shadow-[0_4px_14px_0_rgba(16,185,129,0.39)]"
                        >
                            {loading ? "Processing..." : "Deploy"}
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: Interactive Map */}
            <div className="w-full lg:w-1/2 h-64 lg:h-full bg-slate-100 relative z-0">
                {/* Floating Search Bar Overlay */}
                <div className="absolute top-4 left-4 right-4 z-[1000]">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search city or area..."
                                className="w-full pl-9 pr-3 py-2.5 bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium shadow-sm text-slate-700"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSearching}
                            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center"
                        >
                            {isSearching ? "..." : "Find"}
                        </button>
                    </form>
                </div>

                <MapContainer center={[23.8103, 90.4125]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />
                    <LocationMarker />
                    <MapFlyTo target={searchTarget} />
                </MapContainer>

                {/* Floating Map Instructions */}
                <div className="absolute bottom-4 right-4 z-[1000] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm ring-1 ring-slate-900/5 font-semibold text-slate-700 text-[10px] uppercase tracking-wide flex items-center gap-1.5 pointer-events-none">
                    <MapIcon size={12} className="text-emerald-500" /> Click or drag to set pin
                </div>
            </div>
        </div>
    );
}