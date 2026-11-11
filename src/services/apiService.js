
const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Get activities
export async function getActivities(userId) {
  const response = await fetch(`${API_URL}/api/activities`, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
      'X-User-ID': userId,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Could not load activities (${response.status}): ${error}`);
  }

  return response.json();
}

// Track activity
export async function trackActivity(payload) {
  const response = await fetch(`${API_URL}/api/activities`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Could not track activity (${response.status}): ${error}`);
  }

  return response.json();
}

// Delete activity
export async function deleteActivity(activityId) {
  const response = await fetch(`${API_URL}/api/activities/${activityId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Delete failed (${response.status}): ${error}`);
  }

  return true;
}

// Get recommendations
export async function getRecommendations(userId) {
  const response = await fetch(
    `${API_URL}/api/recommendation/user/${encodeURIComponent(userId)}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Could not load recommendations (${response.status}): ${error}`
    );
  }

  return response.json();
}

// Generate recommendation
export async function generateRecommendation(payload) {
  console.log('Sending recommendation payload:', payload);

  const response = await fetch(`${API_URL}/api/recommendation/generate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();

    throw new Error(
      `Could not generate recommendation (${response.status}): ${error}`
    );
  }

  return response.json();
}
