import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import RequestPickUp from "../features/pickup/components/RequestForm";
import RequestHistory from "../features/pickup/components/RequestHistory";

export default function Dashboard() {
  const { getToken } = useAuth();
  const [apiStatus, setApiStatus] = useState<string>("Ready");

  const runTest = async (role: "citizen" | "admin") => {
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5150/api/test/${role}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setApiStatus(`✅ ${role.toUpperCase()} access verified!`);
      } else {
        setApiStatus(`❌ ${role.toUpperCase()} access denied (${res.status})`);
      }
    } catch (err) {
      setApiStatus("❌ API is offline");
    }
  };

  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
      
      {/* Left Column: Stats & Test Tools */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">System Health</h3>
          <div className="text-sm font-medium p-3 bg-gray-50 rounded-lg mb-4 text-gray-600">
            Status: <span className="text-blue-600">{apiStatus}</span>
          </div>
          
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => runTest("citizen")}
              className="w-full py-2 text-xs font-bold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
            >
              Verify Citizen Auth
            </button>
            <button 
              onClick={() => runTest("admin")}
              className="w-full py-2 text-xs font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
            >
              Verify Admin Auth
            </button>
          </div>
        </div>

        <div className="bg-green-600 p-6 rounded-2xl text-white shadow-lg shadow-green-100">
          <h3 className="font-bold mb-2">Did you know?</h3>
          <p className="text-sm opacity-90">
            Recycling one laptop saves enough energy to run a house for 350 hours. 🌍
          </p>
        </div>
      </div>

      {/* Right Column: The Core Form */}
      <div className="lg:col-span-2">
        <RequestPickUp onSuccess={handleRefresh} />
        <RequestHistory key={refreshKey} />
      </div>

    </div>
  );
}