/* Centralized API Client for BlockZone Lab */

export async function fetchData(endpoint, options = {}) {
  const response = await fetch(endpoint, options);
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  return response.json();
}
