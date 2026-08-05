import { motion, AnimatePresence } from 'framer-motion';
import { X, User, BadgeCheck, Clock, Phone, Key } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/services/api';

interface GuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  guard?: any;
}

const SHIFT_OPTIONS = ['Diurno', 'Noturno', '12x36 Dia', '12x36 Noite'];

export default function GuardModal({ isOpen, onClose, onSaved, guard }: GuardModalProps) {
  const [form, setForm] = useState({
    name: '',
    registration: '',
    shift: 'Diurno',
    schedule: '',
    phone: '',
    status: 'Ativo',
    user_id: null as number | null,
    auth_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      api.get('/auth/users').then(res => setUsers(res.data)).catch(() => {});
    }
    if (guard) {
      setForm({
        name: guard.name || '',
        registration: guard.registration || '',
        shift: guard.shift || 'Diurno',
        schedule: guard.schedule || '',
        phone: guard.phone || '',
        status: guard.status || 'Ativo',
        user_id: guard.user_id || null,
        auth_password: guard.auth_password || '',
      });
    } else {
      setForm({ name: '', registration: '', shift: 'Diurno', schedule: '', phone: '', status: 'Ativo', user_id: null, auth_password: '' });
    }
    setError('');
  }, [guard, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (guard) {
        await api.put(`/guards/${guard.id}`, form);
      } else {
        await api.post('/guards', form);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao salvar vigia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-white rounded-t-3xl z-50 flex flex-col shadow-2xl"
          >
            {/* Handle */}
            <div className="w-full flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 pt-2 flex justify-between items-center border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {guard ? 'Editar Vigia' : 'Novo Vigia'}
                </h2>
                <p className="text-sm text-slate-500">
                  {guard ? 'Atualize os dados do vigia' : 'Preencha os dados para cadastrar um vigia'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 pb-12">
              {/* Nome Completo */}
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
                    placeholder="Nome completo do vigia"
                  />
                </div>
              </div>

              {/* Matrícula */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Matrícula *</label>
                <div className="relative">
                  <BadgeCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={form.registration}
                    onChange={(e) => setForm({ ...form, registration: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                    placeholder="Ex: 001234"
                  />
                </div>
              </div>

              {/* Turno e Horário */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Turno *</label>
                  <select
                    required
                    value={form.shift}
                    onChange={(e) => setForm({ ...form, shift: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                  >
                    {SHIFT_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Horário</label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={form.schedule}
                      onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                      placeholder="Ex: 18:00 - 06:00"
                    />
                  </div>
                </div>
              </div>

              {/* Telefone e Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Férias">Férias</option>
                    <option value="Afastado">Afastado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Conta de Acesso */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Conta de Acesso (Login)</label>
                  <select
                    value={form.user_id || ''}
                    onChange={(e) => setForm({ ...form, user_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                  >
                    <option value="">Sem conta vinculada</option>
                    {users.filter(u => u.role === 'Vigia').map((u: any) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">Vincule conta com role "Vigia"</p>
                </div>
                
                {/* Senha de Autorização */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Senha de Autorização *</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={form.auth_password}
                      onChange={(e) => setForm({ ...form, auth_password: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                      placeholder="Senha PIN (Ex: 1234)"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Usada para autorizar saídas/entradas via app</p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center font-medium border border-red-100">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0f172a] hover:bg-[#1e293b] disabled:opacity-70 text-white rounded-xl py-3.5 font-semibold text-sm transition-colors shadow-lg shadow-slate-900/10"
              >
                {loading ? 'Salvando...' : guard ? 'Atualizar Vigia' : 'Cadastrar Vigia'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
