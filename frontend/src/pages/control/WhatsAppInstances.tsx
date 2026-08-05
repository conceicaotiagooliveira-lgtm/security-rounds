import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, XCircle, RefreshCw, QrCode, MessageCircle, Edit2, Trash2, Smartphone, Eye, EyeOff } from 'lucide-react';
import { whatsappApi, type WhatsAppInstance, type WhatsAppInstanceCreate } from '@/services/whatsappApi';

export default function WhatsAppInstances() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<WhatsAppInstanceCreate>({ name: '', api_url: '', api_key: '', description: '' });
  const [showApiKey, setShowApiKey] = useState(false);
  
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrBase64, setQrBase64] = useState<string | null>(null);

  useEffect(() => {
    fetchInstances();
  }, []);

  const fetchInstances = async () => {
    setLoading(true);
    try {
      const data = await whatsappApi.getInstances();
      setInstances(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erro ao carregar instâncias");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await whatsappApi.updateInstance(editingId, formData);
      } else {
        await whatsappApi.createInstance(formData);
      }
      setIsModalOpen(false);
      fetchInstances();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erro ao salvar instância");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir esta instância?")) return;
    try {
      await whatsappApi.deleteInstance(id);
      fetchInstances();
    } catch (err: any) {
      alert("Erro ao excluir");
    }
  };

  const handleCheckStatus = async (id: number) => {
    try {
      await whatsappApi.checkInstanceStatus(id);
      fetchInstances();
    } catch (err: any) {
      alert("Erro ao verificar status");
    }
  };

  const handleShowQr = async (id: number) => {
    try {
      const data = await whatsappApi.getQrCode(id);
      setQrBase64(data.base64);
      setQrModalOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erro ao buscar QR Code. Verifique se a instância está configurada corretamente na Evolution.");
    }
  };

  const handleTestMessage = async (id: number) => {
    const rawNumber = window.prompt("Digite o número do WhatsApp (com DDD):");
    if (!rawNumber) return;

    let number = rawNumber.replace(/\D/g, ''); // apenas números
    if (number.length === 10 || number.length === 11) {
      number = "55" + number; // Adiciona DDI Brasil se não tiver
    }
    // Formata do jeito que o whatsapp precisa na API
    if (!number.startsWith('+')) {
      number = '+' + number;
    }

    const text = window.prompt("Digite a mensagem de teste:", "Olá! Esta é uma mensagem de teste do sistema.");
    if (!text) return;

    try {
      await whatsappApi.sendTestMessage(id, number, text);
      alert("Mensagem enviada com sucesso!");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erro ao enviar mensagem");
    }
  };

  const openEdit = (instance: WhatsAppInstance) => {
    setEditingId(instance.id);
    setFormData({
      name: instance.name,
      api_url: instance.api_url,
      api_key: instance.api_key,
      description: instance.description || ''
    });
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({ name: '', api_url: '', api_key: '', description: '' });
    setIsModalOpen(true);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 flex flex-col p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Smartphone className="w-7 h-7 text-emerald-600" />
            Conexões WhatsApp
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Gerencie as instâncias da Evolution API (Envios e Pareamento)</p>
        </div>
        <button 
          onClick={openCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nova Instância
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">Carregando instâncias...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-200">{error}</div>
      ) : instances.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 rounded-3xl p-10 bg-white">
          <Smartphone className="w-16 h-16 mb-4 text-slate-300" />
          <h3 className="text-xl font-bold text-slate-600 mb-2">Nenhuma instância configurada</h3>
          <p className="text-sm">Clique em "Nova Instância" para cadastrar uma conexão da Evolution API.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {instances.map(instance => {
            const isConnected = instance.status === 'Conectado';
            const isConnecting = instance.status === 'Conectando';
            
            return (
              <div key={instance.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className={`h-1.5 w-full ${isConnected ? 'bg-emerald-500' : isConnecting ? 'bg-amber-400' : 'bg-red-500'}`} />
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{instance.name}</h3>
                      {instance.description && <p className="text-sm text-slate-500 mt-1">{instance.description}</p>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(instance)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(instance.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-lg w-max mb-4 ${
                    isConnected ? 'bg-emerald-50 text-emerald-700' : 
                    isConnecting ? 'bg-amber-50 text-amber-700' : 
                    'bg-red-50 text-red-700'
                  }`}>
                    {isConnected ? <CheckCircle className="w-4 h-4" /> : 
                     isConnecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 
                     <XCircle className="w-4 h-4" />}
                    {instance.status}
                  </div>

                  <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg font-mono truncate border border-slate-100">
                    {instance.api_url}
                  </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50 p-3 flex flex-wrap gap-2">
                  <button onClick={() => handleCheckStatus(instance.id)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex-1 justify-center">
                    <RefreshCw className="w-3.5 h-3.5" /> Atualizar
                  </button>
                  <button onClick={() => handleShowQr(instance.id)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex-1 justify-center">
                    <QrCode className="w-3.5 h-3.5" /> Parear / QR
                  </button>
                  {isConnected && (
                    <button onClick={() => handleTestMessage(instance.id)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex-1 justify-center">
                      <MessageCircle className="w-3.5 h-3.5" /> Testar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CRIAR/EDITAR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[5000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-lg text-slate-800">{editingId ? 'Editar Instância' : 'Nova Instância'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2"><XCircle className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nome da Instância</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 font-medium text-slate-800 transition-colors" placeholder="Ex: API Produção" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">URL da API (Evolution)</label>
                <input required type="url" value={formData.api_url} onChange={e => setFormData({...formData, api_url: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 font-medium text-slate-800 transition-colors font-mono" placeholder="Ex: http://192.168.0.53:8080" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">API Key (Global ou da Instância)</label>
                <div className="relative">
                  <input required type={showApiKey ? "text" : "password"} value={formData.api_key} onChange={e => setFormData({...formData, api_key: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm outline-none focus:border-emerald-500 font-medium text-slate-800 transition-colors font-mono" placeholder="Chave de segurança..." />
                  <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Descrição (Opcional)</label>
                <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 font-medium text-slate-800 transition-colors resize-none" rows={3} placeholder="Notas sobre esta conexão..." />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">Salvar Instância</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QR CODE */}
      {qrModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[5000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col p-8 text-center items-center">
            <h2 className="font-bold text-xl text-slate-800 mb-2">Escaneie o QR Code</h2>
            <p className="text-sm text-slate-500 mb-6">Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e escaneie o código abaixo para vincular.</p>
            
            {qrBase64 ? (
              <div className="bg-white p-2 rounded-2xl border-4 border-emerald-100 shadow-inner mb-6">
                <img src={qrBase64.startsWith('data:image') ? qrBase64 : `data:image/png;base64,${qrBase64}`} alt="QR Code" className="w-64 h-64 object-contain" />
              </div>
            ) : (
              <div className="w-64 h-64 bg-slate-100 rounded-2xl animate-pulse mb-6 flex items-center justify-center text-slate-400">
                Aguardando...
              </div>
            )}
            
            <button onClick={() => { setQrModalOpen(false); setQrBase64(null); }} className="w-full px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">
              Fechar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
