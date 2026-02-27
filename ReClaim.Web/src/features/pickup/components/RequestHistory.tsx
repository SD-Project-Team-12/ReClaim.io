import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { getMyRequests } from "../../../api/pickupApi";

export default function RequestHistory() {
  const { getToken } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
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

  // Inside RequestHistory.tsx, add this helper
const getStatusBadge = (status: number) => {
  const statuses: Record<number, { label: string; color: string }> = {
    0: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
    1: { label: "Assigned", color: "bg-blue-100 text-blue-700" },
    2: { label: "Picked Up", color: "bg-purple-100 text-purple-700" },
    3: { label: "Completed", color: "bg-green-100 text-green-700" },
    4: { label: "Cancelled", color: "bg-red-100 text-red-700" },
  };

  const s = statuses[status] || statuses[0];
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${s.color}`}>
      {s.label}
    </span>
  );
};

  useEffect(() => { fetchHistory(); }, []);

  if (loading) return <div className="p-4 text-gray-500 text-sm">Loading history...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex justify-between items-center">
        <h3 className="font-bold text-gray-800">Your ReClaim History</h3>
        <button onClick={fetchHistory} className="text-xs text-green-600 hover:underline">Refresh</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] letter-spacing-widest">
            <tr>
              <th className="px-6 py-3">Item</th>
              <th className="px-6 py-3">Estimate</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {req.brandAndModel || req.category}
                  <span className="block text-[10px] text-gray-400 font-normal">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-green-600 font-bold">৳{req.estimatedValue}</td>
                <td className="px-6 py-4">
                  {getStatusBadge(req.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}