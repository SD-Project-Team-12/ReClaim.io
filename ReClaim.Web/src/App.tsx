import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* GLOBAL NAVBAR */}
      <nav className="flex justify-between items-center p-6 bg-white shadow-sm">
        <h1 className="text-2xl font-black text-green-600 tracking-tight">ReClaim<span className="text-gray-900">.io</span></h1>
        
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-5 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="container mx-auto mt-8">
        <SignedOut>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">E-Waste Recycling Made Rewarding</h2>
            <p className="text-gray-600 max-w-md mb-8">
              Turn your old electronics into value. Join the movement to clean the environment and earn rewards.
            </p>
            <SignInButton mode="modal" />
          </div>
        </SignedOut>

        <SignedIn>
          <Dashboard />
        </SignedIn>
      </main>
    </div>
  );
}