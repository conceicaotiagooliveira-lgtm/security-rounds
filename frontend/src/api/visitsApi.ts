import api from '@/services/api';

export const visitsApi = {
  // Profiles
  getProfiles: async () => {
    const res = await api.get('/visitas/profiles');
    return res.data;
  },
  saveProfile: async (profile: any) => {
    const res = await api.post('/visitas/profiles', profile);
    return res.data;
  },
  
  // Entries
  getEntries: async () => {
    const res = await api.get('/visitas/entries');
    return res.data;
  },
  saveEntry: async (entry: any) => {
    const res = await api.post('/visitas/entries', entry);
    return res.data;
  },
  deleteEntry: async (id: string) => {
    const res = await api.delete(`/visitas/entries/${id}`);
    return res.data;
  },
  
  // Configs
  getConfigs: async () => {
    const res = await api.get('/visitas/configs');
    return res.data;
  },
  saveConfig: async (config: any) => {
    const res = await api.post('/visitas/configs', config);
    return res.data;
  },
  deleteConfig: async (id: string) => {
    const res = await api.delete(`/visitas/configs/${id}`);
    return res.data;
  }
};
