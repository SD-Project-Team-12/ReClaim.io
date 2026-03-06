import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import { 
 ArrowLeft, MapPin, Cpu, Weight, Zap, ImageOff, Loader2, 
 Clock, CheckCircle, Navigation, Phone, Mail, Truck, User as UserIcon, MessageSquare // <-- Added MessageSquare
} from "lucide-react";
import { getRequestById, updateRequestStatus, claimPickUpRequest } from "../api/pickupApi";

const emeraldIcon = new L.Icon({
 iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
 shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
 iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const getStatusData = (status: number) => {
 const data: Record<number, { label: string; color: string }> = {
  0: { label: "Pending Dispatch", color: "text-amber-600 bg-amber-50 ring-amber-200" },
  1: { label: "Driver Assigned", color: "text-blue-600 bg-blue-50 ring-blue-200" },
  2: { label: "Picked Up", color: "text-indigo-600 bg-indigo-50 ring-indigo-200" },
  3: { label: "Completed", color: "text-emerald-600 bg-emerald-50 ring-emerald-200" }
 };
 return data[status] || { label: "Unknown", color: "text-slate-600 bg-slate-50 ring-slate-200" };
};

export default function RequestDetails() {
 const { id } = useParams<{ id: string }>();
 const navigate = useNavigate();
 const { getToken } = useAuth();
 const { user } = useUser();
 
 const [request, setRequest] = useState<any>(null);
 const [contactInfo, setContactInfo] = useState({ name: "", phone: "" });
 const [loading, setLoading] = useState(true);
 const [isUpdating, setIsUpdating] = useState(false);
 const [activeImage, setActiveImage] = useState<string | null>(null);
 const userRole = user?.publicMetadata?.role as string || "citizen";

 useEffect(() => {
  (async () => {
   if (!id) return;
   try {
    const token = await getToken();
    const data = await getRequestById(id, token);
    setRequest(data.request);
    setContactInfo({ name: data.contactName, phone: data.contactPhone });
    if (data.request?.imageUrls?.length > 0) setActiveImage(data.request.imageUrls[0]);
   } catch (err) { console.error(err); } 
   finally { setLoading(false); }
  })();
 }, [id, getToken]);

 const handleAction = async (action: "claim" | "status", newStatus?: number) => {
  const confirmMsg = action === "claim" ? "Assign this to your route?" : `Mark as ${getStatusData(newStatus!).label}?`;
  if (!id || !window.confirm(confirmMsg)) return;
  
  setIsUpdating(true);
  try {
   const token = await getToken();
   const res = action === "claim" ? await claimPickUpRequest(id, token) : await updateRequestStatus(id, newStatus!, token);
   
   if (res.ok) setRequest({ ...request, status: newStatus ?? 1 });
   else alert("Update failed. You may not be authorized for this node.");
  } catch (err) { alert("Sync error."); } 
  finally { setIsUpdating(false); }
 };

 if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>;
 if (!request) return <div className="text-center py-20 text-slate-500 font-bold">Record not found.</div>;

 return (
  <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-12 px-4">
   <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors group">
    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back
   </button>

   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
    <div>
     <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{request.brandAndModel || request.category}</h1>
     <p className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold mt-1 w-fit uppercase tracking-wider">ID: {request.id}</p>
    </div>
    <div className={`px-4 py-1.5 rounded-full ring-1 font-bold text-sm uppercase ${getStatusData(request.status).color}`}>{getStatusData(request.status).label}</div>
   </div>

   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
    <div className="space-y-4 sticky top-6">
     <div className="w-full h-[450px] bg-slate-100 rounded-3xl overflow-hidden ring-1 ring-slate-200 flex items-center justify-center">
      {activeImage ? <img src={activeImage} className="w-full h-full object-cover" alt="E-waste" /> : <ImageOff size={48} className="text-slate-300" />}
     </div>
     <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {request.imageUrls?.map((url: string, i: number) => (
       <button key={i} onClick={() => setActiveImage(url)} className={`w-20 h-20 rounded-xl overflow-hidden ring-2 transition-all ${activeImage === url ? 'ring-emerald-500 scale-95' : 'ring-transparent opacity-60'}`}>
        <img src={url} className="w-full h-full object-cover" alt="thumbnail" />
       </button>
      ))}
     </div>
    </div>

    <div className="space-y-6">
     
     {request.status < 3 && (userRole === "admin" || userRole === "recycler") && (
      <div className="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-200 border-t-4 border-slate-900">
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-3">Logistics Actions</p>
       {request.status === 0 && <button onClick={() => handleAction("claim")} disabled={isUpdating} className="w-full py-4 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-95 disabled:opacity-50"><CheckCircle size={16}/> Assign to My Route</button>}
       {request.status === 1 && <button onClick={() => handleAction("status", 2)} disabled={isUpdating} className="w-full py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-black active:scale-95 disabled:opacity-50"><Truck size={16}/> Confirm Collection</button>}
       {request.status === 2 && <button onClick={() => handleAction("status", 3)} disabled={isUpdating} className="w-full py-4 bg-blue-600 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 disabled:opacity-50"><CheckCircle size={16}/> Finalize Order</button>}
      </div>
     )}

     <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px]" />
      <span className="text-[10px] uppercase text-emerald-400 font-bold block mb-1">Calculated Valuation</span>
      <div className="text-5xl font-black tracking-tighter flex items-baseline gap-2"><span className="text-2xl text-emerald-500">৳</span>{request.estimatedValue.toLocaleString()}</div>
     </div>

     <div className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-200">
      <h3 className="text-xs font-black text-slate-400 uppercase border-b pb-3 mb-4 flex gap-2"><Cpu size={14}/> Technical Specs</h3>
      <div className="grid grid-cols-2 gap-y-6">
       <div><p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Weight</p><p className="font-bold flex items-center gap-2"><Weight size={14} className="text-slate-300"/>{request.weightKg} kg</p></div>
       <div><p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Condition</p><p className="font-bold">{["Scrap", "Damaged", "Working"][request.condition]}</p></div>
       <div><p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Power Status</p><p className="font-bold flex items-center gap-2"><Zap size={14} className={request.isPoweringOn ? "text-amber-500" : "text-slate-300"}/>{request.isPoweringOn ? "Operational" : "Dead"}</p></div>
       <div><p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Listed On</p><p className="font-bold flex items-center gap-2"><Clock size={14} className="text-slate-300"/>{new Date(request.createdAt).toLocaleDateString()}</p></div>
       <div className="col-span-2 pt-4 border-t italic text-sm text-slate-600">"{request.itemDescription || "No owner notes provided"}"</div>
      </div>
     </div>

     <div className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-200">
      <h3 className="text-xs font-black text-slate-400 uppercase border-b pb-3 mb-4 flex gap-2"><MapPin size={14}/> Location Intelligence</h3>
      <p className="text-sm font-bold text-slate-800 mb-4">{request.pickUpAddress}</p>
      <div className="w-full h-48 rounded-2xl overflow-hidden ring-1 ring-slate-200 mb-4">
       <MapContainer center={[request.latitude, request.longitude]} zoom={14} scrollWheelZoom={false} style={{ height: '100%' }} zoomControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        <Marker position={[request.latitude, request.longitude]} icon={emeraldIcon} />
       </MapContainer>
      </div>
      <a href={`https://www.google.com/maps/dir/?api=1&destination=${request.latitude},${request.longitude}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase hover:bg-emerald-700 active:scale-95 shadow-md"><Navigation size={14} /> Start Navigation</a>
     </div>

     {/* SELLER & CONTACT INFORMATION */}
     <div className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-200 border-l-4 border-emerald-500 grid grid-cols-2 gap-4">
        <div className="col-span-2 text-xs font-black text-slate-400 uppercase flex gap-2">
            <UserIcon size={14}/> Seller Information
        </div>
        
        <div className="col-span-2 flex items-center justify-between bg-slate-50 p-3 rounded-xl">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 text-emerald-400 rounded-full flex items-center justify-center font-black text-lg">
                    {contactInfo.name?.charAt(0) || "U"}
                </div>
                <div>
                    <p className="font-black text-slate-900 truncate">{contactInfo.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Member</p>
                </div>
            </div>
            
            <button 
                onClick={() => navigate('/chat', { 
                    state: { preselectUserId: request.citizenId, preselectUserName: contactInfo.name } 
                })}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors rounded-lg text-xs font-black uppercase"
            >
                <MessageSquare size={14} /> Message
            </button>
        </div>

        {request.status > 0 && (
            <>
                <a href={`tel:${contactInfo.phone}`} className="flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-black active:scale-95"><Phone size={14}/> Call</a>
                <a href={`https://wa.me/${contactInfo.phone.replace(/\+/g, '')}?text=Hi%20${contactInfo.name}...`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-3.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-100 active:scale-95"><Mail size={14}/> WhatsApp</a>
            </>
        )}
     </div>
    </div>
   </div>
  </div>
 );
}