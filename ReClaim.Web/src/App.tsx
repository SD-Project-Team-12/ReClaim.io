import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from "@clerk/clerk-react";

function App() {
  const { getToken } = useAuth();

  // Function to test calling our secure .NET API
  const testBackendConnection = async () => {
    try {
      // 1. Ask Clerk for the secure JWT
      const token = await getToken();
      
      // 2. Send the JWT to the .NET Backend in the Authorization header
      // Note: Change 5000 to whatever port your .NET API is running on
      const response = await fetch("http://localhost:5000/api/test", { 
        headers: {
          Authorization: `Bearer ${token}` 
        }
      });

      if (response.ok) {
        const data = await response.text();
        alert("Backend says: " + data);
      } else {
        alert("Backend rejected the request! Status: " + response.status);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 font-sans">
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-green-600">ReClaim.io</h1>

        <h1 className="text-4xl font-bold text-green-600 underline">
          Tailwind v4 is Live!
        </h1>
        
        {/* Clerk handles the user profile picture and logout automatically */}
        <SignedIn>
          <UserButton />
        </SignedIn>
        
        {/* Clerk handles the login modal automatically */}
        <SignedOut>
          <div className="bg-green-600 text-white px-4 py-2 rounded">
            <SignInButton mode="modal" />
          </div>
        </SignedOut>
      </header>

      <main>
        <SignedIn>
          <h2 className="text-xl mb-4">Welcome to the Dashboard!</h2>
          <button 
            onClick={testBackendConnection} 
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            Test Secure .NET Backend
          </button>
        </SignedIn>

        <SignedOut>
          <p className="text-gray-600">Please sign in to access the platform.</p>
        </SignedOut>
      </main>
    </div>
  );
}

export default App;