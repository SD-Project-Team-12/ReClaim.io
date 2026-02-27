const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const testCitizenApi = async (token: string | null) => {
  return fetch(`${BASE_URL}/test/citizen`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const testAdminApi = async (token: string | null) => {
  return fetch(`${BASE_URL}/test/admin`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};