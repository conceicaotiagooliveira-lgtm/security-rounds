import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  LogIn, 
  LogOut, 
  Building2, 
  UserCheck, 
  Clock, 
  Filter, 
  X, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  ShieldAlert,
  History,
  Car,
  Edit2,
  AlertTriangle,
  Camera,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowDownUp,
  ArrowDownAZ,
  ArrowUpZA,
  XCircle,
  Ban,
  MapPin
} from 'lucide-react';
import api, { getAssetUrl } from '@/services/api';
import { thirdPartyApi } from '../../api/thirdPartyApi';
import { companyApi } from '../../api/companyApi';
import { settingsApi } from '../../api/settingsApi';
import { useAuthStore } from '../../store/authStore';
import clsx from 'clsx';

const SearchableCompanySelect = ({ value, onChange, options, onAddCustom }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt: any) => 
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white cursor-pointer flex justify-between items-center focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
      >
        <span className={value ? "text-slate-800 font-medium" : "text-slate-500"}>
          {value || "Selecione a empresa..."}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); onChange(''); setSearch(''); }}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-64 animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Pesquisar empresa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt: any) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.name);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                >
                  {opt.name}
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-sm text-slate-500 text-center">
                Nenhuma empresa encontrada
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              onAddCustom();
              setIsOpen(false);
              setSearch('');
            }}
            className="w-full p-3 text-sm font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 flex items-center justify-center gap-2 border-t border-purple-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Empresa Manual
          </button>
        </div>
      )}
    </div>
  );
};

const SearchableSectorSelect = ({ value, onChange, options, placeholder }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt: string) => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white cursor-pointer flex justify-between items-center focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all"
      >
        <span className={value ? "text-slate-800 font-medium truncate" : "text-slate-500"}>
          {value || placeholder || "Selecione..."}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); onChange(''); setSearch(''); }}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-64 animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Pesquisar setor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt: string, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                >
                  {opt}
                </button>
              ))
            ) : null}
            {search.trim().length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onChange(search);
                  setIsOpen(false);
                  setSearch('');
                }}
                className="w-full text-left px-3 py-2 text-sm text-emerald-700 font-semibold bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                Usar "{search}"
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const parseLocalDate = (dateStr?: string) => {
  if (!dateStr || dateStr.trim() === '') return new Date(0);
  if (dateStr.includes('T')) return new Date(dateStr);
  return new Date(dateStr + 'T12:00:00');
};

interface ThirdPartyEntry {
  id: string;
  name: string;
  company: string;
  document: string;
  vehiclePlate?: string;
  reason: string;
  destination: string;
  authorizedBy: string;
  checkInTime: string;
  checkOutTime?: string;
  checkOutAuthorizedBy?: string;
  status: 'Ativo' | 'Concluído';
  
  // NRs & Compliance
  asoDate?: string;
  sesmtTrainingDate?: string;
  sesmtDate?: string;
  requiresNr35?: boolean;
  nr35Date?: string;
  requiresNr10?: boolean;
  nr10Date?: string;
  customReqs?: Record<string, string>;
  photoBase64?: string;
  photoUrl?: string;
  photoDate?: string;
  isAdminService?: boolean;
  enableControlId?: boolean;
}

interface DocumentHistoryEntry {
  type: string;
  previousDate: string;
  newDate: string;
  updatedAt: string;
  updatedBy?: string;
}

interface ThirdPartyProfile {
  id: string;
  name: string;
  company: string;
  document: string;
  vehiclePlate?: string;
  asoDate?: string;
  sesmtTrainingDate?: string;
  sesmtDate?: string;
  customReqs?: Record<string, string>;
  photoBase64?: string;
  photoUrl?: string;
  photoDate?: string;
  isBanned?: boolean;
  banReason?: string;
  documentHistory?: DocumentHistoryEntry[];
  visitHistory?: VisitHistoryEntry[];
  isAdminService?: boolean;
}

interface VisitHistoryEntry {
  checkInTime: string;
  checkOutTime?: string;
  reason: string;
  destination: string;
  authorizedBy: string;
}

const SearchableDropdown = ({ value, onChange, options, placeholder, required, className }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt: any) => 
    opt.name.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        required={required}
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          // Se o valor digitado for a senha de um vigia, auto-preenche o nome dele
          const matchedGuard = options?.find((opt: any) => opt.auth_password && opt.auth_password === val);
          if (matchedGuard) {
            onChange(matchedGuard.name);
            setIsOpen(false);
          } else {
            onChange(val);
            setIsOpen(true);
          }
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {isOpen && (
        <div className="absolute z-[1000] top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt: any) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.name);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3.5 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                {opt.name} {opt.registration ? `(${opt.registration})` : ''}
              </button>
            ))
          ) : (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-3.5 py-2 text-sm text-emerald-600 hover:bg-emerald-50 font-medium transition-colors"
            >
              Usar "{value}"
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default function ThirdPartyControl() {
  const { user } = useAuthStore();
  const canDeleteThirdParty = user?.role === 'Administrador' || user?.permissions?.includes('delete_third_party');
  
  const [entries, setEntries] = useState<ThirdPartyEntry[]>([]);
  
  // New Company Modal State
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompCorporateName, setNewCompCorporateName] = useState('');
  const [newCompCnpj, setNewCompCnpj] = useState('');
  const [newCompActivityArea, setNewCompActivityArea] = useState('');
  const [newCompPhone, setNewCompPhone] = useState('');
  const [newCompEmail, setNewCompEmail] = useState('');
  const [newCompManager, setNewCompManager] = useState('');
  const [newCompStatus, setNewCompStatus] = useState<'Ativo' | 'Inativo'>('Ativo');

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newCompany = await companyApi.createCompany({
        name: newCompName,
        corporateName: newCompCorporateName,
        cnpj: newCompCnpj,
        activityArea: newCompActivityArea,
        phone: newCompPhone,
        email: newCompEmail,
        manager: newCompManager,
        status: newCompStatus
      });
      setCompaniesList([...companiesList, newCompany]);
      setSelectedCompanyId(newCompany.name);
      setShowCompanyModal(false);
      setToastMessage({ title: 'Sucesso', message: 'Empresa cadastrada com sucesso!', type: 'success' });
      setNewCompName('');
      setNewCompCorporateName('');
      setNewCompCnpj('');
      setNewCompActivityArea('');
      setNewCompPhone('');
      setNewCompEmail('');
      setNewCompManager('');
    } catch (error) {
      console.error('Error saving company:', error);
      setToastMessage({ title: 'Erro', message: 'Erro ao cadastrar empresa.', type: 'error' });
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [profilesCurrentPage, setProfilesCurrentPage] = useState(1);
  const [entriesCurrentPage, setEntriesCurrentPage] = useState(1);
  const profilesPerPage = 20;
  const entriesPerPage = 20;
  const [statusFilter, setStatusFilter] = useState<string>('No Local');

  useEffect(() => {
    setProfilesCurrentPage(1);
    setEntriesCurrentPage(1);
  }, [searchQuery, statusFilter]);



  const [showModal, setShowModal] = useState(false);
  const [guards, setGuards] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<{title: string; message: string; type: 'success' | 'warning' | 'error'} | null>(null);
  const [historyTab, setHistoryTab] = useState<'docs' | 'visits'>('docs');
  const [historyDateFilter, setHistoryDateFilter] = useState('');

  const showToast = (title: string, message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToastMessage({ title, message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };
  const [editingEntry, setEditingEntry] = useState<ThirdPartyEntry | null>(null);
  const [confirmCheckOutId, setConfirmCheckOutId] = useState<string | null>(null);
  const [checkOutPassword, setCheckOutPassword] = useState('');
  const [checkOutAuthorizedBy, setCheckOutAuthorizedBy] = useState('');
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [showBannedModal, setShowBannedModal] = useState(false);
  const [showTodayModal, setShowTodayModal] = useState(false);

  // Companies List State
  const [companiesList, setCompaniesList] = useState<{ id: string, name: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [internalContact, setInternalContact] = useState('');
  const [company, setCompany] = useState('');
  const [document, setDocument] = useState('');
  

  const [vehiclePlate, setVehiclePlate] = useState('');
  const [reason, setReason] = useState('');
  const [destination, setDestination] = useState('');
  const [authorizedBy, setAuthorizedBy] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Safety & NRs states
  const [asoDate, setAsoDate] = useState('');
  const [sesmtTrainingDate, setSesmtTrainingDate] = useState('');
  const [sesmtDate, setSesmtDate] = useState('');
  const [requiresNr35, setRequiresNr35] = useState(false);
  const [nr35Date, setNr35Date] = useState('');
  const [requiresNr10, setRequiresNr10] = useState(false);
  const [nr10Date, setNr10Date] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState('');
  
  // Unban interception state
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [unbanReason, setUnbanReason] = useState('');
  const [unbanAuthorizer, setUnbanAuthorizer] = useState('');

  // Dynamic requirements management states
  const [customRequirements, setCustomRequirements] = useState<{ id: string; name: string; code: string }[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [newReqName, setNewReqName] = useState('');
  
  // Object mapping requirement code -> boolean
  const [selectedReqs, setSelectedReqs] = useState<Record<string, boolean>>({});
  // Object mapping requirement code -> date string
  const [reqDates, setReqDates] = useState<Record<string, string>>({});

  // Webcam states
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [photoDateStr, setPhotoDateStr] = useState('');

  // Sector options from integration
  const [sectorOptions, setSectorOptions] = useState<string[]>([]);
  const [sectorAdminMap, setSectorAdminMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const cached = await settingsApi.getSetting('sgp_api_configs');
        if (cached) {
          const configs: any[] = JSON.parse(cached);
          const setorConfig = configs.find((c: any) => c.name.toUpperCase() === 'SETOR');
          if (setorConfig && setorConfig.type === 'database') {
            const response = await api.post('/proxy/sql', {
              engine: setorConfig.dbEngine,
              host: setorConfig.dbHost,
              port: parseInt(setorConfig.dbPort || '3306', 10),
              user: setorConfig.dbUser,
              password: setorConfig.dbPassword,
              database: setorConfig.dbName,
              query: setorConfig.dbQuery
            });
            if (response.data && response.data.data && Array.isArray(response.data.data)) {
              const adminMap: Record<string, boolean> = {};
              const sectors = response.data.data.map((row: any) => {
                const values = Object.values(row).filter(v => v !== null && v !== undefined);
                const label = values.slice(0, 2).join(' - ');
                if (values.length > 2) {
                  adminMap[label] = Boolean(Number(values[2]));
                }
                return label;
              }).filter(Boolean);
              console.log('Carregou setores:', sectors);
              setSectorAdminMap(adminMap);
              setSectorOptions(sectors);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load sector options', err);
      }
    };
    fetchSectors();
  }, []);
  const [isAdminService, setIsAdminService] = useState(false);
  const [showAdminWarning, setShowAdminWarning] = useState(false);
  const [enableControlId, setEnableControlId] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [photoValidityDays, setPhotoValidityDays] = useState(365);

  // Profiles and active selections
  const [profiles, setProfiles] = useState<ThirdPartyProfile[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [viewMode, setViewMode] = useState<'entries' | 'profiles'>('entries');
  const [editingProfile, setEditingProfile] = useState<ThirdPartyProfile | null>(null);
  const [alertModal, setAlertModal] = useState<{title: string, message: string, type: 'warning' | 'error' | 'success'} | null>(null);
  const [profileTab, setProfileTab] = useState<'cadastro' | 'historico'>('cadastro');
  const [historyDocFilter, setHistoryDocFilter] = useState('');
  
  // Sort states
  const [entriesSort, setEntriesSort] = useState<{column: string, direction: 'asc'|'desc'} | null>(null);
  
  // Quick Check-In and Renewal states
  const [showQuickCheckInModal, setShowQuickCheckInModal] = useState(false);
  const [selectedProfileForCheckIn, setSelectedProfileForCheckIn] = useState<ThirdPartyProfile | null>(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedProfileForRenewal, setSelectedProfileForRenewal] = useState<ThirdPartyProfile | null>(null);

  // Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Bulk Selection State
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const handleBulkDeleteProfiles = async () => {
    if (selectedProfileIds.length === 0) return;
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedProfileIds.length} cadastros? Isso também excluirá seus respectivos históricos e entradas.`)) return;
    
    setIsBulkDeleting(true);
    try {
      const res = await thirdPartyApi.bulkDeleteProfiles(selectedProfileIds);
      saveProfiles(profiles.filter(p => !selectedProfileIds.includes(p.id)));
      
      // Also remove their entries locally
      const deletedDocs = profiles.filter(p => selectedProfileIds.includes(p.id)).map(p => p.document);
      saveEntries(entries.filter(e => !deletedDocs.includes(e.document)));
      
      setSelectedProfileIds([]);
      showToast('Sucesso', `${res.deleted} cadastros excluídos em massa.`, 'success');
    } catch (error) {
      console.error('Error bulk deleting profiles:', error);
      showToast('Erro', 'Falha ao excluir cadastros em massa.', 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkDeleteEntries = async () => {
    if (selectedEntryIds.length === 0) return;
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedEntryIds.length} registros de acesso?`)) return;
    
    setIsBulkDeleting(true);
    try {
      const res = await thirdPartyApi.bulkDeleteEntries(selectedEntryIds);
      saveEntries(entries.filter(e => !selectedEntryIds.includes(e.id)));
      setSelectedEntryIds([]);
      showToast('Sucesso', `${res.deleted} registros de acesso excluídos em massa.`, 'success');
    } catch (error) {
      console.error('Error bulk deleting entries:', error);
      showToast('Erro', 'Falha ao excluir registros em massa.', 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleImportSubmit = async () => {
    if (!importFile) return;
    setIsImporting(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) throw new Error("Arquivo vazio ou sem registros.");
        
        const headers = lines[0].split(';').map(h => h.trim().toUpperCase());
        const profilesToImport: any[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(';').map(c => c.trim());
          if (cols.length < headers.length) continue;
          
          let name = '';
          let asoDate = '';
          let sesmtDate = '';
          let sesmtTrainingDate = '';
          const customReqs: Record<string, string> = {};
          
          const parseDate = (dStr: string) => {
            if (!dStr) return undefined;
            if (dStr.includes('/')) {
              const [d, m, y] = dStr.split('/');
              if (y) {
                const fullYear = y.length === 2 ? `20${y}` : y;
                return `${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
              }
            }
            return dStr;
          };
          
          headers.forEach((h, idx) => {
            const val = cols[idx];
            if (!val) return;
            
            if (h === 'FUNCIONÁRIO' || h === 'FUNCIONARIO' || h === 'NOME') name = val;
            else if (h === 'ASO') asoDate = parseDate(val) || '';
            else if (h === 'VALIDADE SESMT' || h === 'SESMT') sesmtDate = parseDate(val) || '';
            else if (h === 'DATA TREINAMENTO SESMT' || h === 'DATA DO TREINAMENTO' || h === 'TREINAMENTO SESMT' || h === 'TREINAMENTO') sesmtTrainingDate = parseDate(val) || '';
            else {
              const reqCode = h.toLowerCase().replace(/[^a-z0-9]/g, '');
              customReqs[reqCode] = parseDate(val) || '';
            }
          });
          
          if (!name) continue;
          
          profilesToImport.push({
            id: Date.now().toString() + i,
            name,
            document: 'IMP_' + i + '_' + Date.now(),
            company: 'NÃO INFORMADA',
            asoDate: asoDate || undefined,
            sesmtDate: sesmtDate || undefined,
            sesmtTrainingDate: sesmtTrainingDate || undefined,
            customReqs,
            isBanned: false,
            isAdminService: false,
            enableControlId: false,
            documentHistory: []
          });
        }
        
        const res = await thirdPartyApi.importBulk(profilesToImport);
        showToast('Sucesso!', `Foram importados ${res.imported} cadastros com sucesso.`, 'success');
        setShowImportModal(false);
        setImportFile(null);
        loadData();
      } catch (err: any) {
         showToast('Erro na Importação', err.message || 'Falha ao ler arquivo', 'error');
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      setIsImporting(false);
      showToast('Erro', 'Falha ao ler o arquivo selecionado', 'error');
    };
    reader.readAsText(importFile);
  };

  // Auto-fill form when CPF is typed
  useEffect(() => {
    if (document && document.length >= 11 && showProfileModal && !editingProfile) {
      const existing = profiles.find(p => p.document.replace(/\D/g, '') === document.replace(/\D/g, ''));
      if (existing) {
        setName(existing.name);
        
        const cosList = companiesList;
        const foundCo = cosList.find((c: any) => c.name.toLowerCase() === existing.company.toLowerCase());
        if (foundCo) {
          setSelectedCompanyId(foundCo.name);
          setIsCustom(false);
          setCustomCompanyName('');
        } else {
          setSelectedCompanyId('__custom__');
          setIsCustom(true);
          setCustomCompanyName(existing.company);
        }
        
        setVehiclePlate(existing.vehiclePlate || '');
        setAsoDate(existing.asoDate || '');
        setSesmtTrainingDate(existing.sesmtTrainingDate || '');
        setSesmtDate(existing.sesmtDate || '');
        setIsBanned(existing.isBanned || false);
        setBanReason(existing.banReason || '');
        setIsAdminService(existing.isAdminService || (existing as any).is_admin_service || false);
        setEnableControlId(existing.enableControlId || (existing as any).enable_control_id || false);
        
        const initialSelecteds: Record<string, boolean> = {};
        const initialDates: Record<string, string> = {};
        if (existing.customReqs) {
          Object.keys(existing.customReqs).forEach(code => {
            initialSelecteds[code] = true;
            initialDates[code] = existing.customReqs![code];
          });
        }
        setSelectedReqs(initialSelecteds);
        setReqDates(initialDates);
        
        setPhotoDataUrl(existing.photoUrl || existing.photoBase64 || '');
        setPhotoDateStr(existing.photoDate || '');
        setEditingProfile(existing);
        
        showToast('Cadastro Encontrado', 'Os dados do terceiro foram preenchidos automaticamente.', 'success');
      }
    }
  }, [document, showProfileModal, profiles, editingProfile, companiesList]);

  // Renewal form values
  const [renewAsoDate, setRenewAsoDate] = useState('');
  const [renewSesmtDate, setRenewSesmtDate] = useState('');
  const [renewCustomDates, setRenewCustomDates] = useState<Record<string, string>>({});  const loadData = async () => {
    try {
      const [entriesRes, profilesRes, configsRes] = await Promise.all([
        thirdPartyApi.getEntries(),
        thirdPartyApi.getProfiles(),
        thirdPartyApi.getConfigs()
      ]);
      setEntries(entriesRes);
      setProfiles(profilesRes);
      
      const customReqs = configsRes.filter((c: any) => c.type === 'custom_req').map((c: any) => c.value);
      if (customReqs.length > 0) setCustomRequirements(customReqs);
      
      const validityConfig = configsRes.find((c: any) => c.id === 'photo_validity_days');
      if (validityConfig) setPhotoValidityDays(validityConfig.value);

      // Companies from API
      try {
        const cos = await companyApi.getCompanies();
        setCompaniesList(cos);
      } catch (e) {
        console.error('Failed to fetch companies', e);
        setCompaniesList([]);
      }
    } catch (error) {
      console.error('Error loading third party data:', error);
      // Optional: showToast('Erro', 'Não foi possível carregar os dados de terceiros', 'error');
    }
  };

  useEffect(() => {
    loadData();

    const loadGuards = async () => {
      try {
        const res = await api.get('/guards');
        setGuards(res.data);
      } catch (err) {
        console.error('Erro ao carregar vigias:', err);
      }
    };
    loadGuards();
  }, []);

  const saveEntries = (newEntries: ThirdPartyEntry[]) => {
    setEntries(newEntries);
  };

  const saveProfiles = (newProfiles: ThirdPartyProfile[]) => {
    setProfiles(newProfiles);
  };

  const updateProfileHistory = async (document: string, visit: VisitHistoryEntry) => {
    let updatedProfile = null;
    setProfiles(prev => {
      const copy = [...prev];
      const idx = copy.findIndex(p => p.document === document);
      if (idx !== -1) {
        copy[idx] = {
          ...copy[idx],
          visitHistory: [visit, ...(copy[idx].visitHistory || [])]
        };
        updatedProfile = copy[idx];
      }
      return copy;
    });
    if (updatedProfile) await thirdPartyApi.saveProfile(updatedProfile);
  };

  const updateProfileCheckOut = async (document: string, checkOutTime: string, entry: ThirdPartyEntry) => {
    let updatedProfile = null;
    setProfiles(prev => {
      const copy = [...prev];
      const idx = copy.findIndex(p => p.document === document);
      if (idx !== -1) {
        let hist = [...(copy[idx].visitHistory || [])];
        
        const existingHistIdx = hist.findIndex(h => h.checkInTime === entry.checkInTime);
        if (existingHistIdx !== -1) {
          hist[existingHistIdx] = { ...hist[existingHistIdx], checkOutTime };
        } else {
          hist.unshift({
            checkInTime: entry.checkInTime,
            checkOutTime,
            destination: entry.destination,
            reason: entry.reason,
            authorizedBy: entry.authorizedBy
          });
          hist.sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());
        }
        
        copy[idx] = { ...copy[idx], visitHistory: hist };
        updatedProfile = copy[idx];
      }
      return copy;
    });
    if (updatedProfile) await thirdPartyApi.saveProfile(updatedProfile);
  };

  const handleOpenProfileRegister = () => {
    setEditingProfile(null);
    setName('');
    setCompany('');
    setSelectedCompanyId('');
    setCustomCompanyName('');
    setIsCustom(false);
    setDocument('');
    setVehiclePlate('');
    setAsoDate('');
    setSesmtTrainingDate('');
    setSesmtDate('');
    setSelectedReqs({});
    setReqDates({});
    setIsBanned(false);
    setBanReason('');
    setIsAdminService(false);
    setValidationError(null);
    setInternalContact('');
    setPhotoDataUrl('');
    setPhotoDateStr('');
    setEnableControlId(false);
    closeCamera();
    setShowProfileModal(true);
  };

  const syncWithControlId = async (name: string, photoBase64?: string, photoUrl?: string, entryId?: string) => {
    try {
      showToast('Control iD', 'Sincronizando com a catraca...', 'info');
      const response = await api.post('/control-id/grant-access', {
        name,
        photoBase64: photoBase64 || null,
        photoUrl: photoUrl || null,
        entryId: entryId || null
      });
      showToast('Control iD Sucesso', response.data.message || 'Acesso liberado no Control iD', 'success');
    } catch (err: any) {
      showToast('Erro no Control iD', err.response?.data?.detail || err.message, 'error');
    }
  };

  const revokeControlIdAccess = async (name: string, entryId?: string) => {
    try {
      showToast('Control iD', 'Removendo acesso da catraca...', 'info');
      const response = await api.post('/control-id/revoke-access', { name, entryId: entryId || null });
      showToast('Control iD Sucesso', response.data.message || 'Acesso removido com sucesso', 'success');
    } catch (err: any) {
      showToast('Erro no Control iD', err.response?.data?.detail || err.message, 'error');
    }
  };

  const handleOpenProfileEdit = (profile: ThirdPartyProfile, defaultTab: 'cadastro' | 'historico' = 'cadastro') => {
    setProfileTab(defaultTab);
    setEditingProfile(profile);
    setName(profile.name);
    setInternalContact(profile.internalContact || '');
    
    const cosList = companiesList;
    const found = cosList.find((c: any) => c.name.toLowerCase() === profile.company.toLowerCase());
    
    if (found) {
      setSelectedCompanyId(found.name);
      setIsCustom(false);
      setCustomCompanyName('');
    } else {
      setSelectedCompanyId('__custom__');
      setIsCustom(true);
      setCustomCompanyName(profile.company);
    }
    
    setCompany(profile.company);
    setDocument(profile.document);
    setVehiclePlate(profile.vehiclePlate || '');
    setAsoDate(profile.asoDate || '');
    setSesmtTrainingDate(profile.sesmtTrainingDate || '');
    setSesmtDate(profile.sesmtDate || '');
    setIsBanned(profile.isBanned || false);
    setBanReason(profile.banReason || '');
    setIsAdminService(profile.isAdminService || (profile as any).is_admin_service || false);
    setEnableControlId(profile.enableControlId || (profile as any).enable_control_id || false);

    const initialSelecteds: Record<string, boolean> = {};
    const initialDates: Record<string, string> = {};

    if (profile.customReqs) {
      Object.keys(profile.customReqs).forEach(code => {
        initialSelecteds[code] = true;
        initialDates[code] = profile.customReqs![code];
      });
    }

    setSelectedReqs(initialSelecteds);
    setReqDates(initialDates);
    
    setPhotoDataUrl(profile.photoUrl || profile.photoBase64 || '');
    setPhotoDateStr(profile.photoDate || '');
    
    let expired = false;
    if (profile.photoDate) {
      const pDate = new Date(profile.photoDate);
      const expDate = new Date(pDate.getTime() + photoValidityDays * 24 * 60 * 60 * 1000);
      expDate.setHours(23, 59, 59, 999);
      const today = new Date();
      today.setHours(0,0,0,0);
      if (expDate.getTime() < today.getTime()) {
        expired = true;
      }
    } else {
      expired = true;
    }

    if (expired) {
      setPhotoDataUrl('');
      setPhotoDateStr('');
      openCamera();
    } else {
      closeCamera();
    }

    setValidationError(null);
    setShowProfileModal(true);
  };

  const openCamera = async () => {
    try {
      setPhotoDataUrl('');
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      showToast('Erro de Câmera', 'Não foi possível acessar a webcam.', 'error');
      setIsCameraOpen(false);
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const width = videoRef.current.videoWidth;
      const height = videoRef.current.videoHeight;
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.7);
        setPhotoDataUrl(dataUrl);
        setPhotoDateStr(new Date().toISOString());
        closeCamera();
      }
    }
  };

  const handleSubmitProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetCompany = selectedCompanyId;

    if (!name || !targetCompany || !document) {
      setAlertModal({ title: 'Atenção', message: 'Por favor, preencha todos os campos obrigatórios.', type: 'warning' });
      return;
    }

    if (editingProfile?.isBanned && !isBanned && !unbanReason) {
      setShowUnbanModal(true);
      return;
    }

    // Dates are optional for saving - empty dates = blocked for entry

    const finalCustomReqs: Record<string, string> = {};
    Object.keys(selectedReqs).forEach(code => {
      if (selectedReqs[code] && reqDates[code]) {
        finalCustomReqs[code] = reqDates[code];
      }
    });

    const documentHistory: DocumentHistoryEntry[] = editingProfile ? (editingProfile.documentHistory || []) : [];
    const nowStr = new Date().toLocaleString('pt-BR');

    if (editingProfile) {
      const currentUser = useAuthStore.getState().user;
      if (editingProfile.asoDate !== asoDate) {
        documentHistory.push({ type: 'ASO', previousDate: editingProfile.asoDate || 'Não definido', newDate: asoDate, updatedAt: nowStr, updatedBy: currentUser?.name || currentUser?.email || 'Sistema' });
      }
      if (sesmtDate !== (editingProfile.sesmtDate || '')) {
        documentHistory.push({ type: 'Treinamento SESMT', previousDate: editingProfile.sesmtDate || 'Não definido', newDate: sesmtDate, updatedAt: nowStr, updatedBy: currentUser?.name || currentUser?.email || 'Sistema' });
      }
      customRequirements.forEach(req => {
        const oldVal = editingProfile.customReqs?.[req.code];
        const newVal = finalCustomReqs[req.code];
        if (oldVal !== newVal) {
          documentHistory.push({ type: req.name, previousDate: oldVal || 'Não definido', newDate: newVal || 'Desmarcado', updatedAt: nowStr, updatedBy: currentUser?.name || currentUser?.email || 'Sistema' });
        }
      });

      if (editingProfile.isBanned && !isBanned && unbanReason && unbanAuthorizer) {
        documentHistory.push({ type: 'Desbanimento', previousDate: 'Banido', newDate: 'Liberado', updatedAt: `${nowStr} - Autorizado por: ${unbanAuthorizer}. Motivo: ${unbanReason}`, updatedBy: currentUser?.name || currentUser?.email || 'Sistema' });
      }

      const updated = profiles.map(p => {
        if (p.id === editingProfile.id) {
          return { ...p, name, internalContact, company: targetCompany, document, vehiclePlate: vehiclePlate || undefined, asoDate, sesmtTrainingDate, sesmtDate, customReqs: finalCustomReqs, photoBase64: photoDataUrl || undefined, photoDate: photoDataUrl ? photoDateStr : undefined, documentHistory, isBanned, banReason, isAdminService, enableControlId };
        }
        return p;
      });
      // Save optimistically, then update with real data from backend
      saveProfiles(updated);
      
      let savedProfile;
      try {
        savedProfile = await thirdPartyApi.saveProfile(updated.find(p => p.id === editingProfile.id));
        saveProfiles(updated.map(p => p.id === savedProfile.id ? savedProfile : p));
      } catch (error: any) {
        console.error("Save profile error", error);
        showToast('Erro', error.response?.data?.detail || 'Erro ao salvar perfil.', 'error');
        saveProfiles(profiles); // Revert optimistic update
        return;
      }

      // Propagate changes to the active/blocked entry on the dashboard
      // We must search by the OLD document because the entry in state still has it
      const activeEntry = entries.find(e => e.document === editingProfile.document && (e.status === 'Ativo' || e.status === 'Bloqueado'));
      if (activeEntry) {
        const updatedEntry = {
          ...activeEntry,
          document: savedProfile.document, // IMPORTANT: update the document on the entry!
          name: savedProfile.name,
          company: savedProfile.company,
          asoDate: savedProfile.asoDate,
          sesmtTrainingDate: savedProfile.sesmtTrainingDate,
          sesmtDate: savedProfile.sesmtDate,
          customReqs: savedProfile.customReqs,
          photoBase64: savedProfile.photoBase64,
          photoDate: savedProfile.photoDate,
          isAdminService: savedProfile.isAdminService,
          enableControlId: savedProfile.enableControlId,
          isBanned: savedProfile.isBanned
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let hasExpired = false;

        if (updatedEntry.isBanned) {
          hasExpired = true;
        } else if (!updatedEntry.isAdminService && !(updatedEntry as any).is_admin_service) {
          if (!updatedEntry.asoDate || new Date(updatedEntry.asoDate) < today) hasExpired = true;
          if (!updatedEntry.sesmtDate || new Date(updatedEntry.sesmtDate) < today) hasExpired = true;
          customRequirements.forEach(req => {
            const isReqActive = updatedEntry.customReqs && updatedEntry.customReqs[req.code] !== undefined;
            if (isReqActive) {
              const valDate = updatedEntry.customReqs?.[req.code];
              if (!valDate || new Date(valDate) < today) hasExpired = true;
            }
          });
        }

        if (!updatedEntry.photoDate) {
          hasExpired = true;
        } else {
          const pDate = new Date(updatedEntry.photoDate);
          const expDate = new Date(pDate.getTime() + photoValidityDays * 24 * 60 * 60 * 1000);
          expDate.setHours(23, 59, 59, 999);
          if (expDate < today) hasExpired = true;
        }

        // Only downgrade to Bloqueado if they are inside (Ativo) and a document expires.
        // Never automatically upgrade Bloqueado to Ativo (which means checking them into the building).
        if (hasExpired && updatedEntry.status === 'Ativo') {
          updatedEntry.status = 'Bloqueado';
        }
        const savedEntry = await thirdPartyApi.saveEntry(updatedEntry);
        saveEntries(entries.map(e => e.id === savedEntry.id ? savedEntry : e));
      }
      
      showToast('Sucesso!', 'Cadastro SESMT atualizado com sucesso.', 'success');
      setShowProfileModal(false);
      setShowUnbanModal(false);
      setUnbanReason('');
      setUnbanAuthorizer('');
    } else {
      const existingProfile = profiles.find(p => p.document === document);
      const tempId = existingProfile ? existingProfile.id : Date.now().toString();
      
      const newProfile: ThirdPartyProfile = {
        id: tempId,
        name,
        internalContact,
        company: targetCompany,
        document,
        vehiclePlate: vehiclePlate || undefined,
        asoDate,
        sesmtTrainingDate,
        sesmtDate,
        customReqs: finalCustomReqs,
        photoBase64: photoDataUrl || undefined,
        photoDate: photoDataUrl ? photoDateStr : undefined,
        documentHistory: existingProfile ? (existingProfile.documentHistory || []) : [],
        isBanned,
        banReason,
        isAdminService,
        enableControlId
      };
      
      // Optimistic update - filter out the old one if it existed so we don't duplicate
      const otherProfiles = profiles.filter(p => p.id !== tempId && p.document !== document);
      saveProfiles([newProfile, ...otherProfiles]);
      
      const savedProfile = await thirdPartyApi.saveProfile(newProfile);
      
      // Real update from backend to get photoUrl
      // Ensure we remove both the temporary optimistic one AND any old profile with the same document
      const cleanedProfiles = profiles.filter(p => p.id !== savedProfile.id && p.id !== tempId && p.document !== savedProfile.document);
      saveProfiles([savedProfile, ...cleanedProfiles]);
      setShowProfileModal(false);

      if (enableControlId && (photoDataUrl || savedProfile.photoUrl)) {
        syncWithControlId(name, photoDataUrl, savedProfile.photoUrl);
      }

      // Only proceed to check-in if documents are valid
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const expiredItems: string[] = [];
      if (!isAdminService) {
        if (!asoDate || parseLocalDate(asoDate) < today) expiredItems.push('ASO');
        if (!sesmtDate || parseLocalDate(sesmtDate) < today) expiredItems.push('SESMT');
      }
      
      if (!photoDateStr) expiredItems.push('Foto Pendente');
      else {
        const pDate = new Date(photoDateStr);
        const expDate = new Date(pDate.getTime() + photoValidityDays * 24 * 60 * 60 * 1000);
        expDate.setHours(23, 59, 59, 999);
        if (expDate < today) expiredItems.push('Foto Vencida');
      }

      if (!isAdminService) {
        Object.entries(finalCustomReqs).forEach(([code, val]) => {
          if (!val || parseLocalDate(val as string) < today) {
            const reqName = customRequirements.find(r => r.code === code)?.name || code;
            expiredItems.push(reqName);
          }
        });
      }

      if (expiredItems.length > 0) {
        showToast('Atenção', 'Cadastro salvo na base, mas entrada bloqueada.', 'warning');
        
        const newBlockedEntry: ThirdPartyEntry = {
          id: Date.now().toString(),
          name: savedProfile.name,
          document: savedProfile.document,
          company: savedProfile.company,
          vehiclePlate: savedProfile.vehiclePlate,
          reason: `Bloqueado: ${expiredItems.join(', ')}`,
          destination: 'Portaria (Bloqueado)',
          authorizedBy: 'Sistema',
          checkInTime: new Date().toISOString(),
          checkOutTime: new Date().toISOString(),
          status: 'Bloqueado',
          asoDate: savedProfile.asoDate,
          sesmtTrainingDate: savedProfile.sesmtTrainingDate,
          sesmtDate: savedProfile.sesmtDate,
          photoUrl: savedProfile.photoUrl,
          photoDate: savedProfile.photoDate,
          photoBase64: savedProfile.photoBase64,
          customReqs: savedProfile.customReqs
        };
        
        thirdPartyApi.saveEntry(newBlockedEntry).then(savedEntry => {
          setEntries(prev => [savedEntry, ...prev]);
        });

        setTimeout(() => {
          setAlertModal({ title: 'Cadastro Salvo com Bloqueio', message: `O terceiro foi salvo na Base de Dados, porém a Entrada foi BLOQUEADA pois os seguintes itens estão ausentes ou vencidos:\n\n${expiredItems.join(', ')}\n\nO registro aparecerá na tela com o status 'Bloqueado'. Você poderá editá-lo posteriormente buscando o CPF ou clicando em Editar.`, type: 'warning' });
        }, 100);
      } else {
        showToast('Sucesso!', 'Cadastro salvo com sucesso e documentos em dia.', 'success');
        handleProfileCheckIn(savedProfile);
      }
    }
  };

  const handleProfileCheckIn = (profile: ThirdPartyProfile) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredItems: string[] = [];

    if (!profile.isAdminService && !(profile as any).is_admin_service) {
      if (!profile.asoDate) expiredItems.push('ASO Pendente');
      else if (new Date(profile.asoDate) < today) expiredItems.push('ASO Vencido');

      if (!profile.sesmtDate) expiredItems.push('SESMT Pendente');
      else if (new Date(profile.sesmtDate) < today) expiredItems.push('SESMT Vencido');
    }

    if (!profile.photoDate) expiredItems.push('Foto Pendente');
    else {
      const pDate = new Date(profile.photoDate);
      const expDate = new Date(pDate.getTime() + photoValidityDays * 24 * 60 * 60 * 1000);
      expDate.setHours(23, 59, 59, 999);
      if (expDate < today) expiredItems.push('Foto Vencida');
    }

    if (!profile.isAdminService && !(profile as any).is_admin_service) {
      customRequirements.forEach(req => {
        const isReqActive = profile.customReqs && profile.customReqs[req.code] !== undefined;
        if (isReqActive) {
          const valDate = profile.customReqs?.[req.code];
          if (!valDate) expiredItems.push(`${req.code.toUpperCase()} Pendente`);
          else if (new Date(valDate) < today) expiredItems.push(`${req.code.toUpperCase()} Vencido`);
        }
      });
    }

    if (expiredItems.length > 0) {
      setSelectedProfileForRenewal(profile);
      setRenewAsoDate(profile.asoDate || '');
      setRenewSesmtDate(profile.sesmtDate || '');
      const customDatesObj: Record<string, string> = {};
      customRequirements.forEach(req => { customDatesObj[req.code] = profile.customReqs?.[req.code] || ''; });
      setRenewCustomDates(customDatesObj);
      setValidationError(`Requisitos vencidos: ${expiredItems.join(', ')}.`);
      setShowRenewModal(true);
      return;
    }

    setSelectedProfileForCheckIn(profile);
    setReason('');
    setDestination('');
    setVehiclePlate(profile.vehiclePlate || '');
    setAuthorizedBy('');
    setAuthPassword('');
    setShowQuickCheckInModal(true);
  };

  const handleSaveQuickCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authPassword && !authorizedBy) {
      setAlertModal({ title: 'Senha Inválida', message: 'A senha do vigia/autorizador está incorreta.', type: 'error' });
      return;
    }
    if (!selectedProfileForCheckIn || !reason || !destination || !authorizedBy) {
      setAlertModal({ title: 'Campos Obrigatórios', message: 'Preencha os campos obrigatórios.', type: 'warning' });
      return;
    }

    const existingEntryIndex = entries.findIndex(entry => entry.document === selectedProfileForCheckIn.document && entry.status === 'Ativo');
    let entryId = '';
    
    if (existingEntryIndex !== -1) {
      const updatedEntries = [...entries];
      const existingEntry = updatedEntries[existingEntryIndex];
      entryId = existingEntry.id;
      
      updatedEntries[existingEntryIndex] = {
        ...existingEntry,
        vehiclePlate: vehiclePlate || undefined,
        reason,
        destination,
        authorizedBy,
        checkInTime: new Date().toISOString(),
        checkOutTime: undefined,
        status: 'Ativo',
        isAdminService: selectedProfileForCheckIn.isAdminService || (selectedProfileForCheckIn as any).is_admin_service || false,
        enableControlId,
        asoDate: selectedProfileForCheckIn.asoDate,
        sesmtTrainingDate: selectedProfileForCheckIn.sesmtTrainingDate,
        sesmtDate: selectedProfileForCheckIn.sesmtDate,
        customReqs: selectedProfileForCheckIn.customReqs
      };

      const [movedEntry] = updatedEntries.splice(existingEntryIndex, 1);
      saveEntries([movedEntry, ...updatedEntries]);
      await thirdPartyApi.saveEntry(movedEntry);
    } else {
      const newEntry: ThirdPartyEntry = {
        id: Date.now().toString(),
        name: selectedProfileForCheckIn.name,
        company: selectedProfileForCheckIn.company,
        document: selectedProfileForCheckIn.document,
        vehiclePlate: vehiclePlate || undefined,
        reason,
        destination,
        authorizedBy,
        checkInTime: new Date().toISOString(),
        status: 'Ativo',
        isAdminService: selectedProfileForCheckIn.isAdminService || (selectedProfileForCheckIn as any).is_admin_service || false,
        enableControlId,
        asoDate: selectedProfileForCheckIn.asoDate,
        sesmtTrainingDate: selectedProfileForCheckIn.sesmtTrainingDate,
        sesmtDate: selectedProfileForCheckIn.sesmtDate,
        customReqs: selectedProfileForCheckIn.customReqs
      };
      entryId = newEntry.id;
      saveEntries([newEntry, ...entries]);
      await thirdPartyApi.saveEntry(newEntry);
    }

    updateProfileHistory(selectedProfileForCheckIn.document, {
      checkInTime: new Date().toISOString(),
      reason,
      destination,
      authorizedBy
    });

    if (enableControlId && (selectedProfileForCheckIn.photoBase64 || selectedProfileForCheckIn.photoUrl)) {
      syncWithControlId(selectedProfileForCheckIn.name, selectedProfileForCheckIn.photoBase64, selectedProfileForCheckIn.photoUrl, entryId);
    }

    showToast('Sucesso!', 'Entrada rápida autorizada com sucesso.', 'success');
    setShowQuickCheckInModal(false);
  };

  const handleSaveRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileForRenewal) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const errors: string[] = [];
    if (!renewAsoDate) errors.push('ASO obrigatório');
    else if (new Date(renewAsoDate) < today) errors.push('ASO vencido');
    if (!renewSesmtDate) errors.push('SESMT obrigatório');
    else if (new Date(renewSesmtDate) < today) errors.push('SESMT vencido');

    if (errors.length > 0) {
      setValidationError(errors.join('. '));
      return;
    }

    const documentHistory: DocumentHistoryEntry[] = selectedProfileForRenewal.documentHistory || [];
    const nowStr = new Date().toLocaleString('pt-BR');
    
    const currentUser = useAuthStore.getState().user;
    if (selectedProfileForRenewal.asoDate !== renewAsoDate) {
      documentHistory.push({ type: 'ASO', previousDate: selectedProfileForRenewal.asoDate || '', newDate: renewAsoDate, updatedAt: nowStr, updatedBy: currentUser?.name || currentUser?.email || 'Sistema' });
    }
    if (renewSesmtDate !== (selectedProfileForRenewal.sesmtDate || '')) {
      documentHistory.push({ type: 'SESMT', previousDate: selectedProfileForRenewal.sesmtDate || '', newDate: renewSesmtDate, updatedAt: nowStr, updatedBy: currentUser?.name || currentUser?.email || 'Sistema' });
    }

    const updatedProfiles = profiles.map(p => {
      if (p.id === selectedProfileForRenewal.id) {
        return { ...p, asoDate: renewAsoDate, sesmtDate: renewSesmtDate, customReqs: { ...p.customReqs, ...renewCustomDates }, documentHistory };
      }
      return p;
    });

    saveProfiles(updatedProfiles);
    const updatedProfile = updatedProfiles.find(p => p.id === selectedProfileForRenewal.id);
    if (updatedProfile) {
      await thirdPartyApi.saveProfile(updatedProfile);
      
      if (enableControlId && (updatedProfile.photoBase64 || updatedProfile.photoUrl)) {
        syncWithControlId(updatedProfile.name, updatedProfile.photoBase64, updatedProfile.photoUrl);
      }
    }
    setShowRenewModal(false);
    setValidationError(null);
  };

  const handleOpenRegister = () => {
    setEditingEntry(null);
    setName('');
    setCompany('');
    setSelectedCompanyId('');
    setCustomCompanyName('');
    setIsCustom(false);
    setDocument('');
    setVehiclePlate('');
    setReason('');
    setDestination('');
    setAuthorizedBy('');
    setAuthPassword('');
    setAsoDate('');
    setSesmtDate('');
    setRequiresNr35(false);
    setNr35Date('');
    setRequiresNr10(false);
    setNr10Date('');
    setSelectedReqs({});
    setReqDates({});
    setValidationError(null);
    setPhotoDataUrl('');
    setPhotoDateStr('');
    setIsAdminService(false);
    setEnableControlId(false);
    closeCamera();
    setShowModal(true);
  };

  const handleOpenEdit = (entry: ThirdPartyEntry) => {
    setEditingEntry(entry);
    setName(entry.name);
    const cosList = companiesList;
    const found = cosList.find((c: any) => c.name.toLowerCase() === entry.company.toLowerCase());
    
    if (found) {
      setSelectedCompanyId(found.name);
      setIsCustom(false);
      setCustomCompanyName('');
    } else {
      setSelectedCompanyId('__custom__');
      setIsCustom(true);
      setCustomCompanyName(entry.company);
    }
    
    setCompany(entry.company);
    setDocument(entry.document);
    setVehiclePlate(entry.vehiclePlate || '');
    setReason(entry.reason);
    setDestination(entry.destination);
    setAuthorizedBy(entry.authorizedBy);
    setAuthPassword('');
    setAsoDate(entry.asoDate || '');
    setSesmtTrainingDate(entry.sesmtTrainingDate || '');
    setSesmtDate(entry.sesmtDate || '');
    setRequiresNr35(entry.requiresNr35 || false);
    setNr35Date(entry.nr35Date || '');
    setRequiresNr10(entry.requiresNr10 || false);
    setNr10Date(entry.nr10Date || '');
    setIsAdminService(entry.isAdminService || (entry as any).is_admin_service || false);
    setEnableControlId(entry.enableControlId || (entry as any).enable_control_id || false);

    const initialSelecteds: Record<string, boolean> = {};
    const initialDates: Record<string, string> = {};

    if (entry.customReqs) {
      Object.keys(entry.customReqs).forEach(code => {
        initialSelecteds[code] = true;
        initialDates[code] = entry.customReqs![code];
      });
    }

    setSelectedReqs(initialSelecteds);
    setReqDates(initialDates);
    setPhotoDataUrl(entry.photoUrl || entry.photoBase64 || '');
    setPhotoDateStr(entry.photoDate || '');
    
    // Check if photo is expired
    let expired = false;
    if (entry.photoDate) {
      const pDate = new Date(entry.photoDate);
      const expDate = new Date(pDate.getTime() + photoValidityDays * 24 * 60 * 60 * 1000);
      expDate.setHours(23, 59, 59, 999);
      const today = new Date();
      today.setHours(0,0,0,0);
      if (expDate.getTime() < today.getTime()) {
        expired = true;
      }
    } else {
      expired = true; // No photo date means no valid photo
    }

    if (expired) {
      setPhotoDataUrl('');
      setPhotoDateStr('');
      openCamera();
    } else {
      closeCamera();
    }

    setValidationError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCompany = selectedCompanyId;
    if (authPassword && !authorizedBy) {
      setAlertModal({ title: 'Senha Inválida', message: 'A senha do vigia/autorizador está incorreta.', type: 'error' });
      return;
    }
    if (!name || !targetCompany || !document || !reason || !destination || !authorizedBy) {
      setAlertModal({ title: 'Campos Obrigatórios', message: 'Preencha os campos obrigatórios.', type: 'warning' });
      return;
    }
    // Dates are optional for saving - blocking only happens at entry authorization

    const finalCustomReqs: Record<string, string> = {};
    Object.keys(selectedReqs).forEach(code => {
      if (selectedReqs[code] && reqDates[code]) {
        finalCustomReqs[code] = reqDates[code];
      }
    });

    if (editingEntry) {
      const updated = entries.map(item => {
        if (item.id === editingEntry.id) {
          return { ...item, name, company: targetCompany, document, vehiclePlate: vehiclePlate || undefined, reason, destination, authorizedBy, asoDate, sesmtTrainingDate, sesmtDate, customReqs: finalCustomReqs, photoBase64: photoDataUrl || undefined, photoDate: photoDataUrl ? photoDateStr : undefined, isAdminService, enableControlId };
        }
        return item;
      });
      saveEntries(updated);
      await thirdPartyApi.saveEntry(updated.find(item => item.id === editingEntry.id));
    } else {
      const existingEntryIndex = entries.findIndex(item => item.document === document && item.status === 'Ativo');
      
      if (existingEntryIndex !== -1) {
        const updatedEntries = [...entries];
        const existingEntry = updatedEntries[existingEntryIndex];
        
        updatedEntries[existingEntryIndex] = {
          ...existingEntry,
          name,
          company: targetCompany,
          vehiclePlate: vehiclePlate || undefined,
          reason,
          destination,
          authorizedBy,
          checkInTime: new Date().toISOString(),
          checkOutTime: undefined,
          status: 'Ativo',
          asoDate,
          sesmtTrainingDate,
          sesmtDate,
          customReqs: finalCustomReqs,
          photoBase64: photoDataUrl || undefined,
          photoDate: photoDataUrl ? photoDateStr : undefined,
          isAdminService,
          enableControlId
        };
        
        const [movedEntry] = updatedEntries.splice(existingEntryIndex, 1);
        saveEntries([movedEntry, ...updatedEntries]);
        await thirdPartyApi.saveEntry(movedEntry);
      } else {
        const newEntry: ThirdPartyEntry = {
          id: Date.now().toString(),
          name,
          company: targetCompany,
          document,
          vehiclePlate: vehiclePlate || undefined,
          reason,
          destination,
          authorizedBy,
          checkInTime: new Date().toISOString(),
          status: 'Ativo',
          asoDate,
          sesmtTrainingDate,
          sesmtDate,
          customReqs: finalCustomReqs,
          photoBase64: photoDataUrl || undefined,
          photoDate: photoDataUrl ? photoDateStr : undefined,
          isAdminService,
          enableControlId
        };
        saveEntries([newEntry, ...entries]);
        await thirdPartyApi.saveEntry(newEntry);
      }
      
      if (enableControlId && (photoDataUrl || entryToEdit?.photoUrl)) {
        syncWithControlId(name, photoDataUrl, entryToEdit?.photoUrl, newEntry.id);
      }
    }
    
    if (!editingEntry) {
      updateProfileHistory(document, {
        checkInTime: new Date().toISOString(),
        reason,
        destination,
        authorizedBy
      });
    }

    // Sync compliance dates back to the profile to keep it as the single source of truth
    const nowStr = new Date().toLocaleString('pt-BR');
    let existingProfile = profiles.find(p => p.document === document);
    if (existingProfile) {
      const documentHistory = [...(existingProfile.documentHistory || [])];
      const currentUser = useAuthStore.getState().user;
      if (existingProfile.asoDate !== asoDate) {
        documentHistory.push({ type: 'ASO', previousDate: existingProfile.asoDate || 'Não definido', newDate: asoDate, updatedAt: nowStr, updatedBy: currentUser?.name || currentUser?.email || 'Sistema' });
      }
      if (sesmtDate !== (existingProfile.sesmtDate || '')) {
        documentHistory.push({ type: 'Treinamento SESMT', previousDate: existingProfile.sesmtDate || 'Não definido', newDate: sesmtDate, updatedAt: nowStr, updatedBy: currentUser?.name || currentUser?.email || 'Sistema' });
      }
      
      const updatedProfiles = profiles.map(p => {
        if (p.document === document) {
          return {
            ...p,
            asoDate: asoDate || p.asoDate,
            sesmtTrainingDate: sesmtTrainingDate || p.sesmtTrainingDate,
            sesmtDate: sesmtDate || p.sesmtDate,
            photoBase64: photoDataUrl || p.photoBase64,
            photoDate: photoDataUrl ? photoDateStr : p.photoDate,
            customReqs: Object.keys(finalCustomReqs).length > 0 ? { ...p.customReqs, ...finalCustomReqs } : p.customReqs,
            documentHistory
          };
        }
        return p;
      });
      saveProfiles(updatedProfiles);
      await thirdPartyApi.saveProfile(updatedProfiles.find(p => p.document === document));
    } else {
      const newProfile: ThirdPartyProfile = {
        id: Date.now().toString() + '_prof',
        name,
        company: targetCompany,
        document,
        vehiclePlate: vehiclePlate || undefined,
        asoDate,
        sesmtTrainingDate,
        sesmtDate,
        customReqs: finalCustomReqs,
        photoBase64: photoDataUrl || undefined,
        photoDate: photoDataUrl ? photoDateStr : undefined,
        documentHistory: []
      };
      saveProfiles([newProfile, ...profiles]);
      await thirdPartyApi.saveProfile(newProfile);
    }
    showToast('Sucesso!', editingProfile ? 'Perfil atualizado com sucesso.' : 'Perfil cadastrado com sucesso.', 'success');
    setShowProfileModal(false);
  };

  const handleCheckOut = async (id: string) => {
    const checkOutStr = new Date().toISOString();
    let targetEntry = null;
    const updated = entries.map(item => {
      if (item.id === id) {
        targetEntry = { 
          ...item, 
          checkOutTime: checkOutStr, 
          checkOutAuthorizedBy: checkOutAuthorizedBy || undefined,
          status: 'Concluído' as const 
        };
        return targetEntry;
      }
      return item;
    });
    
    if (targetEntry) {
      await updateProfileCheckOut(targetEntry.document, checkOutStr, targetEntry);
      saveEntries(updated);
      await thirdPartyApi.saveEntry(targetEntry);
      
      if (targetEntry.enableControlId) {
        revokeControlIdAccess(targetEntry.name, targetEntry.id);
      }
    }
    showToast('Sucesso!', 'Saída registrada com sucesso.', 'success');
    setConfirmCheckOutId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este registro?')) {
      saveEntries(entries.filter(item => item.id !== id));
      await thirdPartyApi.deleteEntry(id);
    }
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '-';
    // Ignorar datas falsas geradas pela importação inicial (formato DD/MM/YYYY)
    if (isoString.match(/^\d{2}\/\d{2}\/\d{4}/)) {
      return '-';
    }
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const getComplianceStatus = (entry: ThirdPartyEntry) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiredItems: string[] = [];

    if (!entry.isAdminService) {
      if (!entry.asoDate || parseLocalDate(entry.asoDate) < today) expiredItems.push('ASO');
      if (!entry.sesmtDate || parseLocalDate(entry.sesmtDate) < today) expiredItems.push('SESMT');
    }

    return { isValid: expiredItems.length === 0, errors: expiredItems };
  };

  const getProfileComplianceForEntry = (entry: ThirdPartyEntry) => {
    const profile = profiles.find(p => p.document === entry.document);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiredItems: string[] = [];

    // If profile exists, use PROFILE dates exclusively (empty = blocked)
    // Only fall back to entry dates if NO profile exists
    const asoDate = profile ? profile.asoDate : entry.asoDate;
    const sesmtDate = profile ? profile.sesmtDate : entry.sesmtDate;
    const photoDate = profile ? profile.photoDate : entry.photoDate;
    const isAdmin = profile ? (profile.isAdminService || (profile as any).is_admin_service) : (entry.isAdminService || (entry as any).is_admin_service);

    if (profile && profile.isBanned) {
      return { isValid: false, errors: [`Proibido: ${profile.banReason || 'Motivo não informado'}`], isBanned: true };
    }

    if (!isAdmin) {
      if (!asoDate || asoDate.trim() === '' || parseLocalDate(asoDate) < today) expiredItems.push('ASO');
      if (!sesmtDate || sesmtDate.trim() === '' || parseLocalDate(sesmtDate) < today) expiredItems.push('SESMT');
    }

    if (!photoDate || photoDate.trim() === '') {
      expiredItems.push('Foto Pendente');
    } else {
      const pDate = new Date(photoDate);
      const expDate = new Date(pDate.getTime() + photoValidityDays * 24 * 60 * 60 * 1000);
      expDate.setHours(23, 59, 59, 999);
      if (expDate < today) expiredItems.push('Foto Vencida');
    }

    if (profile && !isAdmin) {
      customRequirements.forEach(req => {
        const isReqActive = profile.customReqs && profile.customReqs[req.code] !== undefined;
        if (isReqActive) {
          const valDate = profile.customReqs?.[req.code];
          if (!valDate || valDate.trim() === '') expiredItems.push(`${req.code.toUpperCase()}`);
          else if (parseLocalDate(valDate) < today) expiredItems.push(`${req.code.toUpperCase()}`);
        }
      });
    }

    return { isValid: expiredItems.length === 0, errors: expiredItems };
  };

  const getProfileDynamicStatus = (profile: ThirdPartyProfile) => {
    if (profile.isBanned) return 'Banido';
    const activeEntry = entries.find(e => e.document === profile.document && e.status === 'Ativo');
    if (activeEntry) return 'No Local';
    const mockEntry: ThirdPartyEntry = {
      id: '',
      name: profile.name,
      company: profile.company,
      document: profile.document,
      reason: '',
      destination: '',
      authorizedBy: '',
      checkInTime: '',
      status: 'Ativo',
      asoDate: profile.asoDate,
      sesmtDate: profile.sesmtDate,
      photoDate: profile.photoDate,
      isAdminService: profile.isAdminService || (profile as any).is_admin_service
    };
    const compliance = getProfileComplianceForEntry(mockEntry);
    return compliance.isValid ? 'Ativo' : 'Bloqueado';
  };

  const handleNewEntryFromHistory = (entry: ThirdPartyEntry) => {
    let profile = profiles.find(p => p.document === entry.document);
    if (!profile) {
      profile = {
        id: Date.now().toString(),
        name: entry.name,
        document: entry.document,
        company: entry.company,
        createdAt: new Date().toISOString(),
        status: 'Ativo'
      };
      saveProfiles([profile, ...profiles]);
    }

    // Block entry if documents are not valid
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiredItems: string[] = [];
    
    if (profile.isBanned) {
      expiredItems.push(`Proibido: ${profile.banReason || 'Motivo não informado'}`);
    } else if (!profile.isAdminService && !(profile as any).is_admin_service) {
      if (!profile.asoDate || parseLocalDate(profile.asoDate) < today) expiredItems.push('ASO');
      if (!profile.sesmtDate || parseLocalDate(profile.sesmtDate) < today) expiredItems.push('SESMT');
    }
    
    if (!profile.photoDate) expiredItems.push('Foto Pendente');
    else {
      const pDate = new Date(profile.photoDate);
      const expDate = new Date(pDate.getTime() + photoValidityDays * 24 * 60 * 60 * 1000);
      expDate.setHours(23, 59, 59, 999);
      if (expDate < today) expiredItems.push('Foto Vencida');
    }

    if (!profile.isAdminService && !(profile as any).is_admin_service) {
      customRequirements.forEach(req => {
        const isReqActive = profile.customReqs && profile.customReqs[req.code] !== undefined;
        if (isReqActive) {
          const valDate = profile.customReqs?.[req.code];
          if (!valDate) expiredItems.push(`${req.code.toUpperCase()}`);
          else if (parseLocalDate(valDate) < today) expiredItems.push(`${req.code.toUpperCase()}`);
        }
      });
    }

    if (expiredItems.length > 0) {
      setAlertModal({ title: 'Entrada Bloqueada', message: `Entrada BLOQUEADA — Documentos vencidos: ${expiredItems.join(', ')}.\nAtualize os documentos no cadastro SESMT antes de autorizar a entrada.`, type: 'error' });
      return;
    }

    handleProfileCheckIn(profile);
  };

  const handleViewHistoryFromEntry = (entry: ThirdPartyEntry) => {
    const profile = profiles.find(p => p.document === entry.document);
    if (profile) {
      setHistoryTab('visits');
      handleOpenProfileEdit(profile, 'historico');
    } else {
      setAlertModal({ title: 'Perfil Não Encontrado', message: 'Perfil completo não encontrado para este registro histórico.', type: 'warning' });
    }
  };

  const handleEditProfileFromHistory = (entry: ThirdPartyEntry) => {
    const profile = profiles.find(p => p.document === entry.document);
    if (profile) {
      setEditingProfile(profile);
      setName(profile.name);
      setInternalContact(profile.internalContact || '');
      setDocument(profile.document);
      setSelectedCompanyId(profile.company);
      setVehiclePlate(profile.vehiclePlate || '');
      setAsoDate(profile.asoDate || '');
      setSesmtTrainingDate(profile.sesmtTrainingDate || '');
      setSesmtDate(profile.sesmtDate || '');
      setIsBanned(profile.isBanned || false);
      setBanReason(profile.banReason || '');
      setIsAdminService(profile.isAdminService || (profile as any).is_admin_service || false);
      setEnableControlId(profile.enableControlId || (profile as any).enable_control_id || false);
      
      const initialSelecteds: Record<string, boolean> = {};
      const initialDates: Record<string, string> = {};
      if (profile.customReqs) {
        Object.keys(profile.customReqs).forEach(code => {
          initialSelecteds[code] = true;
          initialDates[code] = profile.customReqs![code];
        });
      }
      setSelectedReqs(initialSelecteds);
      setReqDates(initialDates);
      
      setPhotoDataUrl(profile.photoUrl || profile.photoBase64 || '');
      setPhotoDateStr(profile.photoDate || '');
      
      let expired = false;
      if (profile.photoDate) {
        const pDate = new Date(profile.photoDate);
        const expDate = new Date(pDate.getTime() + photoValidityDays * 24 * 60 * 60 * 1000);
        expDate.setHours(23, 59, 59, 999);
        const today = new Date();
        today.setHours(0,0,0,0);
        if (expDate.getTime() < today.getTime()) {
          expired = true;
        }
      } else {
        expired = true;
      }

      if (expired) {
        setPhotoDataUrl('');
        setPhotoDateStr('');
        openCamera();
      } else {
        closeCamera();
      }

      setShowProfileModal(true);
    } else {
      setAlertModal({ title: 'Perfil Não Encontrado', message: 'Perfil completo não encontrado para este registro histórico.', type: 'warning' });
    }
  };

  const getPhotoDaysLeftText = () => {
    if (!photoDataUrl || !photoDateStr) return null;
    const pDate = new Date(photoDateStr);
    const expDate = new Date(pDate.getTime() + photoValidityDays * 24 * 60 * 60 * 1000);
    expDate.setHours(23, 59, 59, 999);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return `Vence em ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    if (diffDays === 0) return `Vence hoje`;
    return `Vencida há ${Math.abs(diffDays)} dia${Math.abs(diffDays) > 1 ? 's' : ''}`;
  };

  const tabCounts = useMemo(() => {
    const counts = { 'Todos': 0, 'No Local': 0, 'Ativos': 0, 'Bloqueado': 0 };
    profiles.forEach(p => {
      counts['Todos']++;
      const dynStatus = getProfileDynamicStatus(p);
      if (dynStatus === 'No Local') counts['No Local']++;
      else if (dynStatus === 'Ativo') counts['Ativos']++;
      else if (dynStatus === 'Bloqueado' || dynStatus === 'Banido') counts['Bloqueado']++;
    });
    return counts;
  }, [profiles, entries]);

  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = 
      (p?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
      (p?.document || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
      (p?.company || '').toLowerCase().includes((searchQuery || '').toLowerCase());

    const dynStatus = getProfileDynamicStatus(p);
    const matchesStatus = (statusFilter === 'Todos') || 
      (statusFilter === 'No Local' ? dynStatus === 'No Local' : 
       statusFilter === 'Ativos' ? dynStatus === 'Ativo' :
       statusFilter === 'Bloqueado' ? (dynStatus === 'Bloqueado' || dynStatus === 'Banido') :
       dynStatus === statusFilter);

    return matchesSearch && matchesStatus;
  });
  const totalProfilesPages = Math.ceil(filteredProfiles.length / profilesPerPage);
  const currentProfiles = filteredProfiles.slice((profilesCurrentPage - 1) * profilesPerPage, profilesCurrentPage * profilesPerPage);
  const latestEntries = useMemo(() => {
    return entries.filter((item, index, self) =>
      index === self.findIndex((t) => t.document === item.document)
    );
  }, [entries]);

  const filteredEntries = latestEntries.filter(item => {
    const matchesSearch = 
      (item?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (item?.company || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (item?.document || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (item?.vehiclePlate || '').toLowerCase().includes((searchQuery || '').toLowerCase());

    const matchesStatus = (statusFilter === 'Todos') || 
      (statusFilter === 'No Local' ? item.status === 'Ativo' : 
       statusFilter === 'Ativos' ? getProfileComplianceForEntry(item).isValid :
       item.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  if (entriesSort) {
    filteredEntries.sort((a, b) => {
      let aValue = '';
      let bValue = '';
      
      if (entriesSort.column === 'company') {
        aValue = (a.company || '').toLowerCase();
        bValue = (b.company || '').toLowerCase();
      }
      
      if (aValue < bValue) return entriesSort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return entriesSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totalEntriesPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const currentEntries = filteredEntries.slice((entriesCurrentPage - 1) * entriesPerPage, entriesCurrentPage * entriesPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Users className="w-8 h-8 text-purple-600" />
            Controle de Terceiros
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {selectedProfileIds.length > 0 && (
            <button
              onClick={handleBulkDeleteProfiles}
              disabled={isBulkDeleting}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-red-600/20"
            >
              <Trash2 className="w-4 h-4" />
              Excluir ({selectedProfileIds.length})
            </button>
          )}
          
          {user?.email === 'admin@florestal.com' && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2.5 rounded-xl transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Importar CSV
            </button>
          )}
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            <ShieldAlert className="w-4 h-4 text-purple-600" />
            Configurar Requisitos
          </button>
          <button
            onClick={handleOpenProfileRegister}
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            + Novo Terceiro
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => { setShowTodayModal(true); setStatusFilter('Todos'); }}
          className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm cursor-pointer hover:bg-slate-50 hover:border-purple-200 transition-all active:scale-95"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Entradas Hoje</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{entries.filter(item => new Date(item.checkInTime).toDateString() === new Date().toDateString()).length}</p>
          </div>
        </div>

        <div 
          onClick={() => { setShowActiveModal(true); setStatusFilter('No Local'); }}
          className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm cursor-pointer hover:bg-slate-50 hover:border-amber-200 transition-all active:scale-95"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">No Local (Ativos)</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{entries.filter(item => item.status === 'Ativo').length}</p>
          </div>
        </div>

        <div 
          onClick={() => setShowBannedModal(true)}
          className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm cursor-pointer hover:bg-slate-50 hover:border-red-200 transition-all active:scale-95"
        >
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Banimentos Ativos</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{profiles.filter(p => p.isBanned).length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row gap-4 items-center justify-between bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50">
          {/* Search bar with high-contrast prominent highlighting & clear button */}
          <div className="relative w-full lg:max-w-lg group">
            <div className={clsx(
              "absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 transition-colors pointer-events-none z-10",
              searchQuery ? "text-amber-700" : "text-slate-500 group-focus-within:text-purple-600"
            )}>
              <Search className="w-5 h-5 shrink-0" />
            </div>

            <input
              type="text"
              placeholder="Pesquisar por nome, CPF, empresa, setor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={clsx(
                "w-full pl-11 py-3 text-sm rounded-xl outline-none transition-all shadow-sm font-medium",
                searchQuery
                  ? "pr-36 border-2 border-amber-500 bg-amber-50/70 text-amber-950 ring-4 ring-amber-400/20 font-semibold"
                  : "pr-4 border border-slate-300 bg-slate-50/90 hover:bg-white text-slate-800 focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-100"
              )}
            />

            {searchQuery && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
                <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-200/90 text-amber-900 rounded-md tracking-wider border border-amber-300">
                  Filtrado
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  title="Limpar pesquisa"
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1 active:scale-95"
                >
                  <span>Limpar</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Upgraded Tabs */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-end overflow-x-auto pb-1 lg:pb-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/70 shadow-inner w-full lg:w-auto gap-1">
              {(['Todos', 'No Local', 'Ativos', 'Bloqueado'] as const).map((status) => {
                const count = (tabCounts as any)[status] || 0;
                const isActive = statusFilter === status;

                const getTabStyle = () => {
                  if (!isActive) return 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium';
                  switch (status) {
                    case 'No Local':
                      return 'bg-emerald-50 text-emerald-800 border border-emerald-300/90 shadow-sm font-bold';
                    case 'Ativos':
                      return 'bg-purple-50 text-purple-800 border border-purple-300/90 shadow-sm font-bold';
                    case 'Bloqueado':
                      return 'bg-rose-50 text-rose-800 border border-rose-300/90 shadow-sm font-bold';
                    default:
                      return 'bg-white text-slate-900 border border-slate-300 shadow-sm font-bold';
                  }
                };

                const getBadgeStyle = () => {
                  if (isActive) {
                    switch (status) {
                      case 'No Local':
                        return 'bg-emerald-200/80 text-emerald-900 font-extrabold';
                      case 'Ativos':
                        return 'bg-purple-200/80 text-purple-900 font-extrabold';
                      case 'Bloqueado':
                        return 'bg-rose-200/80 text-rose-900 font-extrabold';
                      default:
                        return 'bg-slate-200/80 text-slate-800 font-extrabold';
                    }
                  }
                  return 'bg-slate-200/60 text-slate-600 font-semibold';
                };

                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={clsx(
                      'text-xs px-3.5 py-2 rounded-lg transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial whitespace-nowrap',
                      getTabStyle()
                    )}
                  >
                    <span>{status}</span>
                    <span className={clsx('text-[11px] px-2 py-0.5 rounded-full transition-all', getBadgeStyle())}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-800 text-white text-[11px] font-extrabold uppercase tracking-wider">
                <tr className="divide-x border-b border-slate-900 divide-slate-600">
                  <th className="py-2 px-3 w-10 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700/50 text-purple-600 focus:ring-purple-500/30 cursor-pointer accent-purple-500"
                      checked={currentProfiles.length > 0 && selectedProfileIds.length === currentProfiles.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProfileIds(currentProfiles.map(p => p.id));
                        } else {
                          setSelectedProfileIds([]);
                        }
                      }}
                    />
                  </th>
                  <th className="py-2 px-3 w-72">Terceiro / Empresa</th>
                  <th className="py-2 px-3 w-36 whitespace-nowrap">CPF</th>
                  <th className="py-2 px-3 min-w-[260px]">Requisitos SESMT</th>
                  <th className="py-2 px-3 w-48 whitespace-nowrap">Status</th>
                  <th className="py-2 px-3 text-center w-28 whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-300 text-xs text-slate-700 bg-white">
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">
                      <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="font-medium text-sm">Nenhum terceiro encontrado na base</p>
                      <p className="text-xs text-slate-400 mt-1">Experimente alterar os filtros de busca ou cadastrar um novo terceiro.</p>
                    </td>
                  </tr>
                ) : (
                  currentProfiles.map(profile => {
                    const displayPhotoUrl = profile.photoUrl || profile.photoBase64;
                    const comp = getProfileComplianceForEntry({ document: profile.document, requirements: [] } as any);
                    
                    return (
                      <tr key={profile.id} className="hover:bg-slate-50/70 border-b border-slate-100/50 divide-x divide-slate-200">
                        <td className="py-2.5 px-3 text-center bg-slate-50/30 border-r border-slate-200">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500/30 cursor-pointer accent-purple-600"
                            checked={selectedProfileIds.includes(profile.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProfileIds(prev => [...prev, profile.id]);
                              } else {
                                setSelectedProfileIds(prev => prev.filter(id => id !== profile.id));
                              }
                            }}
                          />
                        </td>
                        <td className="py-1.5 px-3">
                          <div className="flex items-center gap-3">
                            {displayPhotoUrl ? (
                              <img src={displayPhotoUrl.startsWith('data:image') ? displayPhotoUrl : getAssetUrl(displayPhotoUrl)} alt={profile.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                                <Users className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-800">{profile.name}</p>
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3.5 h-3.5" />
                                {profile.company}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-1.5 px-3">
                          <span className="font-mono text-xs">{profile.document}</span>
                        </td>
                        <td className="py-1.5 px-3">
                          <div className="flex flex-wrap gap-1">
                            {(() => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);

                              const isAsoValid = profile.asoDate && parseLocalDate(profile.asoDate) >= today;
                              const isAsoExpired = profile.asoDate && parseLocalDate(profile.asoDate) < today;

                              const isSesmtValid = profile.sesmtDate && parseLocalDate(profile.sesmtDate) >= today;
                              const isSesmtExpired = profile.sesmtDate && parseLocalDate(profile.sesmtDate) < today;

                              const hasPhoto = !!(profile.photoUrl || profile.photoBase64);
                              let isPhotoValid = false;
                              if (hasPhoto && profile.photoDate) {
                                const pDate = new Date(profile.photoDate);
                                const expDate = new Date(pDate.getTime() + photoValidityDays * 24 * 60 * 60 * 1000);
                                expDate.setHours(23, 59, 59, 999);
                                if (expDate >= today) isPhotoValid = true;
                              } else if (hasPhoto) {
                                isPhotoValid = true;
                              }

                              return (
                                <>
                                  {profile.asoDate ? (
                                    <span 
                                      className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${isAsoValid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`} 
                                      title={`ASO: ${profile.asoDate} (${isAsoValid ? 'Válido' : 'Vencido'})`}
                                    >
                                      ASO {isAsoValid ? '✓' : '⚠️'}
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-100 text-[9px] font-bold rounded" title="ASO Pendente">
                                      ASO ⚠️
                                    </span>
                                  )}

                                  {profile.sesmtDate ? (
                                    <span 
                                      className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${isSesmtValid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`} 
                                      title={`SESMT: ${profile.sesmtDate} (${isSesmtValid ? 'Válido' : 'Vencido'})`}
                                    >
                                      SESMT {isSesmtValid ? '✓' : '⚠️'}
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-100 text-[9px] font-bold rounded" title="SESMT Pendente">
                                      SESMT ⚠️
                                    </span>
                                  )}

                                  {hasPhoto ? (
                                    <span 
                                      className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${isPhotoValid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`} 
                                      title={isPhotoValid ? 'Foto Cadastrada' : 'Foto Vencida'}
                                    >
                                      FOTO {isPhotoValid ? '✓' : '⚠️'}
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold rounded" title="Foto Pendente no cadastro">
                                      FOTO 📷
                                    </span>
                                  )}

                                  {profile.customReqs && Object.keys(profile.customReqs).length > 0 && Object.keys(profile.customReqs).map(req => {
                                    const valDate = profile.customReqs![req];
                                    const isReqValid = valDate && parseLocalDate(valDate) >= today;
                                    return (
                                      <span 
                                        key={req} 
                                        className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${isReqValid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`} 
                                        title={`${req}: ${valDate}`}
                                      >
                                        {req.toUpperCase()} {isReqValid ? '✓' : '⚠️'}
                                      </span>
                                    );
                                  })}
                                </>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="py-1.5 px-3">
                          {(() => {
                            if (profile.isBanned) {
                              return (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 shadow-sm whitespace-nowrap">
                                  <Ban className="w-3 h-3" />
                                  Banido
                                </span>
                              );
                            }
                            const dynStatus = getProfileDynamicStatus(profile);
                            if (dynStatus === 'No Local') {
                              return (
                                <span className="inline-flex items-center justify-center w-6 h-6 text-blue-600 bg-blue-50 rounded-md border border-blue-100 shadow-sm" title="No Local">
                                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                </span>
                              );
                            }
                            if (dynStatus === 'Ativo') {
                              return (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 shadow-sm whitespace-nowrap">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  Ativo
                                </span>
                              );
                            }
                            return (
                              <span 
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 shadow-sm whitespace-nowrap" 
                                title={`Pendente/Vencido: ${comp.errors.join(', ')}`}
                              >
                                <XCircle className="w-3 h-3 text-red-500" />
                                Bloqueado {comp.errors.length > 0 ? `(${comp.errors.join(', ')})` : ''}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-1.5 px-3 text-center whitespace-nowrap bg-slate-50">
                          <div className="flex items-center justify-end gap-2">
                            {(() => {
                              const dynStatus = getProfileDynamicStatus(profile);
                              if (dynStatus === 'No Local') {
                                const activeEntry = entries.find(e => e.document === profile.document && e.status === 'Ativo');
                                return (
                                  <button
                                    onClick={() => {
                                      if (activeEntry) {
                                        setCheckOutPassword('');
                                        setCheckOutAuthorizedBy('');
                                        setConfirmCheckOutId(activeEntry.id);
                                      }
                                    }}
                                    title="Registrar Saída"
                                    className="bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 p-2 rounded-xl transition-all flex items-center justify-center shadow-sm"
                                  >
                                    <LogOut className="w-5 h-5" />
                                  </button>
                                );
                              } else if (dynStatus === 'Ativo') {
                                return (
                                  <button
                                    onClick={() => handleProfileCheckIn(profile)}
                                    title="Registrar Entrada"
                                    className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 p-2 rounded-xl transition-all flex items-center justify-center shadow-sm"
                                  >
                                    <LogIn className="w-5 h-5" />
                                  </button>
                                );
                              }
                              return null;
                            })()}
                            <button
                              onClick={() => {
                                handleOpenProfileEdit(profile);
                                setShowProfileModal(true);
                              }}
                              className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 p-2 rounded-xl transition-all flex items-center justify-center shadow-sm"
                              title="Editar Cadastro"
                            >
                              <Edit3 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Deseja realmente excluir o cadastro de ${profile.name}? Esta ação não pode ser desfeita.`)) {
                                  try {
                                    await thirdPartyApi.deleteProfile(profile.id);
                                    saveProfiles(profiles.filter(p => p.id !== profile.id));
                                  } catch (error) {
                                    console.error('Failed to delete profile:', error);
                                    setAlertModal({ title: 'Erro', message: 'Erro ao excluir cadastro. Tente novamente.', type: 'error' });
                                  }
                                }
                              }}
                              className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 p-2 rounded-xl transition-all flex items-center justify-center shadow-sm"
                              title="Excluir Cadastro"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            
            {totalProfilesPages > 1 && (
              <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 sticky left-0 right-0 rounded-b-2xl">
                <div className="text-sm text-slate-500">
                  Mostrando <span className="font-bold text-slate-700">{((profilesCurrentPage - 1) * profilesPerPage) + 1}</span> a <span className="font-bold text-slate-700">{Math.min(profilesCurrentPage * profilesPerPage, filteredProfiles.length)}</span> de <span className="font-bold text-slate-700">{filteredProfiles.length}</span> resultados
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-600">
                    Página {profilesCurrentPage} de {totalProfilesPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setProfilesCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={profilesCurrentPage === 1}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-white hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm flex items-center gap-1 bg-slate-100 shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>
                    <button
                      onClick={() => setProfilesCurrentPage(prev => Math.min(prev + 1, totalProfilesPages))}
                      disabled={profilesCurrentPage === totalProfilesPages || totalProfilesPages === 0}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-white hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm flex items-center gap-1 bg-slate-100 shadow-sm"
                    >
                      Próxima <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Modal - Registrar / Editar Entrada (LEGADO) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingEntry ? 'Editar Registro de Terceiro' : 'Registrar Entrada de Terceiro'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-6 mb-4">
                <div className="flex flex-col items-center gap-3 w-full sm:w-auto">
                  <div className="w-32 h-32 bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200 border-dashed flex items-center justify-center relative">
                    {photoDataUrl ? (
                      <img src={photoDataUrl.startsWith('data:image') ? photoDataUrl : getAssetUrl(photoDataUrl)} alt="Selfie" className="w-full h-full object-cover" />
                    ) : isCameraOpen ? (
                      <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                    ) : (
                      <div className="text-slate-400 flex flex-col items-center">
                        <Camera className="w-8 h-8 mb-1 opacity-50" />
                        <span className="text-[10px] font-bold uppercase opacity-70">Sem Foto</span>
                      </div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  
                  {isCameraOpen ? (
                    <div className="flex gap-2 w-full sm:w-32">
                      <button type="button" onClick={takePhoto} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl transition-colors">Capturar</button>
                      <button type="button" onClick={closeCamera} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold py-2 rounded-xl transition-colors">Cancelar</button>
                    </div>
                  ) : (
                    <div className="w-full sm:w-32 flex flex-col items-center">
                      <button type="button" onClick={openCamera} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" /> {photoDataUrl ? 'Tirar Outra' : 'Tirar Foto'}
                      </button>
                      {photoDataUrl && photoDateStr && (
                        <span className={`text-[10px] mt-1.5 font-bold text-center ${
                          getPhotoDaysLeftText()?.includes('Vencid') || getPhotoDaysLeftText()?.includes('hoje') 
                            ? 'text-red-500' 
                            : 'text-emerald-600'
                        }`}>
                          {getPhotoDaysLeftText()}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nome completo do visitante/prestador"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Responsável Interno (Contato)
                    </label>
                    <input
                      type="text"
                      value={internalContact}
                      onChange={(e) => setInternalContact(e.target.value)}
                      placeholder="Pessoa de contato na empresa"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Empresa *
                  </label>
                  <SearchableCompanySelect
                    value={selectedCompanyId}
                    onChange={(val: string) => {
                      setSelectedCompanyId(val);
                    }}
                    options={companiesList}
                    onAddCustom={() => {
                      setShowCompanyModal(true);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Documento (RG/CPF) *
                  </label>
                  <input
                    type="text"
                    required
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder="Número do documento"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Placa do Veículo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    placeholder="ABC1D23"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Área / Destino *
                  </label>
                  <SearchableSectorSelect
                    value={destination}
                    onChange={setDestination}
                    options={sectorOptions}
                    placeholder="Ex: Bloco B Apto 104, TI"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Quem Autorizou? (Senha do Vigia) *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required={!authorizedBy}
                      value={authPassword}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAuthPassword(val);
                        const matched = guards.find(g => g.auth_password && g.auth_password === val);
                        if (matched) {
                          setAuthorizedBy(matched.name);
                        } else {
                          setAuthorizedBy('');
                        }
                      }}
                      placeholder="Digite a senha (PIN)"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all bg-white"
                    />
                    {authorizedBy && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md text-xs font-bold">
                        <UserCheck className="w-3.5 h-3.5" />
                        {authorizedBy}
                      </div>
                    )}
                  </div>
                  {!authorizedBy && authPassword.length > 0 && (
                    <p className="text-[10px] text-red-500 mt-1.5 font-medium">Senha inválida ou vigia não encontrado.</p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Motivo da Visita *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Descreva o motivo da entrada ou serviço..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all resize-none"
                  />
                </div>
                {sectorAdminMap[destination] && (
                  <div className="mt-4 flex items-center justify-between bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg col-span-2">
                    <div className="pr-4">
                      <p className="text-sm font-bold text-emerald-800">Liberar Acesso Físico (Control iD)</p>
                      <p className="text-[10px] text-emerald-600/80 mt-0.5">Sincroniza a face para acesso hoje.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={enableControlId}
                        onChange={(e) => setEnableControlId(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-emerald-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-emerald-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                )}
              </div>
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
                  onClick={(e) => {
                    if (authPassword && !authorizedBy) {
                      e.preventDefault();
                      setAlertModal({ title: 'Senha Inválida', message: 'A senha do vigia/autorizador está incorreta.', type: 'error' });
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-purple-500/20 text-sm"
                >
                  {editingEntry ? 'Salvar Alterações' : 'Confirmar Entrada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-205">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-205">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-purple-600 animate-pulse" />
                  Configurar Requisitos do SESMT
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Cadastre novos requisitos de entrada obrigatórios ou normas regulamentadoras.
                </p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Validade da Foto (Selfie)
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={photoValidityDays}
                    onChange={(e) => {
                      const days = parseInt(e.target.value, 10);
                      if (!isNaN(days) && days > 0) {
                        setPhotoValidityDays(days);
                        thirdPartyApi.saveConfig({ type: 'setting', id: 'photo_validity_days', value: days });
                      }
                    }}
                    className="w-24 px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                  />
                  <span className="text-sm text-slate-600 font-medium">dias</span>
                </div>
              </div>

              {/* Form to Add New Requirement */}
              <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wider">
                  Adicionar Novo Requisito / Norma
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: NR 13 - Vasos de Pressão"
                    value={newReqName}
                    onChange={(e) => setNewReqName(e.target.value)}
                    className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                  />
                  <button
                    onClick={() => {
                      if (!newReqName.trim()) {
                        setAlertModal({ title: 'Campo Obrigatório', message: 'Por favor, informe o nome do requisito.', type: 'warning' });
                        return;
                      }
                      
                      const code = newReqName
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '') // remove accents
                        .replace(/[^a-z0-9]/g, '') // alphanumeric only
                        .trim();

                      if (!code) {
                        setAlertModal({ title: 'Nome Inválido', message: 'Nome inválido para gerar o identificador do requisito.', type: 'warning' });
                        return;
                      }

                      if (customRequirements.some(r => r.code === code)) {
                        setAlertModal({ title: 'Requisito Existente', message: 'Já existe um requisito cadastrado com este nome.', type: 'warning' });
                        return;
                      }

                      const newReq = {
                        id: Date.now().toString(),
                        name: newReqName.trim(),
                        code
                      };

                      const updatedReqs = [...customRequirements, newReq];
                      setCustomRequirements(updatedReqs);
                      thirdPartyApi.saveConfig({ type: 'custom_req', id: newReq.id, value: newReq });
                      setNewReqName('');
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 rounded-xl transition-all shadow-sm active:scale-95 text-xs whitespace-nowrap shrink-0"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Requirements List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Requisitos Cadastrados ({customRequirements.length})
                </h4>
                
                <div className="border border-slate-150 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white max-h-[250px] overflow-y-auto">
                  {customRequirements.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      Nenhum requisito customizado cadastrado.
                    </div>
                  ) : (
                    customRequirements.map(req => (
                      <div key={req.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-purple-500 shrink-0" />
                          <span className="text-xs font-semibold text-slate-700">{req.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono select-none">
                            {req.code}
                          </span>
                        </div>
                        
                        {req.code !== 'nr35' && req.code !== 'nr10' ? (
                          <button
                            onClick={() => {
                              if (confirm(`Deseja realmente remover o requisito "${req.name}"?`)) {
                                const updated = customRequirements.filter(r => r.id !== req.id);
                                setCustomRequirements(updated);
                                thirdPartyApi.deleteConfig(req.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic font-medium select-none pr-1">Padrão</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-purple-500/20 text-sm active:scale-95"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 1. Modal - Cadastrar / Editar Perfil de Terceiro */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="px-6 pt-4 bg-slate-50 border-b border-slate-150 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-lg">
                  {editingProfile ? 'Editar Perfil do Terceiro' : 'Cadastrar Terceiro (SESMT)'}
                </h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {editingProfile && (
                <div className="flex bg-slate-200/70 p-1 rounded-xl w-full sm:w-fit mt-1">
                  <button
                    type="button"
                    onClick={() => setProfileTab('cadastro')}
                    className={`flex-1 sm:flex-none px-6 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
                      profileTab === 'cadastro' 
                        ? 'bg-white text-purple-700 shadow-sm border border-slate-200/60' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-300/50'
                    }`}
                  >
                    Ficha Cadastral
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileTab('historico')}
                    className={`flex-1 sm:flex-none px-6 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
                      profileTab === 'historico' 
                        ? 'bg-white text-purple-700 shadow-sm border border-slate-200/60' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-300/50'
                    }`}
                  >
                    Histórico & Acessos
                  </button>
                </div>
              )}
            </div>

            <div className="p-0">
              {validationError && profileTab === 'cadastro' && (
                <div className="m-6 mb-0 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-700 leading-relaxed">{validationError}</p>
                </div>
              )}

              {profileTab === 'cadastro' ? (
                <div className="p-6">
                  <form id="profileForm" onSubmit={handleSubmitProfile} className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Câmera */}
                  <div className="flex flex-col items-center gap-3 w-full sm:w-auto shrink-0">
                    <div className="w-32 h-32 bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200 border-dashed flex items-center justify-center relative">
                      {photoDataUrl ? (
                        <img src={photoDataUrl.startsWith('data:image') ? photoDataUrl : getAssetUrl(photoDataUrl)} alt="Selfie" className="w-full h-full object-cover" />
                      ) : isCameraOpen ? (
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                      ) : (
                        <div className="text-slate-400 flex flex-col items-center">
                          <Camera className="w-8 h-8 mb-1 opacity-50" />
                          <span className="text-[10px] font-bold uppercase opacity-70">Sem Foto</span>
                        </div>
                      )}
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                    
                    {isCameraOpen ? (
                      <div className="flex gap-2 w-full sm:w-32">
                        <button type="button" onClick={takePhoto} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl transition-colors">Capturar</button>
                        <button type="button" onClick={closeCamera} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold py-2 rounded-xl transition-colors">Cancelar</button>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center">
                        <button type="button" onClick={openCamera} className="w-full sm:w-32 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                          <Camera className="w-3.5 h-3.5" /> {photoDataUrl ? 'Tirar Outra' : 'Tirar Foto'}
                        </button>
                        {photoDataUrl && photoDateStr && (
                          <span className={`text-[10px] mt-1.5 font-bold ${
                            getPhotoDaysLeftText()?.includes('Vencid') || getPhotoDaysLeftText()?.includes('hoje') 
                              ? 'text-red-500' 
                              : 'text-emerald-600'
                          }`}>
                            {getPhotoDaysLeftText()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Campos do Perfil */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-700">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-700">Responsável Interno (Contato)</label>
                    <input
                      type="text"
                      value={internalContact}
                      onChange={e => setInternalContact(e.target.value)}
                      placeholder="Pessoa de contato na empresa"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Empresa *</label>
                    <SearchableCompanySelect
                      value={selectedCompanyId}
                      onChange={(val: string) => {
                        setSelectedCompanyId(val);
                      }}
                      options={companiesList}
                      onAddCustom={() => {
                        setShowCompanyModal(true);
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">CPF / RG *</label>
                    <input
                      type="text"
                      required
                      value={document}
                      onChange={e => setDocument(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none"
                      placeholder="Somente números ou formato padrão"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Placa do Veículo Padrão (Opcional)</label>
                    <input
                      type="text"
                      value={vehiclePlate}
                      onChange={e => setVehiclePlate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none uppercase"
                      placeholder="XXX-0000"
                    />
                  </div>
                </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 space-y-4 mb-6">
                    <label className="flex items-center gap-3 cursor-pointer w-fit">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={isBanned}
                          onChange={(e) => setIsBanned(e.target.checked)}
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600 transition-colors"></div>
                      </div>
                      <span className="text-sm font-bold text-red-700">Proibir Entrada (Banimento)</span>
                    </label>
                    
                    {isBanned && (
                      <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                        <label className="text-xs font-semibold text-red-800">Motivo do Banimento *</label>
                        <textarea
                          required={isBanned}
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none bg-white min-h-[80px] resize-none"
                          placeholder="Justifique o motivo pelo qual este terceiro está proibido de entrar na empresa..."
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                    <div className="pr-4">
                      <p className="text-sm font-bold text-slate-800">Prestador de Serviço Administrativo</p>
                      <p className="text-xs text-slate-500 mt-1">Isenta ASO e NRs, mas restringe acesso exclusivamente a áreas sem risco.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={isAdminService}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsAdminService(checked);
                          if (checked) setShowAdminWarning(true);
                        }}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <ShieldAlert className="w-4 h-4 text-purple-600" />
                    Segurança & SESMT
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Validade do ASO</label>
                      <input
                        type="date"
                        value={asoDate}
                        onChange={e => setAsoDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Data Treinamento SESMT</label>
                      <input
                        type="date"
                        value={sesmtTrainingDate}
                        onChange={e => setSesmtTrainingDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Validade SESMT</label>
                      <input
                        type="date"
                        value={sesmtDate}
                        onChange={e => setSesmtDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none"
                      />
                    </div>
                  </div>

                  {customRequirements.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wider">Requisitos Específicos Adicionais</p>
                      <div className="space-y-3">
                        {customRequirements.map(req => (
                          <div key={req.code} className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center gap-2 min-w-[200px]">
                              <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={selectedReqs[req.code] || false}
                                  onChange={(e) => {
                                    setSelectedReqs(prev => ({ ...prev, [req.code]: e.target.checked }));
                                  }}
                                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                                />
                                <span className="text-sm font-medium text-slate-700 group-hover:text-purple-700 transition-colors">
                                  {req.name}
                                </span>
                              </label>
                              {editingProfile && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setHistoryDocFilter(req.name);
                                    setHistoryTab('docs');
                                    setProfileTab('historico');
                                  }}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                  title={`Ver histórico de ${req.name}`}
                                >
                                  <History className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            
                            {selectedReqs[req.code] && (
                              <div className="flex-1 animate-in fade-in slide-in-from-left-2 duration-200">
                                <input
                                  type="date"
                                  required
                                  value={reqDates[req.code] || ''}
                                  onChange={(e) => setReqDates(prev => ({ ...prev, [req.code]: e.target.value }))}
                                  className="w-full sm:w-auto px-3 py-1.5 border border-purple-200 bg-purple-50 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col h-full max-h-[600px] bg-white">
                  <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-2 items-end justify-between shrink-0">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setHistoryTab('docs')}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${historyTab === 'docs' ? 'border-blue-500 text-blue-700 bg-blue-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-t-lg'}`}
                      >
                        Auditoria de Documentos
                      </button>
                      <button
                        onClick={() => setHistoryTab('visits')}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${historyTab === 'visits' ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-t-lg'}`}
                      >
                        Registro de Entrada e Saída
                      </button>
                    </div>

                    <div className="pb-2 flex items-center gap-2">
                      {historyTab === 'docs' && historyDocFilter && (
                        <div className="flex items-center gap-1.5 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-purple-200 shadow-sm animate-in fade-in zoom-in duration-200">
                          <span>{historyDocFilter}</span>
                          <button onClick={() => setHistoryDocFilter('')} className="hover:text-purple-900 transition-colors p-0.5 rounded-full hover:bg-purple-200/50">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <input
                        type="date"
                        value={historyDateFilter}
                        onChange={(e) => setHistoryDateFilter(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-600 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none bg-white shadow-sm"
                        title="Filtrar por data"
                      />
                    </div>
                  </div>

                  <div className="p-0 overflow-y-auto bg-white flex-1 min-h-[300px]">
                    {historyTab === 'docs' ? (
                      (!editingProfile?.documentHistory || editingProfile.documentHistory.length === 0) ? (
                        <div className="p-10 text-center flex flex-col items-center">
                          <History className="w-10 h-10 text-slate-300 mb-3" />
                          <h3 className="text-slate-600 font-medium text-sm">Nenhum histórico de renovação.</h3>
                          <p className="text-xs text-slate-400 mt-1 max-w-xs">
                            As renovações de ASO, SESMT e NRs aparecerão aqui quando forem atualizadas.
                          </p>
                        </div>
                      ) : (
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100 uppercase sticky top-0">
                            <tr>
                              <th className="px-6 py-3 font-semibold">Documento Atualizado</th>
                              <th className="px-6 py-3 font-semibold">Validade Anterior</th>
                              <th className="px-6 py-3 font-semibold text-blue-700">Nova Validade</th>
                              <th className="px-6 py-3 font-semibold">Responsável</th>
                              <th className="px-6 py-3 font-semibold">Data da Ação (Log)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(() => {
                              let docsToRender = [...editingProfile.documentHistory!].reverse();
                              if (historyDocFilter) {
                                docsToRender = docsToRender.filter(entry => entry.type === historyDocFilter);
                              }
                              if (historyDateFilter) {
                                const filterPtBr = historyDateFilter.split('-').reverse().join('/');
                                docsToRender = docsToRender.filter(entry => entry.updatedAt.includes(filterPtBr));
                              }
                              
                              if (docsToRender.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                      Nenhum documento encontrado para esta data.
                                    </td>
                                  </tr>
                                );
                              }

                              return docsToRender.map((entry, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="px-6 py-3.5 font-medium text-slate-700">{entry.type}</td>
                                  <td className="px-6 py-3.5 text-slate-500 line-through decoration-slate-300">
                                    {entry.previousDate !== 'Não definido' && entry.previousDate !== 'Desmarcado' && entry.previousDate !== 'Banido' ? 
                                      new Date(entry.previousDate).toLocaleDateString('pt-BR') : entry.previousDate}
                                  </td>
                                  <td className="px-6 py-3.5 text-blue-700 font-medium bg-blue-50/30">
                                    {entry.newDate !== 'Não definido' && entry.newDate !== 'Desmarcado' && entry.newDate !== 'Liberado' ? 
                                      new Date(entry.newDate).toLocaleDateString('pt-BR') : entry.newDate}
                                  </td>
                                  <td className="px-6 py-3.5 text-slate-600">
                                    {entry.updatedBy || 'Sistema'}
                                  </td>
                                  <td className="px-6 py-3.5 text-slate-500 font-mono text-xs text-right">{entry.updatedAt}</td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      )
                    ) : (() => {
                      const activeEntry = entries.find(e => e.document === editingProfile?.document && e.status === 'Ativo');
                      const storedVisits = entries
                        .filter(e => e.document === editingProfile?.document && e.status !== 'Ativo')
                        .map(e => ({
                          checkInTime: e.checkInTime,
                          checkOutTime: e.checkOutTime,
                          destination: e.destination,
                          reason: e.reason,
                          authorizedBy: e.authorizedBy
                        }))
                        .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());
                      let displayVisits = [...storedVisits];
                      
                      if (activeEntry && !displayVisits.some(v => v.checkInTime === activeEntry.checkInTime)) {
                        displayVisits.unshift({
                          checkInTime: activeEntry.checkInTime,
                          checkOutTime: undefined,
                          destination: activeEntry.destination,
                          reason: activeEntry.reason,
                          authorizedBy: activeEntry.authorizedBy
                        });
                      }

                      if (historyDateFilter) {
                        const filterPtBr = historyDateFilter.split('-').reverse().join('/');
                        displayVisits = displayVisits.filter(v => {
                          const localDateStr = new Date(v.checkInTime).toLocaleDateString('pt-BR');
                          return localDateStr === filterPtBr;
                        });
                      }

                      if (displayVisits.length === 0) {
                        return (
                          <div className="p-10 text-center flex flex-col items-center">
                            <History className="w-10 h-10 text-slate-300 mb-3" />
                            <h3 className="text-slate-600 font-medium text-sm">
                              {historyDateFilter ? 'Nenhuma entrada nesta data.' : 'Nenhum registro de entrada.'}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs">
                              {historyDateFilter ? 'Tente limpar o filtro de data para ver o histórico completo.' : 'O histórico de entradas deste terceiro aparecerá aqui.'}
                            </p>
                          </div>
                        );
                      }

                      return (
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100 uppercase sticky top-0">
                            <tr>
                              <th className="px-6 py-3 font-semibold">Entrada</th>
                              <th className="px-6 py-3 font-semibold">Saída</th>
                              <th className="px-6 py-3 font-semibold">Destino</th>
                              <th className="px-6 py-3 font-semibold">Autorizador</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {displayVisits.map((visit, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="px-6 py-3.5 font-medium text-emerald-700 bg-emerald-50/30">
                                  {formatDateTime(visit.checkInTime)}
                                </td>
                                <td className="px-6 py-3.5 text-purple-700 bg-purple-50/30 font-medium">
                                  {formatDateTime(visit.checkOutTime) || '-'}
                                </td>
                                <td className="px-6 py-3.5 text-slate-600">
                                  <span className="block font-medium">{visit.destination}</span>
                                  <span className="block text-xs text-slate-400">{visit.reason}</span>
                                </td>
                                <td className="px-6 py-3.5 text-slate-500 text-xs">{visit.authorizedBy}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-all"
              >
                Cancelar
              </button>
              {profileTab === 'cadastro' && (
                <button
                  type="submit"
                  form="profileForm"
                  className="px-6 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-md shadow-purple-500/20 active:scale-95"
                >
                  {editingProfile ? 'Salvar Alterações' : 'Cadastrar Terceiro'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal - Quick Check-in de Terceiro */}
      {showQuickCheckInModal && selectedProfileForCheckIn && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <h3 className="font-bold text-emerald-800 text-lg flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Autorizar Entrada de Terceiro
              </h3>
              <button
                onClick={() => setShowQuickCheckInModal(false)}
                className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                    {selectedProfileForCheckIn.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{selectedProfileForCheckIn.name}</p>
                    <p className="text-sm text-slate-500">{selectedProfileForCheckIn.company} • Doc: {selectedProfileForCheckIn.document}</p>
                  </div>
                </div>
                <details className="mt-3 group">
                  <summary className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-semibold uppercase cursor-pointer hover:bg-emerald-200 transition-colors list-none [&::-webkit-details-marker]:hidden">
                    <CheckCircle2 className="w-3 h-3" />
                    Documentos SESMT em dia
                    <svg className="w-3 h-3 ml-1 opacity-60 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="mt-3 p-3 bg-white border border-emerald-100 rounded-lg text-xs space-y-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500 font-medium">ASO</span>
                      <span className="font-bold text-emerald-700">{selectedProfileForCheckIn.asoDate ? parseLocalDate(selectedProfileForCheckIn.asoDate).toLocaleDateString('pt-BR') : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500 font-medium">Integração SESMT</span>
                      <span className="font-bold text-emerald-700">{selectedProfileForCheckIn.sesmtDate ? parseLocalDate(selectedProfileForCheckIn.sesmtDate).toLocaleDateString('pt-BR') : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500 font-medium">Foto de Identificação</span>
                      <span className="font-bold text-emerald-700">OK</span>
                    </div>
                    {selectedProfileForCheckIn.customReqs && Object.entries(selectedProfileForCheckIn.customReqs).map(([code, date]) => (
                      <div key={code} className="flex justify-between items-center border-b border-slate-50 pb-1.5 last:border-0 last:pb-0">
                        <span className="text-slate-500 font-medium">{customRequirements.find(r => r.code === code)?.name || code}</span>
                        <span className="font-bold text-emerald-700">{date ? parseLocalDate(date as string).toLocaleDateString('pt-BR') : '-'}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>

              <form id="quickCheckInForm" onSubmit={handleSaveQuickCheckIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Motivo da Entrada *</label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
                    placeholder="Ex: Manutenção no equipamento X"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Destino (Local) *</label>
                    <SearchableSectorSelect
                      value={destination}
                      onChange={setDestination}
                      options={sectorOptions}
                      placeholder="Ex: T.I. / Setor 2"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Autorizado por (Senha) *</label>
                    <div className="relative">
                      <input
                        type="password"
                        required={!authorizedBy}
                        value={authPassword}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAuthPassword(val);
                          const matched = guards.find(g => g.auth_password && g.auth_password === val);
                          if (matched) {
                            setAuthorizedBy(matched.name);
                          } else {
                            setAuthorizedBy('');
                          }
                        }}
                        placeholder={authorizedBy ? "Digite nova senha para alterar" : "Digite a senha (PIN)"}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none bg-white"
                      />
                      {authorizedBy && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          <UserCheck className="w-3 h-3" />
                          {authorizedBy}
                        </div>
                      )}
                    </div>
                    {!authorizedBy && authPassword.length > 0 && (
                      <p className="text-[10px] text-red-500 mt-1 font-medium">Senha inválida ou vigia não encontrado.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="text-xs font-semibold text-slate-400">Placa do Veículo (Opcional)</label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={e => setVehiclePlate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none uppercase"
                    placeholder="XXX-0000"
                  />
                </div>
                
                {sectorAdminMap[destination] && (
                  <div className="mt-4 flex items-center justify-between bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg">
                    <div className="pr-4">
                      <p className="text-sm font-bold text-emerald-800">Liberar Acesso Físico (Control iD)</p>
                      <p className="text-[10px] text-emerald-600/80 mt-0.5">Sincroniza a face para acesso hoje.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={enableControlId}
                        onChange={(e) => setEnableControlId(e.target.checked)}
                      />
                      <div className="w-9 h-5 bg-emerald-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-emerald-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                )}
              </form>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowQuickCheckInModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="quickCheckInForm"
                onClick={(e) => {
                  if (authPassword && !authorizedBy) {
                    e.preventDefault();
                    setAlertModal({ title: 'Senha Inválida', message: 'A senha do vigia/autorizador está incorreta.', type: 'error' });
                  }
                }}
                className="px-6 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95"
              >
                Confirmar Entrada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal - Renovação de Documentos Vencidos */}
      {showRenewModal && selectedProfileForRenewal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 my-8 border-t-4 border-red-500">
            <div className="px-6 py-4 bg-red-50/50 border-b border-red-100 flex items-center justify-between">
              <h3 className="font-bold text-red-800 text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Renovar Documentação SESMT
              </h3>
              <button
                onClick={() => setShowRenewModal(false)}
                className="p-1 rounded-lg text-red-400 hover:bg-red-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-5 text-sm text-red-700 bg-red-50 p-4 rounded-xl border border-red-100 font-medium">
                {validationError}
                <p className="mt-2 text-red-600 text-xs font-normal">
                  Insira as novas datas de validade. As datas anteriores serão arquivadas no Histórico de Documentos para auditoria.
                </p>
              </div>

              <form id="renewForm" onSubmit={handleSaveRenewal} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Nova Validade do ASO</label>
                    <input
                      type="date"
                      value={renewAsoDate}
                      onChange={e => setRenewAsoDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Novo Treinamento SESMT *</label>
                    <input
                      type="date"
                      required
                      value={renewSesmtDate}
                      onChange={e => setRenewSesmtDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none"
                    />
                  </div>
                </div>

                {customRequirements.filter(req => selectedProfileForRenewal.customReqs && selectedProfileForRenewal.customReqs[req.code] !== undefined).length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wider">Requisitos Específicos Adicionais</p>
                    <div className="space-y-3">
                      {customRequirements.map(req => {
                        if (!selectedProfileForRenewal.customReqs || selectedProfileForRenewal.customReqs[req.code] === undefined) return null;
                        
                        return (
                          <div key={req.code} className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <label className="flex items-center gap-2 min-w-[200px]">
                              <span className="text-sm font-medium text-slate-700">
                                {req.name} *
                              </span>
                            </label>
                            
                            <div className="flex-1">
                              <input
                                type="date"
                                required
                                value={renewCustomDates[req.code] || ''}
                                onChange={(e) => setRenewCustomDates(prev => ({ ...prev, [req.code]: e.target.value }))}
                                className="w-full sm:w-auto px-3 py-1.5 border border-red-200 bg-red-50 rounded-lg text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRenewModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="renewForm"
                className="px-6 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-500/20 active:scale-95 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Salvar & Autorizar Entrada
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Modal Confirmação de Saída */}
      {confirmCheckOutId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 text-purple-600 mb-4">
                <div className="bg-purple-100 p-2 rounded-full">
                  <LogOut className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-800">Confirmar Saída</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Deseja registrar a saída deste terceiro? Ele deixará de aparecer na lista de ativos e a visita será concluída no histórico.
              </p>

              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Autorizado por (Senha do Vigia) *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={checkOutPassword}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCheckOutPassword(val);
                      const matched = guards.find(g => g.auth_password && g.auth_password === val);
                      if (matched) {
                        setCheckOutAuthorizedBy(matched.name);
                      } else {
                        setCheckOutAuthorizedBy('');
                      }
                    }}
                    placeholder="Digite a senha (PIN)"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                  />
                  {checkOutAuthorizedBy && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md text-xs font-bold">
                      <UserCheck className="w-3.5 h-3.5" />
                      {checkOutAuthorizedBy}
                    </div>
                  )}
                </div>
                {!checkOutAuthorizedBy && checkOutPassword.length > 0 && (
                  <p className="text-[10px] text-red-500 mt-1.5 font-medium">Senha inválida ou vigia não encontrado.</p>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmCheckOutId(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  disabled={!checkOutAuthorizedBy}
                  onClick={() => handleCheckOut(confirmCheckOutId)}
                  className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-md shadow-purple-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sim, Registrar Saída
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Terceiros no Local */}
      {showActiveModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-amber-600 animate-pulse" />
                <h3 className="font-bold text-amber-800 text-lg">
                  Terceiros no Local (Ativos)
                </h3>
              </div>
              <button
                onClick={() => setShowActiveModal(false)}
                className="p-2 hover:bg-amber-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-amber-700" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {entries.filter(item => item.status === 'Ativo').length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Não há terceiros no local no momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {entries.filter(item => item.status === 'Ativo').map(entry => {
                    const displayPhotoUrl = entry.photoUrl || entry.photoBase64;
                    const checkInDate = new Date(entry.checkInTime);
                    const diffMs = new Date().getTime() - checkInDate.getTime();
                    const diffMins = Math.floor(Math.max(0, diffMs) / 60000);
                    const hours = Math.floor(diffMins / 60);
                    const mins = diffMins % 60;
                    const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                    
                    return (
                      <div key={entry.id} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
                        {displayPhotoUrl ? (
                          <img src={displayPhotoUrl.startsWith('data:image') ? displayPhotoUrl : getAssetUrl(displayPhotoUrl)} alt={entry.name} className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                            <Users className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate" title={entry.name}>{entry.name}</p>
                          <p className="text-xs text-slate-500 font-medium truncate mb-2" title={entry.company}>{entry.company}</p>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 flex items-center gap-1.5 truncate" title={entry.destination}>
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{entry.destination}</span>
                            </p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1.5 truncate" title={entry.authorizedBy}>
                              <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">Aut: {entry.authorizedBy}</span>
                            </p>
                            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100">
                              <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1.5">
                                <Clock className="w-3 h-3 shrink-0" />
                                Entrada: {checkInDate.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                              </p>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 font-bold" title="Tempo no local">
                                {durationStr}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end sticky bottom-0">
              <button
                onClick={() => setShowActiveModal(false)}
                className="px-5 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Entradas Hoje */}
      {showTodayModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-purple-50 border-b border-purple-100 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <LogIn className="w-6 h-6 text-purple-600" />
                <h3 className="font-bold text-purple-800 text-lg">
                  Entradas Registradas Hoje
                </h3>
              </div>
              <button
                onClick={() => setShowTodayModal(false)}
                className="p-2 hover:bg-purple-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-purple-700" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {entries.filter(item => new Date(item.checkInTime).toDateString() === new Date().toDateString()).length === 0 ? (
                <div className="text-center py-12">
                  <LogIn className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Nenhuma entrada registrada hoje.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {entries.filter(item => new Date(item.checkInTime).toDateString() === new Date().toDateString()).map(entry => {
                    const displayPhotoUrl = entry.photoUrl || entry.photoBase64;
                    const isAtivo = entry.status === 'Ativo';
                    return (
                      <div key={entry.id} className={`bg-white border ${isAtivo ? 'border-amber-200' : 'border-slate-200'} rounded-xl p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden`}>
                        {isAtivo && (
                          <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden z-0">
                            <div className="bg-amber-100 text-amber-700 text-[8px] font-bold uppercase tracking-wider py-1 w-24 text-center absolute top-3 -right-6 rotate-45 shadow-sm">
                              No Local
                            </div>
                          </div>
                        )}
                        {displayPhotoUrl ? (
                          <img src={displayPhotoUrl.startsWith('data:image') ? displayPhotoUrl : getAssetUrl(displayPhotoUrl)} alt={entry.name} className={`w-12 h-12 rounded-full object-cover border ${isAtivo ? 'border-amber-300' : 'border-slate-200'} shadow-sm shrink-0 z-10 relative`} />
                        ) : (
                          <div className={`w-12 h-12 rounded-full ${isAtivo ? 'bg-amber-50 border-amber-200' : 'bg-slate-100 border-slate-200'} flex items-center justify-center border shrink-0 z-10 relative`}>
                            <Users className={`w-6 h-6 ${isAtivo ? 'text-amber-400' : 'text-slate-400'}`} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 z-10 relative">
                          <p className="font-bold text-slate-800 text-sm truncate pr-4" title={entry.name}>{entry.name}</p>
                          <p className="text-xs text-slate-500 font-medium truncate mb-2" title={entry.company}>{entry.company}</p>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 flex items-center gap-1.5 truncate" title={entry.destination}>
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{entry.destination}</span>
                            </p>
                            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100">
                              <p className="text-[10px] text-purple-600 font-semibold flex items-center gap-1.5">
                                <LogIn className="w-3 h-3 shrink-0" />
                                Entrada: {new Date(entry.checkInTime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                              </p>
                              {!isAtivo && entry.checkOutTime && (
                                <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1.5">
                                  <LogOut className="w-3 h-3 shrink-0" />
                                  Saída: {new Date(entry.checkOutTime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end sticky bottom-0">
              <button
                onClick={() => setShowTodayModal(false)}
                className="px-5 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Terceiros Banidos */}
      {showBannedModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-red-600" />
                <h3 className="font-bold text-red-800 text-lg">
                  Terceiros Banidos do Local
                </h3>
              </div>
              <button
                onClick={() => setShowBannedModal(false)}
                className="p-2 hover:bg-red-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-red-700" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {profiles.filter(p => p.isBanned).length === 0 ? (
                <div className="text-center py-12">
                  <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Não há terceiros banidos no momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profiles.filter(p => p.isBanned).map(profile => {
                    const displayPhotoUrl = profile.photoUrl || profile.photoBase64;
                    return (
                      <div key={profile.id} className="bg-white border border-red-200 rounded-xl p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
                        {displayPhotoUrl ? (
                          <img src={displayPhotoUrl.startsWith('data:image') ? displayPhotoUrl : getAssetUrl(displayPhotoUrl)} alt={profile.name} className="w-12 h-12 rounded-full object-cover border border-red-200 shadow-sm shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center border border-red-200 shrink-0">
                            <ShieldAlert className="w-6 h-6 text-red-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate" title={profile.name}>{profile.name}</p>
                          <p className="text-xs text-slate-500 font-medium truncate mb-2" title={profile.company}>{profile.company}</p>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 flex items-center gap-1.5 truncate">
                              <span className="font-mono text-xs">{profile.document}</span>
                            </p>
                            <div className="flex flex-col mt-1.5 pt-1.5 border-t border-red-100">
                              <p className="text-[10px] text-red-600 font-bold mb-1">Motivo do Banimento:</p>
                              <p className="text-xs text-red-700 italic line-clamp-2" title={profile.banReason || 'Motivo não informado'}>
                                {profile.banReason || 'Motivo não informado'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end sticky bottom-0">
              <button
                onClick={() => setShowBannedModal(false)}
                className="px-5 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-800 text-white">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-lg">Importar Cadastros (CSV)</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm mb-6 flex items-start gap-3 border border-blue-100">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Formato do Arquivo (.csv)</p>
                  <p className="text-blue-700/80">O arquivo deve ser separado por ponto-e-vírgula (;) contendo os cabeçalhos das documentações na primeira linha.</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Arquivo CSV</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-xl file:border-0
                      file:text-sm file:font-semibold
                      file:bg-purple-50 file:text-purple-700
                      hover:file:bg-purple-100 transition-all
                      border border-slate-200 rounded-xl bg-slate-50 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleImportSubmit}
                  disabled={!importFile || isImporting}
                  className="px-5 py-2.5 text-sm font-semibold bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-purple-600/20"
                >
                  {isImporting ? 'Importando...' : 'Iniciar Importação'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Desbanimento */}
      {showUnbanModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-emerald-600" />
              <h3 className="font-bold text-emerald-800 text-lg">
                Remover Proibição
              </h3>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Você está prestes a remover o banimento deste terceiro. É necessário registrar o motivo e o nome de quem autorizou a liberação.
              </p>

              <form id="unbanForm" onSubmit={(e) => { e.preventDefault(); handleSubmitProfile(); }} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Autorizado por *</label>
                  <input
                    type="text"
                    required
                    value={unbanAuthorizer}
                    onChange={e => setUnbanAuthorizer(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
                    placeholder="Nome do diretor/gerente..."
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Motivo da Liberação *</label>
                  <textarea
                    required
                    value={unbanReason}
                    onChange={e => setUnbanReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none bg-white min-h-[80px] resize-none"
                    placeholder="Por que este terceiro foi liberado novamente?"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => { setShowUnbanModal(false); setUnbanAuthorizer(''); setUnbanReason(''); setIsBanned(true); }}
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    Confirmar Liberação
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAdminWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <h3 className="font-bold text-orange-800 text-lg">Atenção!</h3>
              </div>
              <button onClick={() => setShowAdminWarning(false)} className="p-2 hover:bg-orange-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-orange-700" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-700 text-sm leading-relaxed mb-6 font-medium">
                O Prestador de Serviço Administrativo fica restrito exclusivamente a ambientes de escritório/administrativos. 
                <br/><br/>
                Por não exigir ASO, NRs e Treinamentos de segurança, é expressamente <strong className="text-red-600">proibido</strong> o acesso deste terceiro a áreas de risco, chão de fábrica ou atividades perigosas.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTimeout(() => setShowAdminWarning(false), 150);
                  }}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md shadow-orange-500/20 active:scale-95 transition-all w-full"
                >
                  Estou Ciente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`rounded-xl shadow-xl border p-4 flex items-start gap-3 w-80 
            ${toastMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 
              toastMessage.type === 'warning' ? 'bg-yellow-50 border-yellow-200' : 
              'bg-red-50 border-red-200'}`}
          >
            <div className={`mt-0.5 shrink-0 ${toastMessage.type === 'success' ? 'text-emerald-500' : toastMessage.type === 'warning' ? 'text-yellow-500' : 'text-red-500'}`}>
              {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
               toastMessage.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : 
               <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <h4 className={`text-sm font-bold ${toastMessage.type === 'success' ? 'text-emerald-800' : toastMessage.type === 'warning' ? 'text-yellow-800' : 'text-red-800'}`}>
                {toastMessage.title}
              </h4>
              <p className={`text-xs mt-0.5 ${toastMessage.type === 'success' ? 'text-emerald-600' : toastMessage.type === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
                {toastMessage.message}
              </p>
            </div>
            <button 
              onClick={() => setToastMessage(null)}
              className="ml-auto text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* Modal - Cadastrar Empresa Rápido */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">
                Cadastrar Nova Empresa
              </h3>
              <button
                type="button"
                onClick={() => setShowCompanyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome Fantasia *</label>
                  <input type="text" required value={newCompName} onChange={(e) => setNewCompName(e.target.value)} placeholder="Ex: Elevadores Tech" className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Razão Social *</label>
                  <input type="text" required value={newCompCorporateName} onChange={(e) => setNewCompCorporateName(e.target.value)} placeholder="Ex: Elevadores Tech Ltda" className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">CNPJ (Opcional)</label>
                  <input type="text" value={newCompCnpj} onChange={(e) => setNewCompCnpj(e.target.value)} placeholder="00.000.000/0000-00" className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Área / Setor *</label>
                  <SearchableSectorSelect
                    value={newCompActivityArea}
                    onChange={setNewCompActivityArea}
                    options={sectorOptions}
                    placeholder="Ex: Manutenção"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Telefone</label>
                  <input type="text" value={newCompPhone} onChange={(e) => setNewCompPhone(e.target.value)} placeholder="(00) 00000-0000" className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">E-mail</label>
                  <input type="email" value={newCompEmail} onChange={(e) => setNewCompEmail(e.target.value)} placeholder="contato@empresa.com" className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contato</label>
                  <input type="text" value={newCompManager} onChange={(e) => setNewCompManager(e.target.value)} placeholder="Nome" className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status *</label>
                  <select value={newCompStatus} onChange={(e) => setNewCompStatus(e.target.value as 'Ativo' | 'Inativo')} className="w-full border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all">
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowCompanyModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition-all text-sm">Cancelar</button>
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-purple-500/20 text-sm">Cadastrar Empresa</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Alert Modal */}
      {alertModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setAlertModal(null)}></div>
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative z-10 transform transition-all animate-in fade-in zoom-in duration-200">
            <div className={`p-6 flex flex-col items-center text-center ${
              alertModal.type === 'error' ? 'bg-red-50' : 
              alertModal.type === 'warning' ? 'bg-amber-50' : 
              'bg-emerald-50'
            }`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                alertModal.type === 'error' ? 'bg-red-100 text-red-600' : 
                alertModal.type === 'warning' ? 'bg-amber-100 text-amber-600' : 
                'bg-emerald-100 text-emerald-600'
              }`}>
                {alertModal.type === 'error' ? <AlertCircle className="w-8 h-8" /> : 
                 alertModal.type === 'warning' ? <AlertTriangle className="w-8 h-8" /> : 
                 <CheckCircle2 className="w-8 h-8" />}
              </div>
              <h3 className={`text-xl font-bold mb-2 ${
                alertModal.type === 'error' ? 'text-red-800' : 
                alertModal.type === 'warning' ? 'text-amber-800' : 
                'text-emerald-800'
              }`}>
                {alertModal.title}
              </h3>
              <p className={`text-sm font-medium ${
                alertModal.type === 'error' ? 'text-red-600' : 
                alertModal.type === 'warning' ? 'text-amber-600' : 
                'text-emerald-600'
              }`}>
                {alertModal.message}
              </p>
            </div>
            <div className="p-4 bg-white">
              <button
                onClick={() => setAlertModal(null)}
                className={`w-full font-bold py-3 rounded-xl transition-all ${
                  alertModal.type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30' : 
                  alertModal.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30' : 
                  'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30'
                }`}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
