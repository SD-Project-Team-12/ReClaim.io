import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
    Users,
    Package,
    CreditCard,
    Activity,
    Shield,
    CheckCircle,
    XCircle,
    UserPlus,
    Loader2
} from "lucide-react";
import {
    getAdminStats,
    getAllUsers,
    getAllSystemRequests,
    getPendingApplications,
    approveRecycler
} from "../../../api/adminApi";

export default function AdminDashboard() {
    const { getToken } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const [s, u, r, apps] = await Promise.all([
                getAdminStats(token),
                getAllUsers(token),
                getAllSystemRequests(token),
                getPendingApplications(token)
            ]);
            setStats(s);
            setUsers(u);
            setRequests(r);
            setApplications(apps);
        } catch (err) {
            console.error("Dashboard Sync Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (appId: string) => {
        const token = await getToken();
        const res = await approveRecycler(appId, token);
        if (res.ok) {
            setApplications(prev => prev.filter(a => a.id !== appId));
            alert("User promoted to Recycler successfully.");
            // Refresh users list to show new role
            fetchData();
        }
    };

    const filteredUsers = users.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="animate-spin text-emerald-500" size={40} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing ReClaim Cloud...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">

            {/* 1. KPI STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total E-Waste" value={`${stats?.totalWeightKg || 0} kg`} icon={<Package />} color="text-emerald-600" />
                <StatCard title="Disbursed" value={`৳${stats?.totalPayout?.toLocaleString() || 0}`} icon={<CreditCard />} color="text-blue-600" />
                <StatCard title="Total Users" value={stats?.userCount || 0} icon={<Users />} color="text-purple-600" />
                <StatCard title="Pending Pickups" value={stats?.activeRequests || 0} icon={<Activity />} color="text-amber-600" />
            </div>

            {/* 2. FULL WIDTH: RECYCLER APPLICATIONS (High Priority) */}
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden border-t-4 border-t-blue-500">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                        <UserPlus size={20} className="text-blue-500" /> Recycler Accreditation Requests
                    </h3>
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                        {applications.length} Pending Approval
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 italic">Applicant Identity</th>
                                <th className="px-6 py-4 italic">Credentials / NID</th>
                                <th className="px-6 py-4 text-right">Decision</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {applications.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest">
                                        No pending accreditation requests
                                    </td>
                                </tr>
                            ) : (
                                applications.map(app => (
                                    <tr key={app.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 text-sm">{app.fullName}</div>
                                            <div className="text-slate-400 text-[10px]">{app.clerkId}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-700 font-bold">NID: {app.nidNumber}</div>
                                            <div className="text-slate-400">{app.organizationName || "Independent Partner"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleApprove(app.id)}
                                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                                <button className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all border border-red-100">
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3. TWO COLUMN: IDENTITIES & OPERATIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Registered Identities */}
                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 overflow-hidden border-t-4 border-t-emerald-500">
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <Shield size={18} className="text-emerald-500" /> Registered Identities
                        </h3>

                        {/* New Search Input */}
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Search name, email, or role..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3 text-center">Role</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-8 text-center text-slate-400 italic">
                                            No matching identities found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900">{u.firstName} {u.lastName}</div>
                                                <div className="text-slate-400 text-[10px]">{u.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-md font-black uppercase text-[9px] tracking-tighter ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                        u.role === 'recycler' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Operations Log */}
                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 overflow-hidden border-t-4 border-t-slate-800">
                    <div className="p-5 border-b border-slate-100">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <Activity size={18} className="text-slate-800" /> Operational Feed
                        </h3>
                    </div>
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3">Origin</th>
                                    <th className="px-6 py-3">Metric</th>
                                    <th className="px-6 py-3 text-right">State</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requests.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 uppercase tracking-tighter">{r.brandAndModel || r.category}</div>
                                            <div className="text-slate-400 text-[9px] truncate w-32">{r.pickUpAddress}</div>
                                        </td>
                                        <td className="px-6 py-4 font-black text-slate-700">
                                            ৳{r.estimatedValue.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end">
                                                <div className={`w-3 h-3 rounded-full border-2 border-white ring-1 ring-offset-1 ${r.status === 0 ? 'bg-amber-400 ring-amber-400 animate-pulse' : 'bg-emerald-400 ring-emerald-400'}`}></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: any) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-900/5 transition-transform hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl bg-slate-50 ${color} shadow-inner`}>{icon}</div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tighter">{value}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{title}</div>
        </div>
    );
}