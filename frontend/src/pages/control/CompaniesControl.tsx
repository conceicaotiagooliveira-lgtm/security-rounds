import React, { useState, useEffect } from 'react';
import { companyApi } from '../../api/companyApi';
import { 
  Building, 
  Search, 
  Plus, 
  Building2, 
  Phone, 
  Mail, 
  User, 
  CheckCircle, 
  XCircle, 
  X, 
  Edit3, 
  Trash2, 
  AlertCircle,
  Briefcase,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../store/authStore';

export interface Company {
  id: string;
  name: string; // Nome Fantasia
  corporateName: string; // Razão Social
  cnpj: string;
  phone: string;
  email: string;
  manager: string; // Gestor Responsável
  activityArea: string; // Área de atuação (e.g. T.I., Limpeza, Segurança)
  status: 'Ativo' | 'Inativo';
}

export default function CompaniesControl() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { user } = useAuthStore();
  const canDeleteThirdParty = user?.role === 'Administrador' || user?.permissions?.includes('delete_third_party');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [corporateName, setCorporateName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [manager, setManager] = useState('');
  const [activityArea, setActivityArea] = useState('');
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');

  // Load from API
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await companyApi.getCompanies();
        setCompanies(data);
      } catch (error) {
        console.error('Erro ao carregar empresas:', error);
      }
    };
    fetchCompanies();
  }, []);
  const handleOpenRegister = () => {
    setEditingCompany(null);
    setName('');
    setCorporateName('');
    setCnpj('');
    setPhone('');
    setEmail('');
    setManager('');
    setActivityArea('');
    setStatus('Ativo');
    setShowModal(true);
  };

  const handleOpenEdit = (company: Company) => {
    setEditingCompany(company);
    setName(company.name);
    setCorporateName(company.corporateName);
    setCnpj(company.cnpj);
    setPhone(company.phone);
    setEmail(company.email);
    setManager(company.manager);
    setActivityArea(company.activityArea);
    setStatus(company.status);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !corporateName || !activityArea) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      if (editingCompany) {
        // Update
        const updated = await companyApi.updateCompany(editingCompany.id, {
          name,
          corporateName,
          cnpj,
          phone,
          email,
          manager,
          activityArea,
          status
        });
        setCompanies(prev => prev.map(item => item.id === editingCompany.id ? updated : item));
      } else {
        // Add new
        const newCompany = await companyApi.createCompany({
          name,
          corporateName,
          cnpj,
          phone,
          email,
          manager,
          activityArea,
          status
        });
        setCompanies(prev => [...prev, newCompany]);
      }
      setShowModal(false);
    } catch (error: any) {
      console.error("Erro ao salvar empresa:", error);
      alert(error.response?.data?.detail || "Erro ao salvar empresa. Verifique a conexão.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta empresa do cadastro?')) {
      try {
        await companyApi.deleteCompany(id);
        setCompanies(prev => prev.filter(item => item.id !== id));
      } catch (error) {
        console.error("Erro ao excluir empresa:", error);
        alert("Erro ao excluir empresa.");
      }
    }
  };

  // Stats
  const totalRegistered = companies.length;
  const activeContracts = companies.filter(c => c.status === 'Ativo').length;
  const inactiveContracts = companies.filter(c => c.status === 'Inativo').length;

  // Filter and search
  const filteredCompanies = companies.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.corporateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cnpj.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.activityArea.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'Todos' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, filteredCompanies.length]);

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Building className="w-8 h-8 text-purple-600" />
            Cadastro de Empresas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre e gerencie as empresas prestadoras de serviços autorizadas e contratadas no condomínio/empresa.
          </p>
        </div>
        <button
          onClick={handleOpenRegister}
          className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-3 rounded-xl transition-all shadow-md shadow-purple-500/20 active:scale-95 text-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Cadastradas</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{totalRegistered}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Contratos Ativos</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{activeContracts}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Inativos</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{inactiveContracts}</p>
          </div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome fantasia, razão social, CNPJ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['Todos', 'Ativo', 'Inativo'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={clsx(
                  'text-xs font-semibold px-3 py-1.5 rounded-lg transition-all',
                  statusFilter === filter
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto border-2 border-slate-300 rounded-xl shadow-sm">
          {filteredCompanies.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-medium text-sm">Nenhuma empresa encontrada</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-800 text-white text-[11px] font-extrabold uppercase tracking-wider">
                <tr className="divide-x border-b border-slate-900 divide-slate-600">
                  <th className="py-3 px-6">Empresa / Razão Social</th>
                  <th className="py-3 px-6">CNPJ</th>
                  <th className="py-3 px-6">Área de Atuação</th>
                  <th className="py-3 px-6">Contatos / Gestor</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-300 text-sm text-slate-700 bg-white">
                {paginatedCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-slate-50 transition-colors group divide-x-2 divide-slate-300">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-semibold text-slate-800">{company.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{company.corporateName}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">
                      {company.cnpj}
                    </td>
                    <td className="py-4 px-6">
                      <span className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Briefcase className="w-3.5 h-3.5 text-purple-500" />
                        {company.activityArea}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs">
                      <div className="space-y-1">
                        <p className="flex items-center gap-1 text-slate-700">
                          <User className="w-3 h-3 text-slate-400" />
                          {company.manager || 'Não informado'}
                        </p>
                        {company.phone && (
                          <p className="flex items-center gap-1 text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {company.phone}
                          </p>
                        )}
                        {company.email && (
                          <p className="flex items-center gap-1 text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {company.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={clsx(
                        'text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border',
                        company.status === 'Ativo'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      )}>
                        {company.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap bg-slate-50">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(company)}
                          className="bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 p-2 rounded-xl transition-all"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {canDeleteThirdParty && (
                          <button
                            onClick={() => handleDelete(company.id)}
                            className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 p-2 rounded-xl transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> até{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredCompanies.length)}
              </span>{' '}
              de <span className="font-medium">{filteredCompanies.length}</span> resultados
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded bg-white border border-slate-300 text-slate-500 disabled:opacity-50 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded bg-white border border-slate-300 text-slate-500 disabled:opacity-50 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal - Cadastrar / Editar Empresa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingCompany ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nome Fantasia *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Elevadores Tech"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={corporateName}
                    onChange={(e) => setCorporateName(e.target.value)}
                    placeholder="Ex: Elevadores Tech Ltda"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    CNPJ (Opcional)
                  </label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Área / Setor *
                  </label>
                  <input
                    type="text"
                    required
                    value={activityArea}
                    onChange={(e) => setActivityArea(e.target.value)}
                    placeholder="Ex: Manutenção, Limpeza, T.I."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@empresa.com"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Responsável Interno (Contato)
                  </label>
                  <input
                    type="text"
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    placeholder="Nome do responsável comercial"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Status *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Ativo' | 'Inativo')}
                    className="w-full border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-purple-500/20 text-sm"
                >
                  {editingCompany ? 'Salvar Alterações' : 'Cadastrar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
