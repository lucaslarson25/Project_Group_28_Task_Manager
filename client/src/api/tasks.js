const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

const parseResponse = async (response) => {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Request failed');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const fetchTasks = async (filters = {}, sort) => {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.assignedTo) params.set('assigned_to', filters.assignedTo);
  if (filters.dueBefore) params.set('due_before', filters.dueBefore);
  if (filters.dueAfter) params.set('due_after', filters.dueAfter);
  if (sort) params.set('sort', sort);

  const query = params.toString();
  const response = await fetch(`${API_BASE_URL}/tasks${query ? `?${query}` : ''}`);
  return parseResponse(response);
};

export const createTask = async (task) => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });

  return parseResponse(response);
};

export const updateTask = async (id, updates) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  return parseResponse(response);
};

export const assignTask = async (id, payload) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};

export const deleteTask = async (id) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
  });

  await parseResponse(response);
};
