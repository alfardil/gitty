/**
 * Utility functions for localStorage operations with error handling
 */

export const localStorageUtils = {
  /**
   * Safely get an item from localStorage
   */
  getItem: (key: string): string | null => {
    try {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to get item from localStorage (${key}):`, error);
      return null;
    }
  },

  /**
   * Safely set an item in localStorage
   */
  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === "undefined") return false;
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Failed to set item in localStorage (${key}):`, error);
      return false;
    }
  },

  /**
   * Safely remove an item from localStorage
   */
  removeItem: (key: string): boolean => {
    try {
      if (typeof window === "undefined") return false;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove item from localStorage (${key}):`, error);
      return false;
    }
  },

  /**
   * Check if localStorage is available
   */
  isAvailable: (): boolean => {
    try {
      if (typeof window === "undefined") return false;
      const test = "__localStorage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },
};
