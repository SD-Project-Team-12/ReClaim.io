// src/api/chatApi.ts

const getBaseUrl = () => import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "");

export const getContacts = async (token: string) => {
    const response = await fetch(`${getBaseUrl()}/api/Chat/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to fetch contacts");
    return response.json();
};

export const getChatHistory = async (contactId: string, token: string) => {
    const response = await fetch(`${getBaseUrl()}/api/Chat/history/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to fetch chat history");
    return response.json();
};
export const askGemini = async (prompt: string, token: string | null) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const response = await fetch(`${baseUrl}/chat/ask-gemini`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ prompt })
    });
    if (!response.ok) throw new Error("Gemini API error");
    const data = await response.json();
    return data.answer; 
};