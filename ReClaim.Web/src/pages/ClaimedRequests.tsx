import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { MapPin, Package, Weight, Loader2, ArrowRight, Truck, Clock, CheckCircle2 } from "lucide-react";
import { getMyAssignments } from "../api/pickupApi"; 

export default function ClaimedRequests() {
  const { getToken } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const token = await getToken();
        if (token) {
          const data = await getMyAssignments(token);
          setAssignments(data);
        }
      } catch (error) {
        console.error("Failed to fetch assignments:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [getToken]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  const getStatusDisplay = (status: number) => {
    if (status >= 3) {
      return { 
        text: "Collected", 
        style: "bg-emerald-50 text-emerald-600 border border-emerald-200",
        icon: <CheckCircle2 size={12} className="inline mr-1 mb-0.5" />
      };
    }
    if (status === 2) {
      return { 
        text: "In Transit", 
        style: "bg-indigo-50 text-indigo-600 border border-indigo-200",
        icon: null
      };
    }
    return { 
      text: "Assigned Route", 
      style: "bg-blue-50 text-blue-600 border border-blue-200",
      icon: null
    };
  };

  return (
    <div className="max-w-6xl mx-auto p-6 animate-in fade-in duration-500">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Truck className="text-emerald-500" size={32} /> My Claimed Extractions
        </h2>
        <p className="mt-2 text-slate-500 font-medium">
          View and manage the e-waste pickup requests you have assigned to your route or collected.
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">No Active Claims</h3>
          <p className="text-slate-500 mb-6">You haven't claimed any pickup requests yet.</p>
          <Link to="/fleet" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
            Go to Fleet Map
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((req) => {
            const statusConfig = getStatusDisplay(req.status);

            return (
              <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${statusConfig.style}`}>
                    {statusConfig.icon} {statusConfig.text}
                  </div>
                  <div className="text-lg font-black text-slate-800">
                    ৳{req.estimatedValue?.toLocaleString()}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1">
                  {req.brandAndModel || req.category}
                </h3>
                
                <div className="space-y-2 mt-4 mb-6 flex-1">
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{req.pickUpAddress}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Weight size={16} className="text-slate-400 shrink-0" />
                    <span>{req.weightKg} kg Estimated</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock size={16} className="text-slate-400 shrink-0" />
                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <Link
                  to={`/request/${req.id}`}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors mt-auto"
                >
                  View Details <ArrowRight size={18} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}