import api from '@/services/api';

export interface Company {
  id: string;
  name: string;
  corporateName: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  manager?: string;
  activityArea?: string;
  status: string;
  createdAt: string;
}

export const companyApi = {
  getCompanies: async (): Promise<Company[]> => {
    const { data } = await api.get('/companies');
    return data;
  },

  createCompany: async (company: Omit<Company, 'id' | 'createdAt'>): Promise<Company> => {
    const { data } = await api.post('/companies', company);
    return data;
  },

  updateCompany: async (id: string, company: Omit<Company, 'id' | 'createdAt'>): Promise<Company> => {
    const { data } = await api.put(`/companies/${id}`, company);
    return data;
  },

  deleteCompany: async (id: string): Promise<void> => {
    await api.delete(`/companies/${id}`);
  }
};
