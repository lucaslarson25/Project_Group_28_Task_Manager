const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

const parseResponse = async (response) => {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Request failed');
  }

  return response.json();
};

export const fetchSummaryAnalytics = async () => {
  const response = await fetch(`${API_BASE_URL}/analytics/summary`);
  return parseResponse(response);
};

export const fetchUserAnalytics = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/analytics/user/${userId}`);
  return parseResponse(response);
};
