import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Trophy, Medal, Leaf, Award, ArrowUpRight, Loader2, Weight, Banknote, ShieldCheck } from "lucide-react";

interface LeaderboardEntry {
    rank: number;
    name: string;
    role: string;
    points: number;
    totalWeight: number;
    totalValue: number;
}

interface MyStats {
    rank: number | string;
    points: number;
    hasCompletedPickups: boolean;
}

export default function Leaderboard() {
    const { getToken } = useAuth();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [myStats, setMyStats] = useState<MyStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboardData = async () => {
            try {
                const token = await getToken();
                const baseUrl = import.meta.env.VITE_API_BASE_URL;

                // Fetch public leaderboard and private user stats concurrently
                const [leaderboardRes, myStatsRes] = await Promise.all([
                    fetch(`${baseUrl}/leaderboard`),
                    fetch(`${baseUrl}/leaderboard/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                if (leaderboardRes.ok) {
                    setLeaderboard(await leaderboardRes.json());
                }
                if (myStatsRes.ok) {
                    setMyStats(await myStatsRes.json());
                }
            } catch (error) {
                console.error("Failed to fetch leaderboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboardData();
    }, [getToken]);

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-12 px-4">
            
            {/* Header */}
            <div className="mb-8 text-center mt-6">
                <div className="inline-flex items-center justify-center p-3 bg-emerald-50 rounded-full mb-4 ring-8 ring-emerald-50/50">
                    <Leaf className="text-emerald-600" size={32} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                    Green Points Leaderboard
                </h1>
                {/* <p className="text-slate-500 font-medium mt-2 max-w-xl mx-auto">
                    Track your environmental impact. Earn 50 points for every kg of e-waste recycled and bonus points for high-value extractions.
                </p> */}
            </div>

            {/* "My Rank" Widget */}
            {myStats && (
                <div className="mb-10 bg-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-xl group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] transform translate-x-10 -translate-y-10 transition-colors"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-2 mb-2">
                                <Award size={16} /> Your Global Standing
                            </span>
                            {myStats.hasCompletedPickups ? (
                                <div className="text-white text-lg font-medium">
                                    You are ranked <span className="text-3xl font-black text-white mx-1">#{myStats.rank}</span> out of all citizens.
                                </div>
                            ) : (
                                <div className="text-slate-300 font-medium">
                                    Complete your first pickup to join the leaderboard!
                                </div>
                            )}
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex items-center gap-6 min-w-[200px] justify-center">
                            <div>
                                <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-widest mb-1 text-center">Green Points</p>
                                <div className="text-4xl font-black text-white flex items-baseline gap-1 justify-center">
                                    {myStats.points.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* The Leaderboard Table */}
           {/* The Leaderboard Table */}
            <div className="bg-white rounded-3xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Trophy size={18} className="text-amber-500" /> Top 100 Eco-Citizens
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white text-slate-400 uppercase text-[10px] tracking-widest font-black border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 w-24 text-center">Rank</th>
                                <th className="px-6 py-4">Citizen</th>
                                <th className="px-6 py-4 text-right">Green Points</th>
                                <th className="px-6 py-4 text-right hidden md:table-cell">Recycled</th>
                                <th className="px-6 py-4 text-right hidden sm:table-cell">Value Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {leaderboard.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        No completed extractions yet. Be the first!
                                    </td>
                                </tr>
                            ) : (
                                leaderboard.map((user) => (
                                    <tr key={user.rank} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4 text-center">
                                            {user.rank === 1 ? (
                                                <div className="w-8 h-8 mx-auto bg-amber-100 text-amber-600 rounded-full flex items-center justify-center ring-2 ring-amber-200">
                                                    <Trophy size={16} />
                                                </div>
                                            ) : user.rank === 2 ? (
                                                <div className="w-8 h-8 mx-auto bg-slate-100 text-slate-500 rounded-full flex items-center justify-center ring-2 ring-slate-200">
                                                    <Medal size={16} />
                                                </div>
                                            ) : user.rank === 3 ? (
                                                <div className="w-8 h-8 mx-auto bg-orange-100 text-orange-700 rounded-full flex items-center justify-center ring-2 ring-orange-200">
                                                    <Medal size={16} />
                                                </div>
                                            ) : (
                                                <span className="font-black text-slate-400">#{user.rank}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="font-black text-slate-900 text-base">{user.name}</div>
                                                {user.role === "recycler" || user.role === "admin" ? (
                                                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                                                        <ShieldCheck size={10} /> Fleet
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100">
                                                        <Leaf size={10} /> Citizen
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-black rounded-lg text-sm border border-emerald-100">
                                                {user.points.toLocaleString()} <ArrowUpRight size={14} className="opacity-50" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right hidden md:table-cell">
                                            <div className="font-bold text-slate-600 flex items-center justify-end gap-1.5">
                                                <Weight size={14} className="text-slate-300" />
                                                {user.totalWeight} kg
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right hidden sm:table-cell">
                                            <div className="font-bold text-slate-600 flex items-center justify-end gap-1.5">
                                                <Banknote size={14} className="text-slate-300" />
                                                ৳{user.totalValue.toLocaleString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}