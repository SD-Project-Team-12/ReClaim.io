const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getAdminStats = async (token: string | null) => {
    const response = await fetch(`${BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Unauthorized access to admin stats");
    return response.json();
};

export const getAllUsers = async (token: string | null) => {
    const response = await fetch(`${BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Unauthorized access to user list");
    return response.json();
};

export const getAllSystemRequests = async (token: string | null) => {
    const response = await fetch(`${BASE_URL}/admin/all-requests`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Unauthorized access to master request list");
    return response.json();
};

export const getPendingApplications = async (token: string | null) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/pending-applications`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to fetch applications");
    return response.json();
};

export const approveRecycler = async (id: string, token: string | null) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/approve-recycler/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
    });
    return response;
};