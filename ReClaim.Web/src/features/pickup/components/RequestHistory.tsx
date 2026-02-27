import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { getMyRequests } from "../../../api/pickupApi";
import { RefreshCw, Clock, Truck, CheckCircle2, XCircle, PackageOpen } from "lucide-react";

export default function RequestHistory() {
  const { getToken } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await getMyRequests(token);
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Professional Badge Styling Logic
  const getStatusBadge = (status: number) => {
    const statuses: Record<number, { label: string; color: string; icon: any }> = {
      0: { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
      1: { label: "Assigned", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Truck },
      2: { label: "Picked Up", color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: Truck },
      3: { label: "Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
      4: { label: "Cancelled", color: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
    };
    return statuses[status] || statuses[0];
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Deployment History</h3>
          <p className="text-sm text-slate-500 font-medium mt-1">Track your e-waste logistics and valuations.</p>
        </div>
        <button 
          onClick={fetchHistory} 
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-emerald-500" : "text-emerald-500"} /> 
          Refresh
        </button>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto bg-white">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-widest font-bold border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Hardware Identifier</th>
              <th className="px-6 py-4">Calculated Value</th>
              <th className="px-6 py-4">Logistics Status</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-100">
            {requests.length === 0 && !loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <PackageOpen size={32} className="mb-3 text-slate-300" />
                    <span className="font-medium text-base text-slate-500">No requests deployed yet.</span>
                    <span className="text-xs mt-1">Visit your dashboard to request a pickup.</span>
                  </div>
                </td>
              </tr>
            ) : (
              requests.map((req) => {
                const badge = getStatusBadge(req.status);
                const BadgeIcon = badge.icon;
                
                return (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{req.brandAndModel || req.category}</div>
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">৳ {req.estimatedValue.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold uppercase tracking-wide ${badge.color}`}>
                        <BadgeIcon size={12} />
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}