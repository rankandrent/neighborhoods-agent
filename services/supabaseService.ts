
import { CityData, SupabaseConfig } from "../types";

const HARDCODED_URL = 'https://rdxgozeijdwghbbwivdy.supabase.co';
const HARDCODED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkeGdvemVpamR3Z2hiYndpdmR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODIyOTEzMSwiZXhwIjoyMDgzODA1MTMxfQ.IvchfZ829eEclTgI8c4BfQoyNfvvcWnd9Kxq09U-Y_o';
const DEFAULT_TABLE = 'neighborhoods';

const getSavedConfig = (): SupabaseConfig => {
  const saved = localStorage.getItem('supabase_config');
  if (!saved) {
    return {
      url: HARDCODED_URL,
      key: HARDCODED_KEY,
      tableName: DEFAULT_TABLE
    };
  }
  try {
    const config = JSON.parse(saved);
    return {
      url: config.url || HARDCODED_URL,
      key: config.key || HARDCODED_KEY,
      tableName: config.tableName || DEFAULT_TABLE
    };
  } catch {
    return {
      url: HARDCODED_URL,
      key: HARDCODED_KEY,
      tableName: DEFAULT_TABLE
    };
  }
};

export const checkIfCityExists = async (city: string, state: string): Promise<boolean> => {
  const config = getSavedConfig();
  const tableName = config.tableName;
  const baseUrl = config.url.replace(/\/$/, "");

  try {
    // Check if record exists with matching city AND state
    const response = await fetch(`${baseUrl}/rest/v1/${tableName}?city=eq.${encodeURIComponent(city)}&state=eq.${encodeURIComponent(state)}&select=id`, {
      method: 'GET',
      headers: {
        'apikey': config.key,
        'Authorization': `Bearer ${config.key}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) return false;
    const data = await response.json();
    return data && data.length > 0;
  } catch (error) {
    console.error("Check failed:", error);
    return false;
  }
};

export const saveToSupabase = async (data: Partial<CityData>) => {
  const config = getSavedConfig();
  const tableName = config.tableName;
  const baseUrl = config.url.replace(/\/$/, "");

  try {
    const response = await fetch(`${baseUrl}/rest/v1/${tableName}?on_conflict=city,state`, {
      method: 'POST',
      headers: {
        'apikey': config.key,
        'Authorization': `Bearer ${config.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        city: data.city,
        state: data.state,
        neighborhoods: data.neighborhoods || [],
        famous_buildings: data.famous_buildings || [],
        description: data.description || "",
        sources: data.sources || []
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.code === "PGRST204" || errorData.code === "42703") {
        throw new Error(`Schema mismatch: Ensure table '${tableName}' has correct columns.`);
      }
      throw new Error(errorData.message || `Supabase error: ${response.statusText}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to save to Supabase:", error);
    throw error;
  }
};

export const fetchAllExistingCities = async (): Promise<Array<{ city: string, state: string }>> => {
  const config = getSavedConfig();
  const tableName = config.tableName;
  const baseUrl = config.url.replace(/\/$/, "");

  try {
    // Fetch all cities, limited to 100000 to ensure complete coverage
    const response = await fetch(`${baseUrl}/rest/v1/${tableName}?select=city,state&limit=100000`, {
      method: 'GET',
      headers: {
        'apikey': config.key,
        'Authorization': `Bearer ${config.key}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error("Failed to sync:", error);
    return [];
  }
};
