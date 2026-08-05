import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Link2, 
  Trash2, 
  Edit3, 
  X, 
  PlusCircle,
  MinusCircle,
  Lock,
  Globe,
  Database,
  Play
} from 'lucide-react';
import api from '@/services/api';
import { settingsApi } from '@/api/settingsApi';

interface ApiParam {
  key: string;
  value: string;
}

export interface ApiConfig {
  id: string;
  type: 'api' | 'database';
  name: string;
  
  // API fields
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  authType?: 'none' | 'basic' | 'bearer';
  username?: string;
  password?: string;
  token?: string;
  parameters?: ApiParam[];

  // Database fields
  dbEngine?: 'mysql' | 'sqlite';
  dbHost?: string;
  dbPort?: string;
  dbUser?: string;
  dbPassword?: string;
  dbName?: string;
  dbQuery?: string;
}

export default function ApisSettings() {
  const [apis, setApis] = useState<ApiConfig[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingApi, setEditingApi] = useState<ApiConfig | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { loading: boolean, data?: string, error?: string }>>({});

  // Form State
  const [type, setType] = useState<'api' | 'database'>('api');
  const [name, setName] = useState('');
  
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET');
  const [authType, setAuthType] = useState<'none' | 'basic' | 'bearer'>('none');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [parameters, setParameters] = useState<ApiParam[]>([{ key: '', value: '' }]);

  const [dbEngine, setDbEngine] = useState<'mysql' | 'sqlite'>('mysql');
  const [dbHost, setDbHost] = useState('');
  const [dbPort, setDbPort] = useState('3306');
  const [dbUser, setDbUser] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [dbName, setDbName] = useState('');
  const [dbQuery, setDbQuery] = useState('');

  useEffect(() => {
    const fetchApis = async () => {
      try {
        const cached = await settingsApi.getSetting('sgp_api_configs');
        if (cached) {
          setApis(JSON.parse(cached));
        }
      } catch (err) {
        console.error('Failed to load api configs', err);
      }
    };
    fetchApis();
  }, []);

  const saveApis = async (newApis: ApiConfig[]) => {
    setApis(newApis);
    try {
      await settingsApi.saveSetting('sgp_api_configs', JSON.stringify(newApis));
    } catch (err) {
      console.error('Failed to save api configs', err);
    }
  };

  const handleOpenModal = (api?: ApiConfig) => {
    if (api) {
      setEditingApi(api);
      setType(api.type || 'api');
      setName(api.name || '');
      setUrl(api.url || '');
      setMethod(api.method || 'GET');
      setAuthType(api.authType || 'none');
      setUsername(api.username || '');
      setPassword(api.password || '');
      setToken(api.token || '');
      setParameters(api.parameters && api.parameters.length > 0 ? [...api.parameters] : [{ key: '', value: '' }]);
      
      setDbEngine(api.dbEngine || 'mysql');
      setDbHost(api.dbHost || '');
      setDbPort(api.dbPort || '3306');
      setDbUser(api.dbUser || '');
      setDbPassword(api.dbPassword || '');
      setDbName(api.dbName || '');
      setDbQuery(api.dbQuery || '');
    } else {
      setEditingApi(null);
      setType('api');
      setName('');
      setUrl('');
      setMethod('GET');
      setAuthType('none');
      setUsername('');
      setPassword('');
      setToken('');
      setParameters([{ key: '', value: '' }]);
      
      setDbEngine('mysql');
      setDbHost('');
      setDbPort('3306');
      setDbUser('');
      setDbPassword('');
      setDbName('');
      setDbQuery('');
    }
    setShowModal(true);
  };

  const handleAddParam = () => {
    setParameters([...parameters, { key: '', value: '' }]);
  };

  const handleRemoveParam = (index: number) => {
    const newParams = [...parameters];
    newParams.splice(index, 1);
    if (newParams.length === 0) newParams.push({ key: '', value: '' });
    setParameters(newParams);
  };

  const handleParamChange = (index: number, field: 'key' | 'value', val: string) => {
    const newParams = [...parameters];
    newParams[index][field] = val;
    setParameters(newParams);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('Preencha o Nome da integração.');
      return;
    }
    if (type === 'api' && !url) {
      alert('Preencha a URL da API.');
      return;
    }
    if (type === 'database' && !dbQuery) {
      alert('Preencha a consulta SQL.');
      return;
    }

    // Clean up empty parameters
    const cleanParams = parameters.filter(p => p.key.trim() !== '');

    const newConfig: ApiConfig = {
      id: editingApi ? editingApi.id : Date.now().toString(),
      type,
      name,
      url: type === 'api' ? url : undefined,
      method: type === 'api' ? method : undefined,
      authType: type === 'api' ? authType : undefined,
      username: type === 'api' && authType === 'basic' ? username : undefined,
      password: type === 'api' && authType === 'basic' ? password : undefined,
      token: type === 'api' && authType === 'bearer' ? token : undefined,
      parameters: type === 'api' ? cleanParams : [],
      
      dbEngine: type === 'database' ? dbEngine : undefined,
      dbHost: type === 'database' ? dbHost : undefined,
      dbPort: type === 'database' ? dbPort : undefined,
      dbUser: type === 'database' ? dbUser : undefined,
      dbPassword: type === 'database' ? dbPassword : undefined,
      dbName: type === 'database' ? dbName : undefined,
      dbQuery: type === 'database' ? dbQuery : undefined,
    };

    if (editingApi) {
      saveApis(apis.map(a => a.id === editingApi.id ? newConfig : a));
    } else {
      saveApis([...apis, newConfig]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir esta configuração de API?')) {
      saveApis(apis.filter(a => a.id !== id));
    }
  };

  const getMethodColor = (method: string) => {
    switch(method) {
      case 'GET': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'POST': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PUT': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'DELETE': return 'bg-red-100 text-red-700 border-red-200';
      case 'PATCH': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleTestApi = async (apiConfig: ApiConfig) => {
    setTestResults(prev => ({ ...prev, [apiConfig.id]: { loading: true } }));
    
    try {
      if (apiConfig.type === 'database') {
        const response = await api.post('/proxy/sql', {
          engine: apiConfig.dbEngine,
          host: apiConfig.dbHost,
          port: parseInt(apiConfig.dbPort || '3306', 10),
          user: apiConfig.dbUser,
          password: apiConfig.dbPassword,
          database: apiConfig.dbName,
          query: apiConfig.dbQuery
        });
        
        setTestResults(prev => ({ 
          ...prev, 
          [apiConfig.id]: { 
            loading: false, 
            data: JSON.stringify(response.data, null, 2) 
          } 
        }));
      } else {
        let finalUrl = apiConfig.url || '';
        if (apiConfig.method === 'GET' && apiConfig.parameters && apiConfig.parameters.length > 0) {
           const params = new URLSearchParams();
           apiConfig.parameters.forEach(p => {
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

        setTestResults(prev => ({ 
          ...prev, 
          [apiConfig.id]: { 
            loading: false, 
            data: JSON.stringify(response.data, null, 2) 
          } 
        }));
      }
    } catch (error: any) {
      setTestResults(prev => ({ 
        ...prev, 
        [apiConfig.id]: { 
          loading: false, 
          error: error.response?.data?.detail || error.message || 'Erro ao testar conexão' 
        } 
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Globe className="w-8 h-8 text-blue-600" />
            Configuração de Integrações
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie APIs externas e consultas diretas a Bancos de Dados.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 text-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Integração
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {apis.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl border-dashed">
            <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mb-4">
              <Link2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">Nenhuma API configurada</h3>
            <p className="text-sm text-slate-500 mt-1 text-center max-w-sm">
              Adicione conexões com outros sistemas para trocar dados automaticamente.
            </p>
          </div>
        ) : (
          apis.map(api => (
            <div key={api.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 relative group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${api.type === 'database' ? 'bg-indigo-50 text-indigo-500 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                    {api.type === 'database' ? <Database className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{api.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {api.type === 'database' ? (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border bg-indigo-100 text-indigo-700 border-indigo-200">
                          {api.dbEngine}
                        </span>
                      ) : (
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${getMethodColor(api.method || 'GET')}`}>
                          {api.method}
                        </span>
                      )}
                      {api.type === 'api' && api.authType !== 'none' && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          {api.authType?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenModal(api)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(api.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {api.type === 'database' ? (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-xs text-slate-600 break-all overflow-hidden relative">
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-300 rounded-l-xl"></div>
                  <span className="pl-2 line-clamp-2" title={api.dbQuery}>{api.dbQuery}</span>
                </div>
              ) : (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-xs text-slate-600 break-all overflow-hidden relative">
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-blue-300 rounded-l-xl"></div>
                  <span className="pl-2">{api.url}</span>
                </div>
              )}

              {api.type === 'api' && api.parameters && api.parameters.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Parâmetros ({api.parameters.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {api.parameters.map((p, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-lg border border-slate-200">
                        <strong className="text-slate-800">{p.key}</strong> = {p.value || 'vazio'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <button 
                  onClick={() => handleTestApi(api)}
                  disabled={testResults[api.id]?.loading}
                  className="text-xs bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-medium disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  {testResults[api.id]?.loading ? 'Testando...' : 'Testar Conexão'}
                </button>
              </div>

              {testResults[api.id] && !testResults[api.id].loading && (
                <div className="bg-slate-900 rounded-xl p-3 mt-1 font-mono text-[10px] text-emerald-400 overflow-x-auto max-h-64 border border-slate-800">
                  {testResults[api.id].error ? (
                    <div className="text-red-400 whitespace-pre-wrap">ERRO: {testResults[api.id].error}</div>
                  ) : (
                    <pre>{testResults[api.id].data}</pre>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Link2 className="w-5 h-5 text-blue-600" />
                {editingApi ? 'Editar API' : 'Nova Conexão de API'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo de Conexão *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="connectionType" 
                        checked={type === 'api'} 
                        onChange={() => setType('api')} 
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700">API (REST)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="connectionType" 
                        checked={type === 'database'} 
                        onChange={() => setType('database')} 
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Banco de Dados (SQL/MySQL)</span>
                    </label>
                  </div>
                </div>

                <div className="col-span-full">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome de Identificação *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={type === 'api' ? "Ex: Integração ERP Sênior" : "Ex: Consulta Funcionários"}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                  />
                </div>

                {type === 'api' ? (
                  <>
                    <div className="col-span-full">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">URL da API (Endpoint) *</label>
                      <input
                        type="url"
                        required={type === 'api'}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://api.exemplo.com.br/v1/dados"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Método *</label>
                      <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none font-semibold"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Autenticação</label>
                      <select
                        value={authType}
                        onChange={(e) => setAuthType(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                      >
                        <option value="none">Nenhuma</option>
                        <option value="basic">Basic Auth (Usuário e Senha)</option>
                        <option value="bearer">Bearer Token</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-full md:col-span-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo do Banco *</label>
                      <select
                        value={dbEngine}
                        onChange={(e) => setDbEngine(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none font-semibold"
                      >
                        <option value="mysql">MySQL</option>
                        <option value="sqlite">SQLite</option>
                      </select>
                    </div>
                    {dbEngine === 'mysql' && (
                      <div className="col-span-full md:col-span-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome do Banco *</label>
                        <input
                          type="text"
                          required={type === 'database'}
                          value={dbName}
                          onChange={(e) => setDbName(e.target.value)}
                          placeholder="Ex: erp_database"
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                        />
                      </div>
                    )}
                    {dbEngine === 'sqlite' && (
                      <div className="col-span-full">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Caminho do Arquivo SQLite *</label>
                        <input
                          type="text"
                          required={type === 'database'}
                          value={dbName}
                          onChange={(e) => setDbName(e.target.value)}
                          placeholder="Ex: app.db"
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                        />
                      </div>
                    )}

                    {dbEngine === 'mysql' && (
                      <>
                        <div className="col-span-full md:col-span-1">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Host *</label>
                          <input
                            type="text"
                            required={type === 'database' && dbEngine === 'mysql'}
                            value={dbHost}
                            onChange={(e) => setDbHost(e.target.value)}
                            placeholder="Ex: 127.0.0.1 ou db.exemplo.com"
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                          />
                        </div>
                        <div className="col-span-full md:col-span-1">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Porta</label>
                          <input
                            type="text"
                            value={dbPort}
                            onChange={(e) => setDbPort(e.target.value)}
                            placeholder="3306"
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                          />
                        </div>
                        <div className="col-span-full md:col-span-1">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Usuário *</label>
                          <input
                            type="text"
                            required={type === 'database' && dbEngine === 'mysql'}
                            value={dbUser}
                            onChange={(e) => setDbUser(e.target.value)}
                            placeholder="root"
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                          />
                        </div>
                        <div className="col-span-full md:col-span-1">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Senha</label>
                          <input
                            type="password"
                            value={dbPassword}
                            onChange={(e) => setDbPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                          />
                        </div>
                      </>
                    )}

                    <div className="col-span-full">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Consulta SQL *</label>
                      <textarea
                        required={type === 'database'}
                        value={dbQuery}
                        onChange={(e) => setDbQuery(e.target.value)}
                        placeholder="SELECT * FROM funcionarios WHERE status = 'ativo' LIMIT 10;"
                        rows={4}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Authentication Details */}
              {type === 'api' && authType === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Usuário</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Senha</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                    />
                  </div>
                </div>
              )}

              {type === 'api' && authType === 'bearer' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Token de Acesso (Bearer)</label>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="eyJh..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                  />
                </div>
              )}

              {/* Parameters List */}
              {type === 'api' && (
                <div className="border-t border-slate-100 pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Parâmetros (Query/Body)</label>
                    <button type="button" onClick={handleAddParam} className="text-xs text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1">
                      <PlusCircle className="w-3.5 h-3.5" /> Adicionar Parâmetro
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {parameters.map((param, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Chave (Ex: status)"
                          value={param.key}
                          onChange={(e) => handleParamChange(index, 'key', e.target.value)}
                          className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none bg-slate-50 focus:bg-white transition-colors"
                        />
                        <input
                          type="text"
                          placeholder="Valor (Ex: ativo)"
                          value={param.value}
                          onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                          className="w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none bg-slate-50 focus:bg-white transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveParam(index)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <MinusCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95">
                  {editingApi ? 'Salvar Alterações' : 'Salvar API'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
