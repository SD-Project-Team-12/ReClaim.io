import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { 
  Wallet, Leaf, Package, ArrowRight, MessageSquare, 
  Sparkles, Store, Clock, Loader2, ImageOff, 
  TrendingUp, DollarSign, MapPin 
} from "lucide-react";
import { motion} from "framer-motion"; 
import type { Variants } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";

import RequestPickUp from "../features/pickup/components/RequestForm";
import { getMyRequests, getUserAnalytics } from "../api/pickupApi"; 

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 300, damping: 24 } 
  }
};

const getStatusBadge = (status: number) => {
  const configs: any = {
    0: { label: "Pending", class: "bg-amber-100/80 text-amber-700 border-amber-200" },
    1: { label: "Assigned", class: "bg-blue-100/80 text-blue-700 border-blue-200" },
    2: { label: "In Transit", class: "bg-indigo-100/80 text-indigo-700 border-indigo-200" },
    3: { label: "Completed", class: "bg-emerald-100/80 text-emerald-700 border-emerald-200" }
  };
  const config = configs[status] || configs[0];
  return (
    <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase border tracking-wider shadow-sm ${config.class}`}>
      {config.label}
    </span>
  );
};

export default function Dashboard() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalWeight: 0, totalEarnings: 0 });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = await getToken();
        if (token) {
          const [analyticsRes, requestsRes] = await Promise.all([
            getUserAnalytics(token).catch(() => ({ totalWeight: 0, totalEarnings: 0, graphData: [] })),
            getMyRequests(token).catch(() => [])
          ]);

          setStats({
            totalWeight: analyticsRes.totalWeight || 0,
            totalEarnings: analyticsRes.totalEarnings || 0,
          });
          setMonthlyData(analyticsRes.graphData || []);
          setRequests(requestsRes || []);
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
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 border-4 border-emerald-100 rounded-full animate-ping"></div>
          <Loader2 className="animate-spin text-emerald-500 relative z-10" size={40} />
        </div>
        <span className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Syncing Command Center...</span>
      </div>
    );
  }

  const activeRequests = requests.filter(r => r.status < 3 && r.status >= 0);
  const activeCount = activeRequests.length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-12 pb-16">
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-slate-200/60 gap-4"
      >
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Welcome back!</h2>
          <p className="mt-2 text-slate-500 font-medium text-lg">Track your transactions, environmental impact, and active listings.</p>
        </div>
        <Link to="/chat" className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:bg-black hover:-translate-y-0.5 active:scale-95 transition-all">
          <MessageSquare size={16} /> Open Messages
        </Link>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-12">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="group relative bg-gradient-to-br from-white to-slate-50 p-6 rounded-[2rem] shadow-sm hover:shadow-xl ring-1 ring-slate-900/5 hover:ring-emerald-500/30 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors"></div>
            <div className="relative">
              <div className="flex items-center gap-3 text-slate-500 font-bold uppercase text-xs tracking-widest mb-4">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-transform"><Wallet size={18} /></div> 
                Total Transaction
              </div>
              <div className="text-4xl font-black text-slate-900 flex items-baseline gap-1 tracking-tight">
                <span className="text-2xl text-slate-400 font-semibold">৳</span>{stats.totalEarnings.toLocaleString()}
              </div>
              <p className="text-xs text-emerald-600 font-bold mt-3 flex items-center gap-1 bg-emerald-50 w-max px-2.5 py-1 rounded-md">Lifetime completed value</p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="group relative bg-gradient-to-br from-white to-slate-50 p-6 rounded-[2rem] shadow-sm hover:shadow-xl ring-1 ring-slate-900/5 hover:ring-emerald-500/30 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors"></div>
            <div className="relative">
              <div className="flex items-center gap-3 text-slate-500 font-bold uppercase text-xs tracking-widest mb-4">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-110 group-hover:-rotate-3 transition-transform"><Leaf size={18} /></div> 
                E-Waste Diverted
              </div>
              <div className="text-4xl font-black text-slate-900 flex items-baseline gap-1 tracking-tight">
                {stats.totalWeight.toFixed(1)}<span className="text-xl text-slate-400 font-semibold">kg</span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-3 bg-slate-100 w-max px-2.5 py-1 rounded-md">Saved from landfills</p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="group relative bg-gradient-to-br from-white to-slate-50 p-6 rounded-[2rem] shadow-sm hover:shadow-xl ring-1 ring-slate-900/5 hover:ring-amber-500/30 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors"></div>
            <div className="relative">
              <div className="flex items-center gap-3 text-slate-500 font-bold uppercase text-xs tracking-widest mb-4">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl group-hover:scale-110 transition-transform"><Package size={18} /></div> 
                Active Inventory
              </div>
              <div className="text-4xl font-black text-slate-900 tracking-tight">
                {activeCount} <span className="text-xl text-slate-400 font-semibold">Items</span>
              </div>
              <p className="text-xs text-amber-600 font-bold mt-3 flex items-center gap-1 bg-amber-50 w-max px-2.5 py-1 rounded-md">Awaiting pickup/buyers</p>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={itemVariants} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm hover:shadow-lg ring-1 ring-slate-900/5 transition-shadow">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={20} /></div> Monthly Impact (KG)
              </h3>
            </div>
            <div className="h-[280px] w-full">
              {monthlyData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                   <TrendingUp className="text-slate-300 mb-2 opacity-50" size={32} />
                   <span className="font-semibold text-sm">No recycling data yet.</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }} />
                    <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)", fontWeight: "bold" }} />
                    <Bar dataKey="weight" fill="#10b981" radius={[8, 8, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm hover:shadow-lg ring-1 ring-slate-900/5 transition-shadow">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-lg"><DollarSign size={20} /></div> Monthly Transaction (BDT)
              </h3>
            </div>
            <div className="h-[280px] w-full">
              {monthlyData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                   <DollarSign className="text-slate-300 mb-2 opacity-50" size={32} />
                   <span className="font-semibold text-sm">No Transaction data yet.</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }} />
                    <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)", fontWeight: "bold" }} />
                    <Area type="monotone" dataKey="earnings" stroke="#0d9488" strokeWidth={4} fillOpacity={1} fill="url(#colorEarnings)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center justify-between ml-2">
              My Active Listings
              <Link to="/history" className="text-emerald-600 hover:text-emerald-700 normal-case flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full transition-colors">View all <ArrowRight size={14}/></Link>
            </h3>
            
            <div className="bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
              {activeRequests.length === 0 ? (
                <div className="p-12 text-center text-slate-500 font-medium bg-slate-50/50 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4">
                     <ImageOff size={28} className="text-slate-300" />
                  </div>
                  <p>You have no active listings.<br/>Drop a pin below to list a new item!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activeRequests.slice(0, 5).map((req) => (
                    <Link to={`/request/${req.id}`} key={req.id} className="p-5 flex items-center gap-5 hover:bg-slate-50 transition-colors cursor-pointer group">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-slate-200/50 group-hover:border-emerald-200 transition-colors">
                        {req.imageUrls?.length > 0 ? (
                          <img src={req.imageUrls[0]} alt="Item" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <ImageOff size={24} className="text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-lg truncate group-hover:text-emerald-600 transition-colors">{req.brandAndModel || req.category}</h4>
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-500 mt-1">
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[150px]"><MapPin size={12}/> {req.pickUpAddress}</span>
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap"><Package size={12}/> {req.weightKg}kg</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-2">
                        <div className="font-black text-xl text-emerald-600 tracking-tight">৳{req.estimatedValue?.toLocaleString() || 0}</div>
                        {getStatusBadge(req.status)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest ml-2">Quick Access</h3>
            
            <Link to="/marketplace" className="block w-full bg-white p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 ring-1 ring-slate-900/5 transition-all duration-300 group overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity"><Store size={100} /></div>
              <div className="bg-slate-50 p-3.5 rounded-2xl w-fit mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 text-slate-700 shadow-sm border border-slate-100"><Store size={24} /></div>
              <h4 className="font-black text-slate-900 text-xl mb-1 group-hover:text-emerald-600 transition-colors">Browse Marketplace</h4>
              <p className="text-slate-500 text-sm font-medium relative z-10">Find recycled components listed by other users.</p>
            </Link>

            <Link to="/history" className="block w-full bg-white p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 ring-1 ring-slate-900/5 transition-all duration-300 group overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity"><Clock size={100} /></div>
              <div className="bg-slate-50 p-3.5 rounded-2xl w-fit mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300 text-slate-700 shadow-sm border border-slate-100"><Clock size={24} /></div>
              <h4 className="font-black text-slate-900 text-xl mb-1 group-hover:text-blue-600 transition-colors">My History</h4>
              <p className="text-slate-500 text-sm font-medium relative z-10">View past requests and completed pickups.</p>
            </Link>
          </motion.div>
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-12"></div>
      </motion.div>
    </div>
  );
}