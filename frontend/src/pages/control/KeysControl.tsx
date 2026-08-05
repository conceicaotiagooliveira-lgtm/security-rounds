import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { 
  Key, 
  Search, 
  Plus, 
  LogIn, 
  LogOut, 
  Clock, 
  Filter, 
  X, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  FileCheck2,
  Lock,
  Unlock,
  Building,
  User
} from 'lucide-react';
import api from '@/services/api';
import clsx from 'clsx';
import { keysApi } from '../../api/keysApi';
import type { KeyCabinetEntry, KeyHistoryEntry } from '../../api/keysApi';
import { settingsApi } from '../../api/settingsApi';


export default function KeysControl() {
  const { user } = useAuthStore();
  const [keys, setKeys] = useState<KeyCabinetEntry[]>([]);
  const [history, setHistory] = useState<KeyHistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cabinetSearchQuery, setCabinetSearchQuery] = useState('');
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [showKeyHistoryModal, setShowKeyHistoryModal] = useState(false);
  const [selectedKeyHistory, setSelectedKeyHistory] = useState<KeyHistoryEntry[]>([]);
  const [selectedKeyName, setSelectedKeyName] = useState('');
  const [editingKey, setEditingKey] = useState<KeyCabinetEntry | null>(null);
  const [returningKey, setReturningKey] = useState<KeyCabinetEntry | null>(null);

  // Form State - Borrow
  const [selectedKeyIds, setSelectedKeyIds] = useState<string[]>([]);
  const [borrower, setBorrower] = useState('');
  const [department, setDepartment] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [isSearchingEmployees, setIsSearchingEmployees] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [apiError, setApiError] = useState('');
  const [purpose, setPurpose] = useState('');
  const [returner, setReturner] = useState('');

  // Guard Authorization State
  const [guards, setGuards] = useState<any[]>([]);
  const [guardPassword, setGuardPassword] = useState('');
  const [guardName, setGuardName] = useState('');
  const [guardError, setGuardError] = useState(false);

  // Form State - New Key
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDesc, setNewKeyDesc] = useState('');

  // Load from localStorage
  useEffect(() => {
    if (!showBorrowModal && !showReturnModal) return;

    const fetchEmployees = async () => {
      try {
        const configsStr = await settingsApi.getSetting('sgp_api_configs');
        if (!configsStr) {
          setApiError('Configuração de Integração de API não encontrada (acesse Configurações).');
          return;
        }
        
        const configs: any[] = JSON.parse(configsStr);
        const apiConfig = configs.find((c: any) => c.method === 'GET') || configs[0];
        if (!apiConfig) {
          setApiError('Nenhuma rota GET configurada para buscar colaboradores.');
          return;
        }

        setIsSearchingEmployees(true);
        let finalUrl = apiConfig.url;
        if (apiConfig.method === 'GET' && apiConfig.parameters?.length > 0) {
           const params = new URLSearchParams();
           apiConfig.parameters.forEach((p: any) => {
             if (p.key) params.append(p.key, p.value);
           });
           finalUrl += (finalUrl.includes('?') ? '&' : '?') + params.toString();
        }

        const headers: Record<string, string> = {};
        if (apiConfig.authType === 'basic' && apiConfig.username && apiConfig.password) {
          headers['Authorization'] = 'Basic ' + btoa(apiConfig.username + ':' + apiConfig.password);
        } else if (apiConfig.authType === 'bearer' && apiConfig.token) {
          headers['Authorization'] = 'Bearer ' + apiConfig.token;
        }

        const response = await api.post('/proxy', {
          url: finalUrl,
          method: apiConfig.method,
          headers: headers
        });

        const data = response.data;
        const list = Array.isArray(data) ? data : (data.colaboradores || data.items || data.data || (data.nome ? [data] : []));
        setEmployees(list);
        setApiError('');
      } catch (error: any) {
        console.error('Error fetching employees:', error);
        setApiError(error.response?.data?.detail || error.message || 'Erro de rede ou bloqueio de CORS');
      } finally {
        setIsSearchingEmployees(false);
      }
    };

    fetchEmployees();
  }, [showBorrowModal, showReturnModal]);

  useEffect(() => {
    const fetchKeysData = async () => {
      try {
        const [fetchedKeys, fetchedHistory, fetchedGuards] = await Promise.all([
          keysApi.getCabinet(),
          keysApi.getHistory(),
          api.get('/guards')
        ]);
        setKeys(fetchedKeys);
        setHistory(fetchedHistory);
        setGuards(fetchedGuards.data);
      } catch (error) {
        console.error('Error fetching keys data:', error);
      }
    };
    fetchKeysData();
  }, []);

  const handleOpenBorrow = (keyIds: string[] = []) => {
    setSelectedKeyIds(keyIds);
    setBorrower('');
    setDepartment('');
    setPurpose('');
    setGuardPassword('');
    setGuardName('');
    setGuardError(false);
    setShowBorrowModal(true);
  };

  const findGuardByPin = (val: string) => {
    if (!val || !val.trim()) return null;
    const cleanVal = val.trim();
    return guards.find(g => 
      (g.auth_password && String(g.auth_password).trim() === cleanVal) ||
      (g.authPassword && String(g.authPassword).trim() === cleanVal) ||
      (g.pin && String(g.pin).trim() === cleanVal) ||
      (g.password && String(g.password).trim() === cleanVal)
    );
  };

  const handleBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedKeyIds.length === 0 || !borrower || !department || !purpose) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const matchedGuard = findGuardByPin(guardPassword);
    if (!matchedGuard) {
      setGuardError(true);
      return;
    }
    setGuardError(false);

    const timestamp = new Date().toISOString();

    try {
      await Promise.all(selectedKeyIds.map(async (id) => {
        const targetKey = keys.find(k => k.id === id);
        if (!targetKey) return;

        // 1. Update key status
        const updatedKey = await keysApi.updateKey(id, {
          name: targetKey.name,
          description: targetKey.description,
          status: 'Emprestada',
          currentBorrower: `${borrower} (${department})`,
          borrowedAt: timestamp
        });

        // 2. Add history record
        const newEntry = await keysApi.createHistoryEntry({
          id: Date.now().toString() + Math.random().toString(36).substring(7),
          keyId: id,
          keyName: targetKey.name,
          borrower,
          department,
          purpose,
          borrowedAt: timestamp,
          authorizedBy: matchedGuard.name,
          status: 'Emprestada'
        });

        setKeys(prev => prev.map(k => k.id === id ? updatedKey : k));
        setHistory(prev => [newEntry, ...prev]);
      }));

      setShowBorrowModal(false);
      setSelectedKeyIds([]);
    } catch (error) {
      console.error('Error borrowing keys:', error);
      alert('Erro ao registrar empréstimo das chaves.');
    }
  };

  const handleOpenReturnModal = (keyId: string) => {
    const key = keys.find(k => k.id === keyId);
    if (!key) return;
    setReturningKey(key);
    setReturner('');
    setGuardPassword('');
    setGuardName('');
    setGuardError(false);
    setShowReturnModal(true);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningKey || !returner) {
      alert('Por favor, informe quem está devolvendo a chave.');
      return;
    }

    const matchedGuard = findGuardByPin(guardPassword);
    if (!matchedGuard) {
      setGuardError(true);
      return;
    }
    setGuardError(false);

    try {
      // 1. Update key status
      const updatedKey = await keysApi.updateKey(returningKey.id, {
        name: returningKey.name,
        description: returningKey.description,
        status: 'Disponível',
        currentBorrower: '',
        borrowedAt: ''
      });

      // 2. Update active borrow in history to set returnedTime and returnedBy
      const activeHistory = history.find(h => h.keyId === returningKey.id && !h.returnedAt);
      if (activeHistory) {
        const updatedEntry = await keysApi.updateHistoryEntry(activeHistory.id, {
          ...activeHistory,
          returnedAt: new Date().toISOString(),
          returnedBy: returner,
          returnedAuthorizedBy: matchedGuard.name,
          status: 'Devolvida'
        });
        setHistory(prev => prev.map(item => item.id === activeHistory.id ? updatedEntry : item));
      }

      setKeys(prev => prev.map(k => k.id === returningKey.id ? updatedKey : k));
      setShowReturnModal(false);
      setReturningKey(null);
    } catch (error) {
      console.error('Error returning key:', error);
      alert('Erro ao registrar devolução da chave.');
    }
  };

  const handleViewKeyHistory = (keyId: string, keyName: string) => {
    const specificHistory = history
      .filter(h => h.keyId === keyId)
      .sort((a, b) => new Date(b.borrowedAt).getTime() - new Date(a.borrowedAt).getTime());
    setSelectedKeyHistory(specificHistory);
    setSelectedKeyName(keyName);
    setShowKeyHistoryModal(true);
  };

  const handleSaveKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) {
      alert('Por favor, preencha o nome da chave.');
      return;
    }

    try {
      if (editingKey) {
        const updatedKey = await keysApi.updateKey(editingKey.id, {
          name: newKeyName,
          description: newKeyDesc || 'Sem descrição cadastrada',
          status: editingKey.status,
          currentBorrower: editingKey.currentBorrower,
          borrowedAt: editingKey.borrowedAt
        });
        setKeys(prev => prev.map(k => k.id === editingKey.id ? updatedKey : k));
      } else {
        const newKey = await keysApi.createKey({
          name: newKeyName,
          description: newKeyDesc || 'Sem descrição cadastrada',
          status: 'Disponível'
        });
        setKeys(prev => [...prev, newKey]);
      }
      setNewKeyName('');
      setNewKeyDesc('');
      setShowNewKeyModal(false);
      setEditingKey(null);
    } catch (error) {
      console.error('Error saving key:', error);
      alert('Erro ao salvar chave.');
    }
  };

  const handleOpenNewKey = () => {
    setEditingKey(null);
    setNewKeyName('');
    setNewKeyDesc('');
    setShowNewKeyModal(true);
  };

  const handleOpenEditKey = (key: KeyCabinetEntry) => {
    setEditingKey(key);
    setNewKeyName(key.name);
    setNewKeyDesc(key.description === 'Sem descrição cadastrada' ? '' : key.description);
    setShowNewKeyModal(true);
  };

  const handleDeleteKey = async (keyId: string) => {
    const key = keys.find(k => k.id === keyId);
    if (key?.status === 'Emprestada') {
      alert('Não é possível excluir uma chave que está atualmente emprestada.');
      return;
    }

    if (confirm('Deseja realmente remover esta chave do armário permanentemente?')) {
      try {
        await keysApi.deleteKey(keyId);
        setKeys(prev => prev.filter(k => k.id !== keyId));
      } catch (error) {
        console.error('Error deleting key:', error);
        alert('Erro ao excluir chave.');
      }
    }
  };

  // Stats
  const totalKeysCount = keys.length;
  const availableKeysCount = keys.filter(k => k.status === 'Disponível').length;
  const borrowedKeysCount = keys.filter(k => k.status === 'Emprestada').length;

  // Filtered keys for Cabinet layout
  const filteredCabinetKeys = keys.filter(k => 
    k.name.toLowerCase().includes(cabinetSearchQuery.toLowerCase()) ||
    k.description.toLowerCase().includes(cabinetSearchQuery.toLowerCase()) ||
    (k.currentBorrower && k.currentBorrower.toLowerCase().includes(cabinetSearchQuery.toLowerCase()))
  );

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' ' + 
           date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const availableKeysInView = filteredCabinetKeys.filter(k => k.status === 'Disponível');
  const isAllSelected = availableKeysInView.length > 0 && availableKeysInView.every(k => selectedKeyIds.includes(k.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedKeyIds(prev => prev.filter(id => !availableKeysInView.some(k => k.id === id)));
    } else {
      const newIds = availableKeysInView.map(k => k.id);
      setSelectedKeyIds(prev => Array.from(new Set([...prev, ...newIds])));
    }
  };

  const toggleSelectKey = (id: string) => {
    setSelectedKeyIds(prev => 
      prev.includes(id) ? prev.filter(keyId => keyId !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Key className="w-8 h-8 text-purple-600" />
            Controle de Chaves (Claviculário)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Controle o armário de chaves gerais da empresa. Monitore retiradas, devoluções e históricos de empréstimos em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNewKey}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-3 rounded-xl transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Chave
          </button>
          <button
            onClick={() => handleOpenBorrow()}
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-3 rounded-xl transition-all shadow-md shadow-purple-500/20 active:scale-95 text-sm"
          >
            <Lock className="w-4 h-4" />
            Emprestar Chave
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total no Claviculário</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{totalKeysCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Unlock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Disponíveis</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{availableKeysCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Emprestadas (Fora)</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{borrowedKeysCount}</p>
          </div>
        </div>
      </div>

      {/* Claviculário - Visual Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Armário de Chaves Físicas
              <span className="text-[10px] font-semibold uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Painel Visual</span>
            </h2>
            {selectedKeyIds.length > 0 && (
              <button
                onClick={() => handleOpenBorrow(selectedKeyIds)}
                className="animate-in fade-in zoom-in bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Retirar {selectedKeyIds.length} {selectedKeyIds.length === 1 ? 'Chave' : 'Chaves'}
              </button>
            )}
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar chave no claviculário..."
              value={cabinetSearchQuery}
              onChange={(e) => setCabinetSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
            />
          </div>
        </div>

        {filteredCabinetKeys.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-400">Nenhuma chave encontrada com este critério de busca.</p>
        ) : (
          <div className="overflow-x-auto border-2 border-slate-300 rounded-xl shadow-sm">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-800 text-white text-[11px] font-extrabold uppercase tracking-wider">
                <tr className="divide-x border-b border-slate-900 divide-slate-600">
                  <th className="py-3 px-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 border-slate-500 bg-slate-700 cursor-pointer"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      disabled={availableKeysInView.length === 0}
                      title="Selecionar todas as chaves disponíveis"
                    />
                  </th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Etiqueta / Nome</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Situação Atual / Em posse de</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-300 text-slate-700 bg-white">
                {filteredCabinetKeys.map((key) => {
                  const isSelected = selectedKeyIds.includes(key.id);
                  const isAvailable = key.status === 'Disponível';
                  return (
                  <tr 
                    key={key.id}
                    className={clsx(
                      'hover:bg-slate-50 transition-colors group divide-x-2 divide-slate-300',
                      isAvailable ? 'hover:bg-emerald-50/5' : 'hover:bg-amber-50/5',
                      isSelected && 'bg-purple-50/30'
                    )}
                  >
                    <td className="py-3.5 px-4 text-center">
                      <input 
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        checked={isSelected}
                        onChange={() => toggleSelectKey(key.id)}
                        disabled={!isAvailable}
                      />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={clsx(
                        'text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full border',
                        key.status === 'Disponível' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}>
                        {key.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={clsx(
                          'p-1.5 rounded-lg border',
                          key.status === 'Disponível' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600' : 'bg-amber-50/50 border-amber-100 text-amber-600'
                        )}>
                          <Key className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-slate-800 text-sm">{key.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-500 max-w-xs truncate" title={key.description}>
                        {key.description}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {key.status === 'Emprestada' ? (
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-700 text-xs">
                            {key.currentBorrower}
                          </p>
                          <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(key.borrowedAt)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px] flex items-center gap-1">
                          <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                          No armário (Disponível)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap bg-slate-50">
                      <div className="flex items-center justify-center gap-2">
                        {key.status === 'Emprestada' ? (
                          <button
                            onClick={() => handleOpenReturnModal(key.id)}
                            className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3 py-1.5 rounded-xl border border-rose-200/60 shadow-sm transition-all text-xs active:scale-95"
                            title="Devolver Chave ao Armário"
                          >
                            <LogOut className="w-4 h-4 text-rose-600" />
                            Devolver
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenBorrow([key.id])}
                            className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-xl border border-emerald-200/60 shadow-sm transition-all text-xs active:scale-95"
                            title="Retirar / Emprestar Chave"
                          >
                            <LogIn className="w-4 h-4 text-emerald-600" />
                            Retirar
                          </button>
                        )}
                        <button
                          onClick={() => handleViewKeyHistory(key.id, key.name)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200/60 rounded-xl transition-all shadow-sm"
                          title="Ver Histórico da Chave"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditKey(key)}
                          className="p-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-xl transition-all shadow-sm"
                          title="Editar Chave"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteKey(key.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200/60 rounded-xl transition-all shadow-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                          title="Remover Chave"
                          disabled={key.status === 'Emprestada'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Modal - Borrow Key */}
      {showBorrowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Emprestar Chave</h3>
              <button
                onClick={() => setShowBorrowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBorrowSubmit} className="p-6 space-y-4">
              <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg text-purple-600 shadow-sm">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {selectedKeyIds.length} {selectedKeyIds.length === 1 ? 'Chave selecionada' : 'Chaves selecionadas'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">
                    {selectedKeyIds.map(id => keys.find(k => k.id === id)?.name).filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nome do Solicitante *
                </label>
                <input
                  type="text"
                  required
                  value={borrower}
                  onChange={(e) => {
                    setBorrower(e.target.value);
                    setShowEmployeeDropdown(true);
                  }}
                  onFocus={() => setShowEmployeeDropdown(true)}
                  onBlur={() => setTimeout(() => setShowEmployeeDropdown(false), 200)}
                  placeholder={isSearchingEmployees ? "Buscando dados da API..." : "Pesquise por nome ou matrícula"}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                  autoComplete="off"
                />
                
                {showEmployeeDropdown && borrower.length > 0 && employees.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {employees
                      .filter(emp => 
                        (emp.nome && emp.nome.toLowerCase().includes(borrower.toLowerCase())) || 
                        (emp.matricula && String(emp.matricula).includes(borrower))
                      )
                      .slice(0, 10)
                      .map((emp, idx) => (
                        <div 
                          key={idx}
                          className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                          onClick={() => {
                            setBorrower(`${emp.matricula} - ${emp.nome}`);
                            if (emp.ccusto_nome) setDepartment(emp.ccusto_nome);
                            setShowEmployeeDropdown(false);
                          }}
                        >
                          <div className="font-semibold text-sm text-slate-800">{emp.matricula} - {emp.nome}</div>
                          <div className="text-xs text-slate-500">Setor: {emp.ccusto_nome}</div>
                        </div>
                    ))}
                  </div>
                )}
                <div className="mt-1 text-[10px] text-slate-400 font-medium">
                  {isSearchingEmployees ? (
                    <span className="text-blue-500">Conectando à API...</span>
                  ) : apiError ? (
                    <span className="text-red-500">Erro na API: {apiError}</span>
                  ) : employees.length > 0 ? (
                    <span className="text-emerald-500">{employees.length} registro(s) carregado(s).</span>
                  ) : (
                    <span>Nenhum dado carregado da API.</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Setor / Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Ex: T.I., Manutenção, Elevadores S.A."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Finalidade / Destino *
                </label>
                <textarea
                  required
                  rows={3}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Descreva brevemente o motivo da retirada..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Quem Autorizou a Retirada? (Senha do Vigia) *
                </label>
                <input
                  type="password"
                  required
                  value={guardPassword}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGuardPassword(val);
                    const matchedGuard = findGuardByPin(val);
                    if (matchedGuard) {
                      setGuardName(matchedGuard.name);
                      setGuardError(false);
                    } else {
                      setGuardName('');
                      if (guardError) setGuardError(false);
                    }
                  }}
                  placeholder="Digite a senha (PIN)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                  autoComplete="off"
                />
                {guardName ? (
                  <p className="text-[11px] text-emerald-600 mt-1.5 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Vigia Autenticado: {guardName}
                  </p>
                ) : guardError ? (
                  <p className="text-[10px] text-red-500 mt-1.5 font-medium">Senha inválida ou vigia não encontrado.</p>
                ) : null}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBorrowModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-purple-500/20 text-sm"
                >
                  Confirmar Retirada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Nova Chave */}
      {showNewKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingKey ? 'Editar Chave' : 'Nova Chave (Claviculário)'}
              </h3>
              <button
                onClick={() => {
                  setShowNewKeyModal(false);
                  setEditingKey(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKeySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Etiqueta / Nome da Chave *
                </label>
                <input
                  type="text"
                  required
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Ex: Sala de Reunião Bloco A"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Descrição (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={newKeyDesc}
                  onChange={(e) => setNewKeyDesc(e.target.value)}
                  placeholder="Descreva detalhes como armários internos, blocos ou restrições de acesso..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewKeyModal(false);
                    setEditingKey(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-purple-500/20 text-sm"
                >
                  {editingKey ? 'Salvar Alterações' : 'Adicionar Chave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Return Key */}
      {showReturnModal && returningKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Devolver Chave</h3>
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setReturningKey(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Chave Sendo Devolvida
                </label>
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-sm font-semibold text-slate-700">
                  {returningKey.name}
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Quem está devolvendo? *
                </label>
                <input
                  type="text"
                  required
                  value={returner}
                  onChange={(e) => {
                    setReturner(e.target.value);
                    setShowEmployeeDropdown(true);
                  }}
                  onFocus={() => setShowEmployeeDropdown(true)}
                  onBlur={() => setTimeout(() => setShowEmployeeDropdown(false), 200)}
                  placeholder={isSearchingEmployees ? "Buscando dados da API..." : "Pesquise por nome ou matrícula"}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all"
                  autoComplete="off"
                />
                
                {showEmployeeDropdown && returner.length > 0 && employees.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {employees
                      .filter(emp => 
                        (emp.nome && emp.nome.toLowerCase().includes(returner.toLowerCase())) || 
                        (emp.matricula && String(emp.matricula).includes(returner))
                      )
                      .slice(0, 10)
                      .map((emp, idx) => (
                        <div 
                          key={idx}
                          className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                          onClick={() => {
                            setReturner(`${emp.matricula} - ${emp.nome}`);
                            setShowEmployeeDropdown(false);
                          }}
                        >
                          <div className="font-semibold text-sm text-slate-800">{emp.matricula} - {emp.nome}</div>
                          <div className="text-xs text-slate-500">Setor: {emp.ccusto_nome}</div>
                        </div>
                    ))}
                  </div>
                )}
                <div className="mt-1 text-[10px] text-slate-400 font-medium">
                  {isSearchingEmployees ? (
                    <span className="text-blue-500">Conectando à API...</span>
                  ) : apiError ? (
                    <span className="text-red-500">Erro na API: {apiError}</span>
                  ) : employees.length > 0 ? (
                    <span className="text-emerald-500">{employees.length} registro(s) carregado(s).</span>
                  ) : (
                    <span>Nenhum dado carregado da API.</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Quem Recebeu? (Senha do Vigia) *
                </label>
                <input
                  type="password"
                  required
                  value={guardPassword}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGuardPassword(val);
                    const matchedGuard = findGuardByPin(val);
                    if (matchedGuard) {
                      setGuardName(matchedGuard.name);
                      setGuardError(false);
                    } else {
                      setGuardName('');
                      if (guardError) setGuardError(false);
                    }
                  }}
                  placeholder="Digite a senha (PIN)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all"
                  autoComplete="off"
                />
                {guardName ? (
                  <p className="text-[11px] text-emerald-600 mt-1.5 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Vigia Autenticado: {guardName}
                  </p>
                ) : guardError ? (
                  <p className="text-[10px] text-red-500 mt-1.5 font-medium">Senha inválida ou vigia não encontrado.</p>
                ) : null}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowReturnModal(false);
                    setReturningKey(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/20 text-sm"
                >
                  Confirmar Devolução
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Specific Key History */}
      {showKeyHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 my-8 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Histórico: {selectedKeyName}
              </h3>
              <button
                onClick={() => setShowKeyHistoryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-0 overflow-x-auto overflow-y-auto flex-1">
              {selectedKeyHistory.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-slate-500">
                  <Clock className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="font-medium text-slate-600">Nenhum histórico encontrado para esta chave.</p>
                </div>
              ) : (
                <table className="w-full text-sm border-collapse min-w-[700px]">
                  <thead className="bg-slate-800 sticky top-0 z-10">
                    <tr className="border-b border-slate-900 text-white text-[11px] font-extrabold uppercase tracking-wider">
                      <th className="px-5 py-3.5 text-left w-[25%]">Solicitante / Setor</th>
                      <th className="px-5 py-3.5 text-left w-[32%]">Liberado Por (Vigia Entregou)</th>
                      <th className="px-5 py-3.5 text-left w-[33%]">Recebido Por (Vigia Aceitou)</th>
                      <th className="px-5 py-3.5 text-center w-[10%]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {selectedKeyHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 align-top">
                          <div className="text-sm font-bold text-slate-800">{item.borrower}</div>
                          <div className="text-xs text-slate-500 font-medium">{item.department}</div>
                          {item.purpose && (
                            <div className="text-[11px] text-slate-400 italic mt-0.5" title={item.purpose}>
                              Motivo: {item.purpose}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 align-top">
                          <div className="text-xs font-semibold text-amber-600">
                            {formatDateTime(item.borrowedAt)}
                          </div>
                          <div className="text-xs font-bold text-slate-700 mt-1 flex items-center gap-1 flex-wrap">
                            <span className="text-slate-400 font-normal">Vigia:</span>
                            {item.authorizedBy ? (
                              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-md font-semibold">
                                {item.authorizedBy}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md font-normal italic">
                                Vigia Portaria
                              </span>
                            )}
                          </div>
                          {item.borrower && (
                            <div className="text-[11px] text-slate-600 mt-1">
                              Entregue para: <span className="font-semibold text-slate-800">{item.borrower}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 align-top">
                          {item.returnedAt ? (
                            <>
                              <div className="text-xs font-semibold text-emerald-600">
                                {formatDateTime(item.returnedAt)}
                              </div>
                              <div className="text-xs font-bold text-slate-700 mt-1 flex items-center gap-1 flex-wrap">
                                <span className="text-slate-400 font-normal">Vigia:</span>
                                {item.returnedAuthorizedBy ? (
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md font-semibold">
                                    {item.returnedAuthorizedBy}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md font-normal italic">
                                    Vigia Portaria
                                  </span>
                                )}
                              </div>
                              {item.returnedBy && (
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  Devolvido por: {item.returnedBy}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-amber-600 italic font-medium">Chave em posse (não devolvida)</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 align-top text-center">
                          <span className={clsx(
                            'text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border inline-block',
                            item.returnedAt
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          )}>
                            {item.returnedAt ? 'Devolvida' : 'Emprestada'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setShowKeyHistoryModal(false)}
                className="bg-white hover:bg-slate-100 text-slate-700 font-semibold px-4 py-2 border border-slate-200 rounded-xl transition-all shadow-sm text-sm"
              >
                Fechar Histórico
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
