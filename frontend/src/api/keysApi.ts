import api from '@/services/api';

export interface KeyCabinetEntry {
  id: string;
  name: string;
  description?: string;
  status: 'Disponível' | 'Emprestada';
  currentBorrower?: string;
  borrowedAt?: string;
  createdAt?: string;
}

export interface KeyHistoryEntry {
  id: string;
  keyId: string;
  keyName: string;
  borrower: string;
  department: string;
  purpose?: string;
  borrowedAt: string;
  authorizedBy?: string;
  returnedAt?: string;
  returnedBy?: string;
  returnedAuthorizedBy?: string;
  status: 'Emprestada' | 'Devolvida';
}

export const keysApi = {
  // Cabinet
  getCabinet: async (): Promise<KeyCabinetEntry[]> => {
    const { data } = await api.get('/keys/cabinet');
    return data;
  },

  createKey: async (key: Omit<KeyCabinetEntry, 'id' | 'createdAt'>): Promise<KeyCabinetEntry> => {
    const { data } = await api.post('/keys/cabinet', key);
    return data;
  },

  updateKey: async (id: string, key: Omit<KeyCabinetEntry, 'id' | 'createdAt'>): Promise<KeyCabinetEntry> => {
    const { data } = await api.put(`/keys/cabinet/${id}`, key);
    return data;
  },

  deleteKey: async (id: string): Promise<void> => {
    await api.delete(`/keys/cabinet/${id}`);
  },

  // History
  getHistory: async (): Promise<KeyHistoryEntry[]> => {
    const { data } = await api.get('/keys/history');
    return data;
  },

  createHistoryEntry: async (entry: KeyHistoryEntry): Promise<KeyHistoryEntry> => {
    const { data } = await api.post('/keys/history', entry);
    return data;
  },

  updateHistoryEntry: async (id: string, entry: KeyHistoryEntry): Promise<KeyHistoryEntry> => {
    const { data } = await api.put(`/keys/history/${id}`, entry);
    return data;
  }
};
