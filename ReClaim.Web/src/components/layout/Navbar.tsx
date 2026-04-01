import { useState, useEffect } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Clock,
  ShieldAlert,
  Truck,
  MessageSquare,
  Store,
  MapPin,
  Menu,
  X,
  LogIn,
  Trophy,
} from "lucide-react";

export default function Navbar() {
  const { user } = useUser();
  const role = (user?.publicMetadata?.role as string) || "citizen";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
        <div className="w-full max-w-[1400px] mx-auto px-4 lg:px-6 h-16 flex justify-between items-center">
          <Link
            to="/"
            className="flex items-center gap-2.5 cursor-pointer group transition-opacity hover:opacity-80 shrink-0"
          >
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              ReClaim<span className="text-emerald-500">.io</span>
            </h1>
          </Link>

          <nav className="hidden md:flex items-center gap-4 lg:gap-6 font-medium text-[13px] lg:text-sm">
            <SignedIn>
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <LayoutDashboard size={16} /> Dashboard
              </Link>

              <Link
                to="/marketplace"
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <Store size={16} /> Marketplace
              </Link>

              <Link
                to="/chat"
                className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-600 transition-colors"
              >
                <MessageSquare size={16} /> Chat
              </Link>

              <Link
                to="/request-pickup"
                className="hidden xl:flex items-center gap-1.5 text-slate-500 hover:text-emerald-600 transition-colors border-l border-slate-200 pl-4 ml-2"
              >
                <MapPin size={16} /> Request Pickup
              </Link>

              <Link
                to="/history"
                className="hidden xl:flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <Clock size={16} /> My Pickups
              </Link>

              {role != "citizen" && (
                <Link
                  to="/my-claims"
                  className="hidden xl:flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors font-bold"
                >
                  <ShieldAlert size={16} /> My Claims
                </Link>
              )}

              {role === "citizen" && (
                <Link
                  to="/verify"
                  className="hidden xl:flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors font-bold"
                >
                  <ShieldAlert size={16} /> Become Recycler
                </Link>
              )}

              {(role === "recycler" || role === "admin") && (
                <Link
                  to="/fleet"
                  className="hidden xl:flex items-center gap-1.5 text-amber-600 hover:text-amber-700 transition-colors font-bold"
                >
                  <Truck size={16} /> Fleet Route
                </Link>
              )}

              {role === "admin" && (
                <Link
                  to="/admin"
                  className="hidden xl:flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 transition-colors font-bold"
                >
                  <ShieldAlert size={16} /> Admin Console
                </Link>
              )}

              <div className="hidden xl:flex ml-2 pl-4 border-l border-slate-200 items-center">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8 ring-1 ring-slate-200 shadow-sm",
                    },
                  }}
                />
              </div>

              <Link
                to="/leaderboard"
                className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-600 transition-colors font-bold"
              >
                <Trophy size={16} className={location.pathname === '/leaderboard' ? 'text-amber-500' : ''} /> Leaderboard
              </Link>

            </SignedIn>

            <SignedOut>
              <div className="hidden xl:block">
                <SignInButton mode="modal">
                  <button className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-lg transition-all font-semibold shadow-sm ring-1 ring-slate-900/5 active:scale-95">
                    Sign In
                  </button>
                </SignInButton>
              </div>
            </SignedOut>
          </nav>

          <div className="flex xl:hidden items-center gap-3">
            <SignedIn>
              <div className="flex items-center justify-center">
                <UserButton
                  appearance={{ elements: { avatarBox: "w-8 h-8 shadow-sm" } }}
                />
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm font-bold bg-slate-900 text-white px-4 py-1.5 rounded-lg active:scale-95 transition-transform">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-slate-700 hover:text-emerald-600 transition-colors p-1.5 bg-slate-50 border border-slate-200 rounded-xl active:scale-95"
            >
              <Menu size={22} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>
      <div
        className={`xl:hidden fixed inset-0 bg-white/20 backdrop-blur-md transition-all duration-300 z-[998] ${isMobileMenuOpen
          ? "opacity-100 visible"
          : "opacity-0 invisible pointer-events-none"
          }`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      <div
        className={`xl:hidden fixed top-0 right-0 h-[100dvh] w-[280px] bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.08)] transform transition-transform duration-300 ease-out z-[999] flex flex-col rounded-l-3xl border-l border-slate-100 overflow-hidden ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            ReClaim<span className="text-emerald-500">.io</span>
          </h2>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-slate-400 hover:text-red-500 bg-white shadow-sm border border-slate-100 p-2 rounded-full transition-all active:scale-95"
          >
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        <div className="flex flex-col p-4 gap-1.5 font-bold text-slate-600 w-full h-full overflow-y-auto pb-8">
          <SignedIn>
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 active:scale-[0.98] transition-all text-sm group"
            >
              <div className="bg-slate-100 group-hover:bg-emerald-100 p-1.5 rounded-lg transition-colors">
                <LayoutDashboard size={18} />
              </div>{" "}
              Dashboard
            </Link>

            <Link
              to="/request-pickup"
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 active:scale-[0.98] transition-all text-sm group"
            >
              <div className="bg-slate-100 group-hover:bg-emerald-100 p-1.5 rounded-lg transition-colors">
                <MapPin size={18} />
              </div>{" "}
              Request Pickup
            </Link>

            <Link
              to="/marketplace"
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 active:scale-[0.98] transition-all text-sm group"
            >
              <div className="bg-slate-100 group-hover:bg-emerald-100 p-1.5 rounded-lg transition-colors">
                <Store size={18} />
              </div>{" "}
              Marketplace
            </Link>
            <Link
              to="/history"
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 active:scale-[0.98] transition-all text-sm group"
            >
              <div className="bg-slate-100 group-hover:bg-emerald-100 p-1.5 rounded-lg transition-colors">
                <Clock size={18} />
              </div>{" "}
              My Pickups
            </Link>

            {role != "citizen" && (
              <Link
                to="/my-claims"
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-blue-50 text-blue-600 active:scale-[0.98] transition-all text-sm group"
              >
                <div className="bg-blue-100 p-1.5 rounded-lg transition-colors">
                  <ShieldAlert size={18} />
                </div>{" "}
                My Claims
              </Link>
            )}

            <Link
              to="/chat"
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 active:scale-[0.98] transition-all text-sm group"
            >
              <div className="bg-slate-100 group-hover:bg-emerald-100 p-1.5 rounded-lg transition-colors">
                <MessageSquare size={18} />
              </div>{" "}
              Chat
            </Link>

            <div className="h-px bg-slate-100 my-2 mx-4"></div>

            {role === "citizen" && (
              <Link
                to="/verify"
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-blue-50 text-blue-600 active:scale-[0.98] transition-all text-sm group"
              >
                <div className="bg-blue-100 p-1.5 rounded-lg">
                  <ShieldAlert size={18} />
                </div>{" "}
                Become Recycler
              </Link>
            )}
            {(role === "recycler" || role === "admin") && (
              <Link
                to="/fleet"
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-amber-50 text-amber-600 active:scale-[0.98] transition-all text-sm group"
              >
                <div className="bg-amber-100 p-1.5 rounded-lg">
                  <Truck size={18} />
                </div>{" "}
                Fleet Route
              </Link>
            )}
            {role === "admin" && (
              <Link
                to="/admin"
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-emerald-50 text-emerald-600 active:scale-[0.98] transition-all text-sm group"
              >
                <div className="bg-emerald-100 p-1.5 rounded-lg">
                  <ShieldAlert size={18} />
                </div>{" "}
                Admin Console
              </Link>
            )}

            <Link
              to="/leaderboard"
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 active:scale-[0.98] transition-all text-sm group"
            >
              <div className={`p-1.5 rounded-lg transition-colors ${location.pathname === '/leaderboard' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 group-hover:bg-emerald-100'}`}>
                <Trophy size={18} />
              </div>{" "}
              Leaderboard
            </Link>

          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="w-full mt-4 bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold shadow-md active:scale-95 transition-all flex justify-center items-center gap-2">
                <LogIn size={18} /> Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </>
  );
}