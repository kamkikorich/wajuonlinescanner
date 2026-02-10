// IndexedDB Storage Wrapper for Waju Scanner PWA
import { openDB } from 'idb';

// Database name and version
const DB_NAME = 'waju-scanner-db';
const DB_VERSION = 1;

// Store names
const SCANS_STORE = 'scans';
const SETTINGS_STORE = 'settings';

/**
 * Initialize IndexedDB database
 * @returns {Promise<IDBDatabase>} The database instance
 */
export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create scans store for temporary scan data
      if (!db.objectStoreNames.contains(SCANS_STORE)) {
        const scansStore = db.createObjectStore(SCANS_STORE, { keyPath: 'id' });
        scansStore.createIndex('date', 'date');
        scansStore.createIndex('type', 'type');
      }

      // Create settings store for user preferences
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    },
  });
}

/**
 * Save a scan to IndexedDB
 * @param {Object} scan - Scan data to save
 * @returns {Promise<void>}
 */
export async function saveScan(scan) {
  const db = await initDB();
  await db.put(SCANS_STORE, {
    ...scan,
    id: scan.id || Date.now(),
    date: scan.date || new Date().toISOString(),
  });
}

/**
 * Get a scan by ID
 * @param {number} id - Scan ID
 * @returns {Promise<Object|null>} Scan data or null
 */
export async function getScan(id) {
  const db = await initDB();
  return db.get(SCANS_STORE, id);
}

/**
 * Get all scans
 * @param {Object} options - Query options
 * @param {string} options.type - Filter by scan type (optional)
 * @param {number} options.limit - Limit number of results (optional)
 * @returns {Promise<Array>} Array of scans
 */
export async function getAllScans(options = {}) {
  const db = await initDB();
  let scans = await db.getAll(SCANS_STORE);

  // Filter by type
  if (options.type) {
    scans = scans.filter(scan => scan.type === options.type);
  }

  // Sort by date (newest first)
  scans.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Limit results
  if (options.limit) {
    scans = scans.slice(0, options.limit);
  }

  return scans;
}

/**
 * Delete a scan
 * @param {number} id - Scan ID
 * @returns {Promise<void>}
 */
export async function deleteScan(id) {
  const db = await initDB();
  await db.delete(SCANS_STORE, id);
}

/**
 * Clear all scans
 * @returns {Promise<void>}
 */
export async function clearAllScans() {
  const db = await initDB();
  await db.clear(SCANS_STORE);
}

/**
 * Clear old scans (older than specified hours)
 * @param {number} hours - Age threshold in hours (default: 24)
 * @returns {Promise<number>} Number of deleted scans
 */
export async function clearOldScans(hours = 24) {
  const db = await initDB();
  const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

  const scans = await db.getAll(SCANS_STORE);
  const oldScans = scans.filter(scan => new Date(scan.date) < cutoffDate);

  for (const scan of oldScans) {
    await db.delete(SCANS_STORE, scan.id);
  }

  return oldScans.length;
}

/**
 * Save a setting
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 * @returns {Promise<void>}
 */
export async function saveSetting(key, value) {
  const db = await initDB();
  await db.put(SETTINGS_STORE, { key, value });
}

/**
 * Get a setting
 * @param {string} key - Setting key
 * @param {any} defaultValue - Default value if not found
 * @returns {Promise<any>} Setting value
 */
export async function getSetting(key, defaultValue = null) {
  const db = await initDB();
  const result = await db.get(SETTINGS_STORE, key);
  return result ? result.value : defaultValue;
}

/**
 * Get all settings
 * @returns {Promise<Object>} Settings object
 */
export async function getAllSettings() {
  const db = await initDB();
  const settings = await db.getAll(SETTINGS_STORE);
  const result = {};
  for (const setting of settings) {
    result[setting.key] = setting.value;
  }
  return result;
}

/**
 * Delete a setting
 * @param {string} key - Setting key
 * @returns {Promise<void>}
 */
export async function deleteSetting(key) {
  const db = await initDB();
  await db.delete(SETTINGS_STORE, key);
}

/**
 * Get database storage size (approximate)
 * @returns {Promise<number>} Size in bytes
 */
export async function getStorageSize() {
  const db = await initDB();
  const scans = await db.getAll(SCANS_STORE);
  const settings = await db.getAll(SETTINGS_STORE);

  const scansSize = JSON.stringify(scans).length;
  const settingsSize = JSON.stringify(settings).length;

  return scansSize + settingsSize;
}

/**
 * Clear all data (factory reset)
 * @returns {Promise<void>}
 */
export async function clearAllData() {
  const db = await initDB();
  await db.clear(SCANS_STORE);
  await db.clear(SETTINGS_STORE);
}