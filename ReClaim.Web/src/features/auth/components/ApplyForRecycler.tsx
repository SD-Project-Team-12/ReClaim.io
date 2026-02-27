import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { ShieldCheck, FileText, Building2 } from "lucide-react";

export default function ApplyForRecycler() {
    const { getToken } = useAuth();
    const [formData, setFormData] = useState({ nid: "", org: "", fullName: "" });
    const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("submitting");
        const token = await getToken();
        
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/apply-recycler`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify(formData)
        });

        if (res.ok) setStatus("success");
    };

    if (status === "success") return (
        <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-100">
            <ShieldCheck className="mx-auto text-emerald-500 mb-4" size={48} />
            <h2 className="text-xl font-bold text-slate-900">Application Received</h2>
            <p className="text-slate-600">Admin is reviewing your credentials. You'll be notified soon.</p>
        </div>
    );

    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><FileText size={20}/></div>
                <h2 className="text-xl font-bold">Recycler Accreditation</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Full Name (Per NID)</label>
                    <input required className="w-full mt-1 p-3 bg-slate-50 border rounded-xl" 
                           onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">NID Number</label>
                    <input required className="w-full mt-1 p-3 bg-slate-50 border rounded-xl" 
                           onChange={e => setFormData({...formData, nid: e.target.value})} />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Organization (Optional)</label>
                    <input className="w-full mt-1 p-3 bg-slate-50 border rounded-xl" 
                           onChange={e => setFormData({...formData, org: e.target.value})} />
                </div>
                <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all">
                    Submit Application
                </button>
            </form>
        </div>
    );
}