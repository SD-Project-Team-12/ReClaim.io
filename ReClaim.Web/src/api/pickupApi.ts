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

export const deletePickUpRequest = async (id: string, token: string | null) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pickup/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
    });
    return response;
};

export const getMyAssignments = async (token: string | null) => {
  if (!token) throw new Error("No authentication token found");

  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const apiUrl = baseUrl.endsWith('/api') 
    ? `${baseUrl}/PickUp/my-assignments`
    : `${baseUrl}/api/PickUp/my-assignments`;

  const response = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) throw new Error(`Failed to fetch assignments: ${response.statusText}`);
  return response.json();
};

export const updateRequestStatus = async (id: string, newStatus: number, token: string | null) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pickup/${id}/status`, {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(newStatus)
    });
    return response;
};


export const getRequestById = async (id: string, token: string | null) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pickup/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to fetch request details");
    return response.json();
};


export const getMarketplaceItems = async (token: string, page: number = 1, pageSize: number = 12) => {
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL; 
  
  const apiUrl = baseUrl.endsWith('/api') 
    ? `${baseUrl}/PickUp/marketplace?page=${page}&pageSize=${pageSize}`
    : `${baseUrl}/api/PickUp/marketplace?page=${page}&pageSize=${pageSize}`;

  const response = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error("Failed to fetch marketplace items");
  
  return response.json(); 
};
export const getUserAnalytics = async (token: string | null) => {
  if (!token) throw new Error("No authentication token found");

  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  
  const apiUrl = baseUrl.endsWith('/api') 
    ? `${baseUrl}/Analytics/user-stats`
    : `${baseUrl}/api/Analytics/user-stats`;

  const response = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error("Failed to fetch analytics");
  
  return response.json(); 
};

export const getMyLeaderboardRank = async (token: string | null) => {
  if (!token) throw new Error("No authentication token found");

  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  // Automatically handle if the baseUrl already has /api or not
  const apiUrl = baseUrl.endsWith('/api') 
    ? `${baseUrl}/leaderboard/me`
    : `${baseUrl}/api/leaderboard/me`;

  const response = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error("Failed to fetch leaderboard rank");
  
  return response.json(); 
};