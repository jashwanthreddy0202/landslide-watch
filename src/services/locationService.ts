import { LocationRisk } from '../types';
import { AIZAWL_LOCATIONS } from '../data/mockData';

export async function fetchLocations(params?: {
  ward?: string;
  riskLevel?: string;
}): Promise<LocationRisk[]> {
  try {
    const query = new URLSearchParams();
    if (params?.ward) query.append('ward', params.ward);
    if (params?.riskLevel) query.append('riskLevel', params.riskLevel);

    const res = await fetch(`/api/locations?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch locations');
    return await res.json();
  } catch (err) {
    console.warn('Using fallback locations data:', err);
    return AIZAWL_LOCATIONS;
  }
}

export async function fetchLocationById(id: string): Promise<LocationRisk | null> {
  try {
    const res = await fetch(`/api/locations/${id}`);
    if (!res.ok) throw new Error('Location not found');
    return await res.json();
  } catch (err) {
    console.warn(`Using fallback for location ${id}:`, err);
    return AIZAWL_LOCATIONS.find((l) => l.id === id) || AIZAWL_LOCATIONS[0];
  }
}
