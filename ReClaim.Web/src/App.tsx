import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { DashboardPage } from "./pages/DashboardPage";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 font-sans">
        
        {/* Navigation Bar (এটি সব পেজেই দেখাবে) */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link to="/" className="text-3xl font-bold text-green-600">ReClaim.io</Link>
              <nav className="hidden md:flex gap-4">
                <Link to="/" className="text-gray-600 hover:text-green-600 font-medium">Home Feed</Link>
                <SignedIn>
                  <Link to="/dashboard" className="text-gray-600 hover:text-green-600 font-medium">Dashboard</Link>
                </SignedIn>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              {/* লগইন করা থাকলে ইউজারের ছবি ও Post Waste বাটন দেখাবে */}
              <SignedIn>
                <Link to="/dashboard" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700">
                  Post Waste
                </Link>
                <UserButton />
              </SignedIn>

              {/* লগইন না থাকলে Clerk এর ডিফল্ট লগইন বাটন দেখাবে */}
              <SignedOut>
                <div className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700">
                  <SignInButton mode="modal" />
                </div>
              </SignedOut>
            </div>
          </div>
        </header>

        {/* Main Content Areas (এখানে রাউটিং অনুযায়ী পেজ বদলাবে) */}
        <main className="p-6 md:p-10">
          <Routes>
            <Route path="/" element={<HomePage />} />
            
            <Route path="/dashboard" element={
              <>
                {/* ড্যাশবোর্ড পেজটি শুধুমাত্র লগইন করা ইউজাররা দেখতে পারবে */}
                <SignedIn>
                  <DashboardPage />
                </SignedIn>
                
                {/* কেউ লগইন ছাড়া লিংকে ঢুকলে এই এরর মেসেজ দেখাবে */}
                <SignedOut>
                  <p className="text-center text-gray-500 mt-20 text-lg">
                    Please log in to view your dashboard.
                  </p>
                </SignedOut>
              </>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;