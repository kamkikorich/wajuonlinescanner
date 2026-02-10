// React Hooks for IndexedDB Storage
import { useState, useEffect, useCallback } from 'react';
import * as storage from '../utils/storage.js';

/**
 * Hook for managing scans in IndexedDB
 * @returns {Object} Scan operations and state
 */
export function useScans(options = {}) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load scans on mount or when options change
  useEffect(() => {
    loadScans();
  }, [options.type, options.limit]);

  const loadScans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await storage.getAllScans(options);
      setScans(data);
    } catch (err) {
      console.error('Error loading scans:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addScan = useCallback(async (scanData) => {
    try {
      const scan = {
        ...scanData,
        id: scanData.id || Date.now(),
        date: scanData.date || new Date().toISOString(),
      };
      await storage.saveScan(scan);
      setScans(prev => [scan, ...prev]);
      return scan;
    } catch (err) {
      console.error('Error adding scan:', err);
      throw err;
    }
  }, []);

  const removeScan = useCallback(async (id) => {
    try {
      await storage.deleteScan(id);
      setScans(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Error removing scan:', err);
      throw err;
    }
  }, []);

  const clearScans = useCallback(async () => {
    try {
      await storage.clearAllScans();
      setScans([]);
    } catch (err) {
      console.error('Error clearing scans:', err);
      throw err;
    }
  }, []);

  const clearOld = useCallback(async (hours = 24) => {
    try {
      const count = await storage.clearOldScans(hours);
      if (count > 0) {
        await loadScans();
      }
      return count;
    } catch (err) {
      console.error('Error clearing old scans:', err);
      throw err;
    }
  }, [loadScans]);

  return {
    scans,
    loading,
    error,
    addScan,
    removeScan,
    clearScans,
    clearOld,
    refresh: loadScans,
  };
}

/**
 * Hook for managing settings in IndexedDB
 * @returns {Object} Settings operations and state
 */
export function useSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await storage.getAllSettings();
      setSettings(data);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = useCallback(async (key, value) => {
    try {
      await storage.saveSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (err) {
      console.error('Error updating setting:', err);
      throw err;
    }
  }, []);

  const getSettingValue = useCallback(async (key, defaultValue) => {
    try {
      return await storage.getSetting(key, defaultValue);
    } catch (err) {
      console.error('Error getting setting:', err);
      return defaultValue;
    }
  }, []);

  const removeSetting = useCallback(async (key) => {
    try {
      await storage.deleteSetting(key);
      setSettings(prev => {
        const newSettings = { ...prev };
        delete newSettings[key];
        return newSettings;
      });
    } catch (err) {
      console.error('Error removing setting:', err);
      throw err;
    }
  }, []);

  return {
    settings,
    loading,
    error,
    updateSetting,
    getSettingValue,
    removeSetting,
    refresh: loadSettings,
  };
}

/**
 * Hook for a single setting value
 * @param {string} key - Setting key
 * @param {any} defaultValue - Default value
 * @returns {Array} [value, setValue, loading]
 */
export function useSetting(key, defaultValue) {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSetting();
  }, [key]);

  const loadSetting = async () => {
    try {
      setLoading(true);
      const data = await storage.getSetting(key, defaultValue);
      setValue(data);
    } catch (err) {
      console.error('Error loading setting:', err);
      setValue(defaultValue);
    } finally {
      setLoading(false);
    }
  };

  const updateValue = useCallback(async (newValue) => {
    try {
      await storage.saveSetting(key, newValue);
      setValue(newValue);
    } catch (err) {
      console.error('Error updating setting:', err);
      throw err;
    }
  }, [key]);

  return [value, updateValue, loading];
}

/**
 * Hook for storage information
 * @returns {Object} Storage info and operations
 */
export function useStorageInfo() {
  const [size, setSize] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      loadStorageSize();
    }, 5000); // Update every 5 seconds

    loadStorageSize();

    return () => clearInterval(interval);
  }, []);

  const loadStorageSize = async () => {
    try {
      const bytes = await storage.getStorageSize();
      setSize(bytes);
    } catch (err) {
      console.error('Error getting storage size:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    try {
      await storage.clearAllData();
      setSize(0);
    } catch (err) {
      console.error('Error clearing data:', err);
      throw err;
    }
  };

  // Convert bytes to human readable format
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    size,
    formattedSize: formatSize(size),
    loading,
    clearAllData,
    refresh: loadStorageSize,
  };
}