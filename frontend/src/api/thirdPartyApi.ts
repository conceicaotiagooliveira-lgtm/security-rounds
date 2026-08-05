import api from '@/services/api';

export const thirdPartyApi = {
  // Profiles
  getProfiles: async () => {
    const res = await api.get('/terceiros/profiles');
    return res.data;
  },
  saveProfile: async (profile: any) => {
    const res = await api.post('/terceiros/profiles', profile);
    return res.data;
  },
  
  deleteProfile: async (id: string): Promise<void> => {
    await api.delete(`/terceiros/profiles/${id}`);
  },

  bulkDeleteProfiles: async (ids: string[]): Promise<{ status: string, deleted: number }> => {
    const res = await api.post('/terceiros/profiles/bulk-delete', { ids });
    return res.data;
  },

  importBulk: async (profiles: Partial<ThirdPartyProfile>[]): Promise<{ status: string, imported: number }> => {
    const response = await api.post('/terceiros/import_bulk', profiles);
    return response.data;
  },
  
  // Entries
  getEntries: async () => {
    const res = await api.get('/terceiros/entries');
    return res.data;
  },
  saveEntry: async (entry: any) => {
    const res = await api.post('/terceiros/entries', entry);
    return res.data;
  },
  deleteEntry: async (id: string): Promise<void> => {
    await api.delete(`/terceiros/entries/${id}`);
  },

  bulkDeleteEntries: async (ids: string[]): Promise<{ status: string, deleted: number }> => {
    const res = await api.post('/terceiros/entries/bulk-delete', { ids });
    return res.data;
  },
  
  // Configs
  getConfigs: async () => {
    const res = await api.get('/terceiros/configs');
    return res.data;
  },
  saveConfig: async (config: any) => {
    const res = await api.post('/terceiros/configs', config);
    return res.data;
  },
  deleteConfig: async (id: string) => {
    const res = await api.delete(`/terceiros/configs/${id}`);
    return res.data;
  }
};
