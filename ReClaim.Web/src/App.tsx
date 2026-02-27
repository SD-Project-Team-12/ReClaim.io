import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/clerk-react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import RequestHistory from "./features/pickup/components/RequestHistory";
import FleetDashboard from "./features/pickup/components/FleetDashboard";
import { Loader2 } from "lucide-react";
import type { JSX } from "react";
import AdminDashboard from "./features/admin/components/AdminDashboard";
import VerificationForm from "./features/account/components/VerificationForm";

// --- SECURITY WRAPPER ---
// This intercepts the route, checks the Clerk user's role, and kicks them out if they don't match.
const RequireRole = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles: string[] }) => {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  // Extract the role from Clerk's public metadata (defaults to "citizen" if empty)
  const role = (user?.publicMetadata?.role as string) || "citizen";

  if (!allowedRoles.includes(role)) {
    // Kick unauthorized users back to their standard dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-surface">
      <Navbar />

      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-12">
        <Routes>
          <Route path="/" element={
            <>
              <SignedOut><Home /></SignedOut>
              <SignedIn><Navigate to="/dashboard" /></SignedIn>
            </>
          } />

          {/* Citizen Routes */}
          <Route path="/dashboard" element={
            <>
              <SignedIn><Dashboard /></SignedIn>
              <SignedOut><RedirectToSignIn /></SignedOut>
            </>
          } />

          <Route path="/history" element={
            <>
              <SignedIn>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <RequestHistory />
                </div>
              </SignedIn>
              <SignedOut><RedirectToSignIn /></SignedOut>
            </>
          } />

          {/* Recycler / Admin Routes */}
          <Route path="/fleet" element={
            <>
              <SignedIn>
                <RequireRole allowedRoles={["recycler", "admin"]}>
                  <FleetDashboard />
                </RequireRole>
              </SignedIn>
              <SignedOut><RedirectToSignIn /></SignedOut>
            </>
          } />
          <Route path="/admin" element={
            <SignedIn>
              <RequireRole allowedRoles={["admin"]}>
                <AdminDashboard />
              </RequireRole>
            </SignedIn>
          } />
          <Route path="/verify" element={
            <>
              <SignedIn>
                <VerificationForm />
              </SignedIn>
              <SignedOut><RedirectToSignIn /></SignedOut>
            </>
          } />
        </Routes>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 text-center text-sm font-medium text-slate-500 mt-auto">
        <p>&copy; {new Date().getFullYear()} ReClaim.io - Intelligent E-Waste Logistics</p>
      </footer>
    </div>
  );
}