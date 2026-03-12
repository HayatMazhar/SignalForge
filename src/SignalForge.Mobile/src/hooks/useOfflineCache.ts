import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'sf_cache_';
const DEFAULT_TTL = 5 * 60 * 1000;

interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const cached: CachedData<T> = JSON.parse(raw);
    if (Date.now() - cached.timestamp > cached.ttl) {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, data: T, ttl = DEFAULT_TTL): Promise<void> {
  try {
    const cached: CachedData<T> = { data, timestamp: Date.now(), ttl };
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cached));
  } catch {}
}

export async function clearCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k: string) => k.startsWith(CACHE_PREFIX));
    for (const key of cacheKeys) {
      await AsyncStorage.removeItem(key);
    }
  } catch {}
}

export function useOfflineCache() {
  return { getCached, setCache, clearCache };
}
