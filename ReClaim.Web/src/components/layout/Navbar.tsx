import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Clock, ShieldAlert, Truck, Code2 } from "lucide-react";

export default function Navbar() {
    const { user } = useUser();
    const role = (user?.publicMetadata?.role as string) || "citizen";

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
            <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">

                {/* Brand Logo */}
                <Link to="/" className="flex items-center gap-2.5 cursor-pointer group transition-opacity hover:opacity-80">
                    {/* <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
            R
          </div> */}
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">
                        ReClaim<span className="text-emerald-500">.io</span>
                    </h1>
                </Link>

                <nav className="flex items-center gap-6 font-medium text-sm">
                    <SignedIn>
                        {/* Standard Citizen Links */}
                        <Link to="/dashboard" className="hidden md:flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
                            <LayoutDashboard size={16} /> Dashboard
                        </Link>
                        <Link to="/history" className="hidden md:flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
                            <Clock size={16} /> My Pickups
                        </Link>

                        {/* NEW: Recycler-Specific Link */}

                        {role === "citizen" && (
                            <Link to="/verify" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors font-bold border-l border-slate-200 pl-6 ml-2">
                                <ShieldAlert size={16} /> Become Recycler
                            </Link>
                        )}

                        {(role === "recycler" || role === "admin") && (
                            <Link to="/fleet" className="hidden md:flex items-center gap-2 text-amber-600 hover:text-amber-700 transition-colors">
                                <Truck size={16} /> Fleet Route
                            </Link>
                        )}

                        {/* NEW: Admin-Specific Link */}
                        {role === "admin" && (
                            <Link to="/admin" className="hidden md:flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors">
                                <ShieldAlert size={16} /> Admin Console
                            </Link>
                        )}

                        <div className="ml-2 pl-6 border-l border-slate-200 flex items-center">
                            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 ring-1 ring-slate-200 shadow-sm" } }} />
                        </div>
                    </SignedIn>

                    <SignedOut>
                        <div className="flex items-center gap-6">
                            <SignInButton mode="modal">
                                <button className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-lg transition-all font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-slate-900/5 active:scale-95">
                                    Sign In
                                </button>
                            </SignInButton>
                        </div>
                    </SignedOut>

                </nav>
            </div>
        </header>
    );
}