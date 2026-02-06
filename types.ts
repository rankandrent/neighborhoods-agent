
export interface CityLocation {
  city: string;
  state: string;
}

export interface CityData {
  id?: string;
  city: string;
  state: string;
  neighborhoods: string[];
  famous_buildings: string[];
  description: string;
  sources: { title: string; uri: string }[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  created_at?: string;
}

export interface GeminiResponse {
  neighborhoods: string[];
  famous_buildings: string[];
  description: string;
  sources?: { title: string; uri: string }[];
}

export interface SupabaseConfig {
  url: string;
  key: string;
  tableName: string;
}
