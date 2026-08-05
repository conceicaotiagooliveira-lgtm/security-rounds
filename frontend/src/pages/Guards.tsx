import { motion } from 'framer-motion';
import { Shield, Plus, Users, Search, Edit2, Trash2, Phone, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/services/api';
import GuardModal from '@/components/guards/GuardModal';

export default function Guards() {
  const [search, setSearch] = useState('');
  const [guards, setGuards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuard, setEditingGuard] = useState<any>(null);

  const fetchGuards = async () => {
    try {
      const res = await api.get('/guards');
      setGuards(res.data);
    } catch (err) {
      console.error('Erro ao carregar vigias', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGuards(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir este vigia?')) return;
    try {
      await api.delete(`/guards/${id}`);
      fetchGuards();
    } catch (err) {
      console.error('Erro ao excluir', err);
    }
  };

  const filtered = guards.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.registration.toLowerCase().includes(search.toLowerCase()) ||
    g.shift.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Inativo': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Férias': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Afastado': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Vigias</h1>
          <p className="text-sm text-slate-500 mt-1">Cadastro e gestão dos vigias patrimoniais</p>
        </div>
        <button
          onClick={() => { setEditingGuard(null); setModalOpen(true); }}
          className="flex items-center gap-2 bg-[#0f172a] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
        >
          <Plus className="w-4 h-4" />
          Novo Vigia
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar vigias por nome, matrícula ou turno..."
          className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-slate-500 animate-pulse font-medium">Carregando vigias...</p>
        </div>
      ) : filtered.length === 0 && guards.length === 0 ? (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-slate-400 shadow-sm flex flex-col items-center justify-center py-20"
        >
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">Nenhum vigia cadastrado</h2>
          <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
            Clique em "Novo Vigia" para cadastrar os vigias responsáveis pelas rondas de segurança patrimonial.
          </p>
          <button
            onClick={() => { setEditingGuard(null); setModalOpen(true); }}
            className="bg-[#0f172a] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Primeiro Vigia
          </button>
        </motion.div>
      ) : (
        /* Guard Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((guard, idx) => (
            <motion.div
              key={guard.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl border border-slate-400 p-5 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{guard.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">Mat. {guard.registration}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${statusColor(guard.status)}`}>
                  {guard.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span><strong className="text-slate-700">{guard.shift}</strong> {guard.schedule && `· ${guard.schedule}`}</span>
                </div>
                {guard.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{guard.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => { setEditingGuard(guard); setModalOpen(true); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors text-xs font-medium"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(guard.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors text-xs font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <GuardModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingGuard(null); }}
        onSaved={fetchGuards}
        guard={editingGuard}
      />
    </div>
  );
}
