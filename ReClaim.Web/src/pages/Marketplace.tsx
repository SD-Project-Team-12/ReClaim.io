import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Loader2, ImageOff, MapPin, Clock } from "lucide-react";
import { getMarketplaceItems } from "../api/pickupApi";

export default function Marketplace() {
    const { getToken } = useAuth();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const token = await getToken();
                const data = await getMarketplaceItems(token);
                setItems(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [getToken]);

    if (loading) {
        return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>;
    }

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Marketplace</h1>
                <p className="text-slate-500 mt-2 font-medium">Discover e-waste components and materials listed by the community.</p>
            </div> */}

            {items.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                    <p className="text-slate-500 font-bold">No items available right now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map((item) => (
                        <Link to={`/request/${item.id}`} key={item.id} className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col">
                            <div className="w-full h-48 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                                {item.imageUrls?.length > 0 ? (
                                    <img src={item.imageUrls[0]} alt="Item" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <ImageOff size={32} className="text-slate-300" />
                                )}
                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-black text-slate-900 shadow-sm">
                                    {item.category}
                                </div>
                            </div>

                            <div className="p-4 flex flex-col flex-1">
                                <h3 className="font-bold text-lg text-slate-900 truncate">{item.brandAndModel || item.category}</h3>
                                <p className="text-xl font-black text-emerald-600 mt-1">৳{item.estimatedValue.toLocaleString()}</p>
                                
                                <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed flex-1">
                                    {item.itemDescription || "No description provided."}
                                </p>

                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-bold">
                                    <span className="flex items-center gap-1 truncate max-w-[60%]"><MapPin size={12} /> {item.pickUpAddress}</span>
                                    <span className="flex items-center gap-1 shrink-0"><Clock size={12} /> {new Date(item.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}