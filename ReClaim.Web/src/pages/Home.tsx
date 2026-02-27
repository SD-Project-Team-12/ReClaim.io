import { SignInButton } from "@clerk/clerk-react";
import { ArrowRight, Leaf, ShieldCheck, MapPin, Cpu, RefreshCw } from "lucide-react";

export default function Home() {
  return (
    <div className="w-full flex flex-col relative pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-28 flex flex-col lg:flex-row items-center gap-12 w-full">
        <div className="lg:w-1/2 text-center lg:text-left flex flex-col items-center lg:items-start z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 font-medium text-xs tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            ReClaim API v1.0 Live
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.05] mb-6 tracking-tighter">
            Automate your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-700">
              e-waste logistics.
            </span>
          </h1>
          
          <p className="text-lg text-slate-500 mb-10 leading-relaxed max-w-lg font-medium">
            The infrastructure for circular tech. Instantly value, track, and sustainably route decommissioned hardware via our unified spatial network.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <SignInButton mode="modal">
              <button className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white font-semibold text-base px-6 py-3.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 w-full sm:w-auto">
                Start Deploying <ArrowRight size={18} />
              </button>
            </SignInButton>
            <button className="bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold text-base px-6 py-3.5 rounded-xl transition-all shadow-sm w-full sm:w-auto">
              Read Documentation
            </button>
          </div>
        </div>

        <div className="lg:w-1/2 relative w-full max-w-lg mx-auto lg:mx-0 hidden md:block z-10">
          <div className="absolute top-10 left-10 w-full h-full bg-emerald-500/10 rounded-3xl blur-3xl -z-10"></div>
          
          <div className="bg-white/80 backdrop-blur-md ring-1 ring-slate-900/5 shadow-2xl rounded-2xl p-2 overflow-hidden transform hover:-translate-y-1 transition-all duration-500">
            <div className="bg-white rounded-xl border border-slate-100 p-6 h-full w-full">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
                </div>
                <div className="ml-4 font-semibold text-xs text-slate-400 tracking-wide uppercase">
                  Valuation Engine
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="h-10 bg-slate-50 rounded-lg ring-1 ring-inset ring-slate-900/5 w-full flex items-center px-3 text-slate-500 text-sm font-medium">
                  <Cpu size={16} className="mr-3 text-emerald-500" /> Device ID: MBP-2021-M1
                </div>
                <div className="h-10 bg-slate-50 rounded-lg ring-1 ring-inset ring-slate-900/5 w-full flex items-center px-3 text-slate-500 text-sm font-medium">
                  <ShieldCheck size={16} className="mr-3 text-emerald-500" /> Condition: Suboptimal (Battery)
                </div>
                
                <div className="mt-6 bg-slate-900 rounded-xl p-5 text-center shadow-inner relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">
                    Live Spot Price
                  </div>
                  <div className="text-3xl font-black text-white tracking-tight">
                    ৳ 12,500<span className="text-emerald-400 text-lg">.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SOCIAL PROOF BANNER (Stops it from feeling naked) */}
      <section className="border-y border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 opacity-60 grayscale">
          <p className="font-semibold text-sm tracking-widest uppercase text-slate-500 hidden md:block">
            Powered By
          </p>
          <div className="flex gap-8 md:gap-16 font-black text-xl text-slate-800 tracking-tighter">
            <span>Microsoft<span className="font-light">Azure</span></span>
            <span>Clerk<span className="text-emerald-500">.</span></span>
            <span>PostGIS</span>
            <span>React</span>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS / FEATURES GRID */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
            End-to-End E-Waste Logistics
          </h2>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto">
            Our platform handles everything from initial valuation to physical routing and secure destruction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-2xl ring-1 ring-slate-900/5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
              <RefreshCw size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">AI Valuation</h3>
            <p className="text-slate-500 leading-relaxed font-medium text-sm">
              Input your hardware specifications and receive an instant, market-adjusted valuation based on real-time recycling data.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-2xl ring-1 ring-slate-900/5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
              <MapPin size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Spatial Routing</h3>
            <p className="text-slate-500 leading-relaxed font-medium text-sm">
              Drop a pin on our interactive map. Our backend PostGIS engine calculates the most efficient pickup route for our fleet.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-2xl ring-1 ring-slate-900/5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
              <Leaf size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Eco-Tracking</h3>
            <p className="text-slate-500 leading-relaxed font-medium text-sm">
              Track your carbon offset and exact recycling status in real-time through your personalized dashboard.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}