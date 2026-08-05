import api from './api';

export interface WhatsAppInstance {
  id: number;
  name: string;
  api_url: string;
  api_key: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppInstanceCreate {
  name: string;
  api_url: string;
  api_key: string;
  description?: string;
}

export const whatsappApi = {
  getInstances: async () => {
    const response = await api.get('/whatsapp-instances/');
    return response.data;
  },

  createInstance: async (data: WhatsAppInstanceCreate) => {
    const response = await api.post('/whatsapp-instances/', data);
    return response.data;
  },

  updateInstance: async (id: number, data: Partial<WhatsAppInstanceCreate>) => {
    const response = await api.put(`/whatsapp-instances/${id}`, data);
    return response.data;
  },

  deleteInstance: async (id: number) => {
    const response = await api.delete(`/whatsapp-instances/${id}`);
    return response.data;
  },

  checkInstanceStatus: async (id: number) => {
    const response = await api.get(`/whatsapp-instances/${id}/status`);
    return response.data;
  },

  getQrCode: async (id: number) => {
    const response = await api.get(`/whatsapp-instances/${id}/qr`);
    return response.data;
  },

  sendTestMessage: async (id: number, number: string, text: string) => {
    const response = await api.post(`/whatsapp-instances/${id}/send`, { number, text });
    return response.data;
  },
};
