const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

const parseResponse = async (response) => {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Request failed');
  }

  return response.json();
};

export const fetchUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/users`);
  return parseResponse(response);
};

export const createUser = async (user) => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });

  return parseResponse(response);
};
