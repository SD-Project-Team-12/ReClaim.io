import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Wallet, Leaf, Package, ArrowRight, MessageSquare, Sparkles, Store, Clock, Loader2, ImageOff } from "lucide-react";
import RequestPickUp from "../features/pickup/components/RequestForm";
import { getMyRequests } from "../api/pickupApi";

const getStatusBadge = (status: number) => {
  switch (status) {
    case 0: return <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold uppercase mt-1">Pending</span>;
    case 1: return <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase mt-1">Assigned</span>;
    case 2: return <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase mt-1">Picked Up</span>;
    default: return null;
  }
};

export default function Dashboard() {
  const { getToken } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = await getToken();
        if (token) {
          const data = await getMyRequests(token);
          setRequests(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [getToken]);

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>;
  }

  const completedRequests = requests.filter(r => r.status === 3);
  const activeRequests = requests.filter(r => r.status < 3 && r.status >= 0);

  const totalEarnings = completedRequests.reduce((sum, r) => sum + (r.finalPrice || r.estimatedValue || 0), 0);
  const totalWeight = completedRequests.reduce((sum, r) => sum + (r.weightKg || 0), 0);
  const activeCount = activeRequests.length;

  return (
    <div className="w-full animate-in fade-in duration-500 max-w-6xl mx-auto space-y-12">
      
      {/* --- DASHBOARD METRICS SECTION --- */}
      <div>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-slate-200/60 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-emerald-50 text-emerald-600 font-semibold text-xs tracking-wide border border-emerald-100">
              <Sparkles size={14} /> ReClaim Command Center
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back!</h2>
            <p className="mt-2 text-slate-500 font-medium">Track your earnings, environmental impact, and active listings.</p>
          </div>
          <Link to="/chat" className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-black active:scale-95 transition-all">
            <MessageSquare size={16} /> Open Messages
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-200 border-t-4 border-emerald-500">
            <div className="flex items-center gap-3 text-slate-500 font-bold uppercase text-xs tracking-wider mb-3">
              <Wallet size={16} className="text-emerald-500" /> Total Earnings
            </div>
            <div className="text-3xl font-black text-slate-900 flex items-baseline gap-1">
              <span className="text-lg text-slate-400">৳</span>{totalEarnings.toLocaleString()}
            </div>
            <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">From completed pickups</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-200 border-t-4 border-emerald-500">
            <div className="flex items-center gap-3 text-slate-500 font-bold uppercase text-xs tracking-wider mb-3">
              <Leaf size={16} className="text-emerald-500" /> E-Waste Diverted
            </div>
            <div className="text-3xl font-black text-slate-900 flex items-baseline gap-1">
              {totalWeight.toFixed(1)}<span className="text-lg text-slate-400">kg</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-2">Saved from landfills</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-200 border-t-4 border-slate-900">
            <div className="flex items-center gap-3 text-slate-500 font-bold uppercase text-xs tracking-wider mb-3">
              <Package size={16} className="text-slate-900" /> Active Inventory
            </div>
            <div className="text-3xl font-black text-slate-900">
              {activeCount} <span className="text-lg text-slate-400 font-bold">Items</span>
            </div>
            <p className="text-xs text-amber-600 font-bold mt-2">Awaiting pickup/buyers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
              My Active Listings
              <Link to="/history" className="text-emerald-600 hover:text-emerald-700 normal-case text-xs flex items-center gap-1">View all <ArrowRight size={12}/></Link>
            </h3>
            
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden divide-y divide-slate-100">
              {activeRequests.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-medium">
                  You have no active listings. Drop a pin below to list a new item!
                </div>
              ) : (
                activeRequests.slice(0, 5).map((req) => (
                  <Link to={`/request/${req.id}`} key={req.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                      {req.imageUrls?.length > 0 ? (
                        <img src={req.imageUrls[0]} alt="Item" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <ImageOff size={24} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 truncate">{req.brandAndModel || req.category}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">📍 {req.pickUpAddress} • {req.weightKg}kg</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-emerald-600">৳{req.estimatedValue.toLocaleString()}</div>
                      {getStatusBadge(req.status)}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">Quick Links</h3>
            
            <Link to="/marketplace" className="block w-full bg-white hover:bg-slate-50 p-6 rounded-2xl shadow-sm ring-1 ring-slate-200 transition-all active:scale-95 group">
              <div className="bg-slate-100 p-3 rounded-xl w-fit mb-4 group-hover:bg-slate-200 transition-colors"><Store className="text-slate-700" size={24} /></div>
              <h4 className="font-black text-slate-900 text-lg mb-1">Browse Marketplace</h4>
              <p className="text-slate-500 text-sm font-medium">Find components listed by other users.</p>
            </Link>

            <Link to="/history" className="block w-full bg-white hover:bg-slate-50 p-6 rounded-2xl shadow-sm ring-1 ring-slate-200 transition-all active:scale-95 group">
              <div className="bg-slate-100 p-3 rounded-xl w-fit mb-4 group-hover:bg-slate-200 transition-colors"><Clock className="text-slate-700" size={24} /></div>
              <h4 className="font-black text-slate-900 text-lg mb-1">My History</h4>
              <p className="text-slate-500 text-sm font-medium">View past requests and pickups.</p>
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-slate-200"></div>

      {/* --- ORIGINAL PICKUP REQUEST SECTION --- */}
      <div>
        <div className="mb-8 pb-6">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Deploy Pickup Request</h2>
          <p className="mt-2 text-slate-500 font-medium max-w-2xl">
            Drop a pin on the map to set your extraction point. Our heuristic engine will instantly calculate the spot market value of your hardware.
          </p>
        </div>
        <RequestPickUp />
      </div>

    </div>
  );
}