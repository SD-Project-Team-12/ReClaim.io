import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import {
  Loader2,
  ImageOff,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { getMarketplaceItems } from "../api/pickupApi";
import { useChatPopup } from "../context/ChatPopupContext";

export default function Marketplace() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { openChatPopup } = useChatPopup();

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        if (token) {
          const data = await getMarketplaceItems(token, currentPage, 12);

          if (Array.isArray(data)) {
            setItems(data);
            setTotalPages(1);
          } else if (data && Array.isArray(data.items)) {
            setItems(data.items);
            setTotalPages(data.totalPages || 1);
          } else {
            setItems([]);
            setTotalPages(1);
          }
        }
      } catch (err) {
        console.error("Failed to fetch marketplace items:", err);
        setItems([]);
      } finally {
        setLoading(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    fetchItems();
  }, [getToken, currentPage]);

  const safeItems = Array.isArray(items) ? items : [];

  if (loading && safeItems.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
      {safeItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
          <p className="text-slate-500 font-bold">
            No items available right now.
          </p>
        </div>
      ) : (
        <>
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-opacity duration-300 ${loading ? "opacity-50" : "opacity-100"}`}
          >
            {safeItems.map((item) => (
              <Link
                to={`/request/${item.id}`}
                key={item.id}
                className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col"
              >
                <div className="w-full h-48 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                  {item.imageUrls && item.imageUrls.length > 0 ? (
                    <img
                      src={item.imageUrls[0]}
                      alt="Item"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <ImageOff size={32} className="text-slate-300" />
                  )}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-black text-slate-900 shadow-sm">
                    {item.category}
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-lg text-slate-900 truncate">
                    {item.brandAndModel || item.category}
                  </h3>

                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xl font-black text-emerald-600">
                      ৳{item.estimatedValue?.toLocaleString() || "0"}
                    </p>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        const sellerId = item.clerkId || item.clerk_id || item.citizen?.clerk_id || item.citizenId || item.CitizenId || item.userId;

                        const sellerName = item.firstName || item.first_name || item.citizen?.first_name || item.userDisplayName || item.userName || "Seller";

                        openChatPopup(sellerId, sellerName);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors z-10 shadow-sm"
                    >
                      <MessageSquare size={14} />
                      <span className="text-xs font-bold">Chat</span>
                    </button>
                  </div>

                  <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed flex-1">
                    {item.itemDescription || "No description provided."}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-bold">
                    <span className="flex items-center gap-1 truncate max-w-[60%]">
                      <MapPin size={12} /> {item.pickUpAddress}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock size={12} />{" "}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <div className="text-sm font-bold text-slate-500 bg-slate-100 px-4 py-2.5 rounded-xl">
                Page {currentPage} of {totalPages}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages || loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}