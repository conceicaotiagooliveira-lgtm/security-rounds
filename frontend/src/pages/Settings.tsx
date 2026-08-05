import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Search, Edit2, Trash2, X, Mail, Lock, User, Shield, BellRing, BellOff } from 'lucide-react';
import api from '@/services/api';
import { settingsApi } from '@/api/settingsApi';

const ROLES = ['Administrador', 'Operador', 'Motorista', 'Vigia'];

const roleColor = (role: string) => {
  switch (role) {
    case 'Administrador': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'Operador': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Motorista': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Vigia': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

interface UserForm {
  name: string;
  email: string;
  password?: string;
  role: string;
  permissions: string[];
}

const AVAILABLE_MENUS = [
  { id: '/dashboard', label: 'Dashboard', group: 'Frota' },
  { id: '/cargo', label: 'Entrada / Saída Veículos', group: 'Frota' },
  { id: '/vehicles', label: 'Veículos', group: 'Frota' },
  { id: '/drivers', label: 'Motoristas', group: 'Frota' },
  { id: '/guards', label: 'Vigias', group: 'Rondas' },
  { id: '/rounds', label: 'Roteiro', group: 'Rondas' },
  { id: '/control/third-party', label: 'Controle de Terceiros', group: 'Controle' },
  { id: '/control/companies', label: 'Cadastro de Empresas', group: 'Controle' },
  { id: '/control/keys', label: 'Controle de Chaves', group: 'Controle' },
  { id: '/reports', label: 'Relatórios', group: 'Geral' },
  { id: '/settings', label: 'Configurações (Geral)', group: 'Geral' },
  { id: '/settings/apis', label: "Configurações (API's)", group: 'Geral' }
];

export default function Settings() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState<UserForm>({ name: '', email: '', password: '', role: 'Operador', permissions: AVAILABLE_MENUS.map(m => m.id) });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [patrolSchedulerActive, setPatrolSchedulerActive] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Erro ao carregar usuários', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalSettings = async () => {
    try {
      const active = await settingsApi.getSetting('patrol_scheduler_active');
      if (active === 'false') {
        setPatrolSchedulerActive(false);
      } else {
        setPatrolSchedulerActive(true);
      }
    } catch (err) {
      console.error('Erro ao carregar configurações globais', err);
    }
  };

  useEffect(() => { 
    fetchUsers(); 
    fetchGlobalSettings();
  }, []);

  const togglePatrolScheduler = async () => {
    const newVal = !patrolSchedulerActive;
    setPatrolSchedulerActive(newVal);
    try {
      await settingsApi.saveSetting('patrol_scheduler_active', newVal ? 'true' : 'false');
    } catch (err) {
      alert('Erro ao salvar configuração.');
      setPatrolSchedulerActive(!newVal);
    }
  };

  const openCreate = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', password: '', role: 'Operador', permissions: AVAILABLE_MENUS.map(m => m.id) });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, permissions: user.permissions || AVAILABLE_MENUS.map(m => m.id) });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      if (editingUser) {
        // Update user
        const payload: any = { name: form.name, email: form.email, role: form.role, permissions: form.permissions };
        if (form.password) payload.password = form.password;
        await api.put(`/auth/users/${editingUser.id}`, payload);
      } else {
        // Create user
        if (!form.password) { setFormError('Senha é obrigatória para novo usuário'); setFormLoading(false); return; }
        await api.post('/auth/register', {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          permissions: form.permissions,
        });
      }
      fetchUsers();
      setModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Erro ao salvar usuário');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir este usuário?')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erro ao excluir');
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
          <p className="text-sm text-slate-500 mt-1">Gestão de usuários e acessos do sistema</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#0f172a] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {ROLES.map(role => {
          const count = users.filter(u => u.role === role).length;
          return (
            <motion.div key={role} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-400 p-4 shadow-sm">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{role}s</p>
              <p className="text-2xl font-bold text-slate-800">{count}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Global Settings */}
      <div className="mb-6 bg-white rounded-2xl border border-slate-400 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-3">Configurações Globais do Sistema</h2>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <h3 className="font-bold text-slate-700">Notificações Automáticas de Rondas (WhatsApp)</h3>
            <p className="text-xs text-slate-500 mt-1">Ativa ou desativa o robô (scheduler) que verifica atrasos e envia alertas no WhatsApp dos vigilantes.</p>
          </div>
          <button
            onClick={togglePatrolScheduler}
            className={`relative flex items-center justify-center w-14 h-8 rounded-full transition-colors ${patrolSchedulerActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <span className={`absolute bg-white w-6 h-6 rounded-full transition-all shadow-sm flex items-center justify-center ${patrolSchedulerActive ? 'right-1' : 'left-1'}`}>
              {patrolSchedulerActive ? <BellRing className="w-3.5 h-3.5 text-emerald-500" /> : <BellOff className="w-3.5 h-3.5 text-slate-400" />}
            </span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, email ou perfil..."
          className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
        />
      </div>

      {/* Users Table */}
      {loading ? (
        <p className="text-slate-500 animate-pulse text-center py-10">Carregando...</p>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-400 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Nome</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Perfil</th>
                <th className="text-right px-5 py-3 font-semibold text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, idx) => (
                <tr key={user.id} className="border-b border-slate-100 last:border-none hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="font-medium text-slate-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{user.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${roleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(user)}
                        className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-slate-400">Nenhum usuário encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-white rounded-t-3xl z-50 flex flex-col shadow-2xl"
            >
              <div className="w-full flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
              </div>

              <div className="px-6 pb-4 pt-2 flex justify-between items-center border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {editingUser ? 'Atualize os dados do usuário' : 'Crie uma conta de acesso ao sistema'}
                  </p>
                </div>
                <button onClick={() => setModalOpen(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 pb-12">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome Completo *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                      placeholder="Nome completo"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Senha {editingUser ? '(deixe em branco para manter)' : '*'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required={!editingUser}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                      placeholder={editingUser ? '••••••••' : 'Defina uma senha'}
                    />
                  </div>
                </div>

                {/* Perfil */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Perfil de Acesso *</label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      required
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all appearance-none"
                    >
                      {ROLES.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400 space-y-0.5">
                    <p>• <strong>Administrador:</strong> acesso total ao sistema</p>
                    <p>• <strong>Operador:</strong> acesso ao painel administrativo</p>
                    <p>• <strong>Motorista:</strong> acesso ao app de motorista</p>
                    <p>• <strong>Vigia:</strong> acesso ao app de rondas</p>
                  </div>
                </div>

                {/* Permissões de Menu */}
                {form.role !== 'Motorista' && form.role !== 'Vigia' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Menus Permitidos <span className="text-xs font-normal text-slate-500">(marque as telas que este usuário pode acessar)</span>
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      {Array.from(new Set(AVAILABLE_MENUS.map(m => m.group))).map(group => (
                        <div key={group} className="mb-4 last:mb-0">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{group}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {AVAILABLE_MENUS.filter(m => m.group === group).map(menu => (
                              <label key={menu.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <input 
                                  type="checkbox"
                                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                  checked={form.permissions.includes(menu.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setForm({ ...form, permissions: [...form.permissions, menu.id] });
                                    } else {
                                      setForm({ ...form, permissions: form.permissions.filter(p => p !== menu.id) });
                                    }
                                  }}
                                />
                                <span className="text-sm font-medium text-slate-700">{menu.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Restrições Especiais</h4>
                      <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-amber-100/50 rounded-lg transition-colors">
                        <input 
                          type="checkbox"
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
                          checked={form.permissions.includes('hide_external_cars')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, permissions: [...form.permissions, 'hide_external_cars'] });
                            } else {
                              setForm({ ...form, permissions: form.permissions.filter(p => p !== 'hide_external_cars') });
                            }
                          }}
                        />
                        <span className="text-sm font-medium text-amber-900">Ocultar Carros Externos (com Motoristas Vinculados)</span>
                      </label>
                      
                      <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-amber-100/50 rounded-lg transition-colors mt-1">
                        <input 
                          type="checkbox"
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
                          checked={form.permissions.includes('hide_external_drivers')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, permissions: [...form.permissions, 'hide_external_drivers'] });
                            } else {
                              setForm({ ...form, permissions: form.permissions.filter(p => p !== 'hide_external_drivers') });
                            }
                          }}
                        />
                        <span className="text-sm font-medium text-amber-900">Ocultar Motoristas Externos (com Veículos Vinculados)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-amber-100/50 rounded-lg transition-colors mt-1">
                        <input 
                          type="checkbox"
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
                          checked={form.permissions.includes('delete_third_party')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, permissions: [...form.permissions, 'delete_third_party'] });
                            } else {
                              setForm({ ...form, permissions: form.permissions.filter(p => p !== 'delete_third_party') });
                            }
                          }}
                        />
                        <span className="text-sm font-medium text-amber-900">Permitir Excluir Cadastro de Terceiro (Visita)</span>
                      </label>

                      <p className="text-[10px] text-amber-700 mt-2 ml-6">
                        Se marcados, aplica-se a respectiva restrição/permissão ao usuário logado.
                      </p>
                    </div>
                  </div>
                )}

                {formError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center font-medium border border-red-100">
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full bg-[#0f172a] hover:bg-[#1e293b] disabled:opacity-70 text-white rounded-xl py-3.5 font-semibold text-sm transition-colors shadow-lg shadow-slate-900/10"
                >
                  {formLoading ? 'Salvando...' : editingUser ? 'Atualizar Usuário' : 'Criar Usuário'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
