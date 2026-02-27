import { useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { ShieldCheck, Loader2, Building2, UserCheck } from "lucide-react";

export default function VerificationForm() {
    const { getToken } = useAuth();
    const { user } = useUser();
    const [formData, setFormData] = useState({ fullName: "", nidNumber: "", organizationName: "" });
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("submitting");
        try {
            const token = await getToken();
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/apply`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...formData, clerkId: user?.id })
            });

            if (res.ok) setStatus("success");
            else setStatus("error");
        } catch (err) {
            setStatus("error");
        }
    };

    if (status === "success") return (
        <div className="max-w-md mx-auto mt-12 p-8 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
            <ShieldCheck className="mx-auto text-emerald-500 mb-4" size={48} />
            <h2 className="text-xl font-black text-slate-900">Application Submitted</h2>
            <p className="text-slate-600 text-sm mt-2 font-medium">Your credentials are now in the Admin queue for review.</p>
        </div>
    );

    return (
        <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-2xl shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><UserCheck size={24}/></div>
                <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Recycler Verification</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upgrade Account Level</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name (Legal)</label>
                    <input required className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-medium" 
                           placeholder="As shown on NID"
                           onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NID Number</label>
                    <input required className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-medium" 
                           placeholder="10 or 17 digit national ID"
                           onChange={e => setFormData({...formData, nidNumber: e.target.value})} />
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Organization (Optional)</label>
                    <input className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-medium" 
                           placeholder="Company or NGO name"
                           onChange={e => setFormData({...formData, organizationName: e.target.value})} />
                </div>
                
                <button 
                    disabled={status === "submitting"}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                    {status === "submitting" ? <Loader2 className="animate-spin" size={18} /> : "Submit Accreditation"}
                </button>
            </form>
        </div>
    );
}