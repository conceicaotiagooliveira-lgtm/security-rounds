import api from '../services/api';

export const settingsApi = {
  getSetting: async (key: string): Promise<string | null> => {
    try {
      const response = await api.get(`/settings/${key}`);
      return response.data.value;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  saveSetting: async (key: string, value: string): Promise<void> => {
    await api.post('/settings/', { key, value });
  }
};
