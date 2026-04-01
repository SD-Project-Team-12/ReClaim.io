import RequestPickUp from "../features/pickup/components/RequestForm";
import { Sparkles } from "lucide-react";

export default function RequestPickupPage() {
  return (
    <div className="w-full animate-in fade-in duration-500 relative z-0">
      <div className="mb-8 border-b border-slate-200/60 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-emerald-50 text-emerald-600 font-semibold text-xs tracking-wide border border-emerald-100">
          <Sparkles size={14} /> AI Valuation Active
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Deploy Pickup Request</h2>
        <p className="mt-2 text-slate-500 font-medium max-w-2xl">
          Drop a pin on the map to set your extraction point. Our heuristic engine will instantly calculate the spot market value of your hardware.
        </p>
      </div>
      
      <RequestPickUp />
      
    </div>
  );
}