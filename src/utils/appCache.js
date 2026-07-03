// this is planned tobe module level store — lives as long as the browser tab is open.
// dw .. this gets cleared automatically when we logout.

const store = {};
const TTL = {
  pets: 5 * 60 * 1000,           // 5 minutes — pets rarely change
  userProfile: 10 * 60 * 1000,   // 10 minutes — profile edits are intentional
  medicalRecords: 2 * 60 * 1000, // 2 minutes — records may be added more often
};

export const appCache = {
  set(key, data) {
    store[key] = { data, ts: Date.now() };
  },

  get(key, ttlMs) {
    const entry = store[key];
    if (!entry) return null;
    if (Date.now() - entry.ts > ttlMs) {
      delete store[key];
      return null; // expired
    }
    return entry.data;
  },

  invalidate(key) {
    delete store[key];
  },

  invalidateAll() {
    Object.keys(store).forEach(k => delete store[k]);
  },

  // Convenience: invalidate everything for a specific pet
  invalidatePet(petId) {
    this.invalidate('pets');
    this.invalidate(`records_${petId}`);
  },
};

export const CACHE_KEYS = {
  pets: (userId) => `pets_${userId}`,
  userProfile: (userId) => `userProfile_${userId}`,
  medicalRecords: (petId) => `records_${petId}`,
};

export { TTL };
