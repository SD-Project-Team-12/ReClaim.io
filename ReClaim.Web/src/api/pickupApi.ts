const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Sends a new e-waste pickup request to the backend.
 * Uses the Clerk token for secure authentication.
 */
export const submitPickUpRequest = async (formData: any, token: string | null) => {
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(`${BASE_URL}/pickup/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(formData),
  });

  return response;
};

/**
 * Fetches all requests belonging to the currently logged-in user.
 */
export const getMyRequests = async (token: string | null) => {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pickup/my-requests`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch history");
  return response.json();
};

// Fetch all pending requests for the Fleet Map
export const getPendingRequests = async (token: string | null) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pickup/pending`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to fetch pending requests");
    return response.json();
};

// Allow a recycler to claim a request
export const claimPickUpRequest = async (id: string, token: string | null) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pickup/${id}/claim`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
    });
    return response;
};