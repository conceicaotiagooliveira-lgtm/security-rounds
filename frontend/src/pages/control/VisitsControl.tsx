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
  ChevronDown
} from 'lucide-react';
import api, { getAssetUrl } from '@/services/api';
import { visitsApi } from '../../api/visitsApi';
import { companyApi } from '../../api/companyApi';
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
            }}
            className="w-full text-left px-3 py-2.5 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors border-t border-purple-100"
          >
            + Adicionar Empresa
          </button>
        </div>
      )}
    </div>
  );
};export const parseLocalDate = (dateStr?: string) => {
  if (!dateStr || dateStr.trim() === '') return new Date(0);
  if (dateStr.includes('T')) return new Date(dateStr);
  return new Date(dateStr + 'T12:00:00');
};

interface VisitEntry {
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
  status: 'Ativo' | 'Concluído';
  
  // Compliance
  photoBase64?: string;
  photoUrl?: string;
  photoDate?: string;
}

interface DocumentHistoryEntry {
  type: string;
  previousDate: string;
  newDate: string;
  updatedAt: string;
}

interface VisitProfile {
  id: string;
  name: string;
  company: string;
  document: string;
  vehiclePlate?: string;
  photoBase64?: string;
  photoUrl?: string;
  photoDate?: string;
  isBanned?: boolean;
  banReason?: string;
  documentHistory?: DocumentHistoryEntry[];
  visitHistory?: VisitHistoryEntry[];
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

export default function VisitsControl() {
  const { user } = useAuthStore();
  const canDeleteThirdParty = user?.role === 'Administrador' || user?.permissions?.includes('delete_visit');
  
  const [entries, setEntries] = useState<VisitEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('No Local');


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
  const [editingEntry, setEditingEntry] = useState<VisitEntry | null>(null);
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
  const [company, setCompany] = useState('');
  const [document, setDocument] = useState('');
  

  const [vehiclePlate, setVehiclePlate] = useState('');
  const [reason, setReason] = useState('');
  const [destination, setDestination] = useState('');
  const [authorizedBy, setAuthorizedBy] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Safety states

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState('');
  
  // Unban interception state
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [unbanReason, setUnbanReason] = useState('');
  const [unbanAuthorizer, setUnbanAuthorizer] = useState('');



  // Webcam states
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [photoDateStr, setPhotoDateStr] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [photoValidityDays, setPhotoValidityDays] = useState(365);

  // Profiles and active selections
  const [profiles, setProfiles] = useState<VisitProfile[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<VisitProfile | null>(null);
  const [profileTab, setProfileTab] = useState<'cadastro' | 'historico'>('cadastro');
  const [historyDocFilter, setHistoryDocFilter] = useState('');
  
  // Quick Check-In and Renewal states
  const [showQuickCheckInModal, setShowQuickCheckInModal] = useState(false);
  const [selectedProfileForCheckIn, setSelectedProfileForCheckIn] = useState<VisitProfile | null>(null);

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
      const newCompany = await companyApi.create({
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
      setIsCustom(false);
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
        setIsBanned(existing.isBanned || false);
        setBanReason(existing.banReason || '');
        
        setPhotoDataUrl(existing.photoUrl || existing.photoBase64 || '');
        setPhotoDateStr(existing.photoDate || '');
        setEditingProfile(existing);
        
        showToast('Cadastro Encontrado', 'Os dados do visitante foram preenchidos automaticamente.', 'success');
      }
    }
  }, [document, showProfileModal, profiles, editingProfile, companiesList]);

  const loadData = async () => {
    // Fetch companies independently
    try {
      const cos = await companyApi.getCompanies();
      setCompaniesList(cos);
    } catch (e) {
      console.error('Failed to fetch companies', e);
      setCompaniesList([]);
    }

    // Fetch visits data
    try {
      const [entriesRes, profilesRes, configsRes] = await Promise.all([
        visitsApi.getEntries(),
        visitsApi.getProfiles(),
        visitsApi.getConfigs()
      ]);
      setEntries(entriesRes);
      setProfiles(profilesRes);
      
      const validityConfig = configsRes.find((c: any) => c.id === 'photo_validity_days');
      if (validityConfig) setPhotoValidityDays(validityConfig.value);
    } catch (error) {
      console.error('Error loading visits data:', error);
      // Optional: showToast('Erro', 'Não foi possível carregar os dados de visitantes', 'error');
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

  const saveEntries = (newEntries: VisitEntry[]) => {
    setEntries(newEntries);
  };

  const saveProfiles = (newProfiles: VisitProfile[]) => {
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
    if (updatedProfile) await visitsApi.saveProfile(updatedProfile);
  };

  const updateProfileCheckOut = async (document: string, checkOutTime: string, entry: VisitEntry) => {
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
    if (updatedProfile) await visitsApi.saveProfile(updatedProfile);
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

    setIsBanned(false);
    setBanReason('');
    setValidationError(null);
    setPhotoDataUrl('');
    setPhotoDateStr('');
    closeCamera();
    setShowProfileModal(true);
  };

  const handleOpenProfileEdit = (profile: VisitProfile, defaultTab: 'cadastro' | 'historico' = 'cadastro') => {
    setProfileTab(defaultTab);
    setEditingProfile(profile);
    setName(profile.name);
    
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
    setIsBanned(profile.isBanned || false);
    setBanReason(profile.banReason || '');
    
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
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (editingProfile?.isBanned && !isBanned && !unbanReason) {
      setShowUnbanModal(true);
      return;
    }


    const documentHistory: DocumentHistoryEntry[] = editingProfile ? (editingProfile.documentHistory || []) : [];
    const nowStr = new Date().toLocaleString('pt-BR');

    if (editingProfile) {
      if (editingProfile.isBanned && !isBanned && unbanReason && unbanAuthorizer) {
        documentHistory.push({ type: 'Desbanimento', previousDate: 'Banido', newDate: 'Liberado', updatedAt: `${nowStr} - Liberado por: ${user?.name || 'Administrador'}. Autorizado por: ${unbanAuthorizer}. Motivo: ${unbanReason}` });
      }

      const updated = profiles.map(p => {
        if (p.id === editingProfile.id) {
          return { ...p, name, company: targetCompany, document, vehiclePlate: vehiclePlate || undefined, photoBase64: photoDataUrl || undefined, photoDate: photoDataUrl ? photoDateStr : undefined, documentHistory, isBanned, banReason };
        }
        return p;
      });
      // Save optimistically, then update with real data from backend
      saveProfiles(updated);
      const savedProfile = await visitsApi.saveProfile(updated.find(p => p.id === editingProfile.id));
      saveProfiles(profiles.map(p => p.id === savedProfile.id ? savedProfile : p));
      
      showToast('Sucesso!', 'Cadastro SESMT atualizado com sucesso.', 'success');
      setShowProfileModal(false);
      setShowUnbanModal(false);
      setUnbanReason('');
      setUnbanAuthorizer('');
    } else {
      const existingProfile = profiles.find(p => p.document === document);
      const tempId = existingProfile ? existingProfile.id : Date.now().toString();
      
      const newProfile: VisitProfile = {
        id: tempId,
        name,
        company: targetCompany,
        document,
        vehiclePlate: vehiclePlate || undefined,

        photoBase64: photoDataUrl || undefined,
        photoDate: photoDataUrl ? photoDateStr : undefined,
        documentHistory: existingProfile ? (existingProfile.documentHistory || []) : [],
        isBanned,
        banReason
      };
      
      // Optimistic update - filter out the old one if it existed so we don't duplicate
      const otherProfiles = profiles.filter(p => p.id !== tempId && p.document !== document);
      saveProfiles([newProfile, ...otherProfiles]);
      
      const savedProfile = await visitsApi.saveProfile(newProfile);
      
      // Real update from backend to get photoUrl
      // Ensure we remove both the temporary optimistic one AND any old profile with the same document
      const cleanedProfiles = profiles.filter(p => p.id !== savedProfile.id && p.id !== tempId && p.document !== savedProfile.document);
      saveProfiles([savedProfile, ...cleanedProfiles]);
      setShowProfileModal(false);

      // Only proceed to check-in if documents are valid
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const expiredItems: string[] = [];
      
      if (!photoDateStr) expiredItems.push('Foto Pendente');
      else {
        const pDate = new Date(photoDateStr);
        const expDate = new Date(pDate.getTime() + photoValidityDays * 24 * 60 * 60 * 1000);
        expDate.setHours(23, 59, 59, 999);
        if (expDate < today) expiredItems.push('Foto Vencida');
      }



      if (expiredItems.length > 0) {
        showToast('Atenção', 'Cadastro salvo na base, mas entrada bloqueada.', 'warning');
        
        const newBlockedEntry: VisitEntry = {
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
          photoUrl: savedProfile.photoUrl,
          photoDate: savedProfile.photoDate,
          photoBase64: savedProfile.photoBase64
        };
        
        visitsApi.saveEntry(newBlockedEntry).then(savedEntry => {
          setEntries(prev => [savedEntry, ...prev]);
        });

        setTimeout(() => {
          alert(`CADASTRO SALVO NA BASE DE DADOS\n\nAtenção: O visitante foi salvo, porém a Entrada foi BLOQUEADA pois os seguintes itens estão ausentes ou vencidos:\n\n${expiredItems.join(', ')}\n\nO registro aparecerá na tela com o status 'Bloqueado'. Você poderá editá-lo posteriormente buscando o CPF ou clicando em Editar.`);
        }, 100);
      } else {
        showToast('Sucesso!', 'Cadastro salvo com sucesso e documentos em dia.', 'success');
        handleProfileCheckIn(savedProfile);
      }
    }
  };

  const handleProfileCheckIn = (profile: VisitProfile) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredItems: string[] = [];

    if (!profile.photoDate) expiredItems.push('Foto Pendente');
    else {
      const pDate = new Date(profile.photoDate);
      const expDate = new Date(pDate.getTime() + photoValidityDays * 24 * 60 * 60 * 1000);
      expDate.setHours(23, 59, 59, 999);
      if (expDate < today) expiredItems.push('Foto Vencida');
    }



    if (expiredItems.length > 0) {
      alert(`Entrada BLOQUEADA — Problemas: ${expiredItems.join(', ')}.\nAtualize a foto ou situação do visitante antes de autorizar a entrada.`);
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
    if (!selectedProfileForCheckIn || !reason || !destination || !authorizedBy) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    const existingEntryIndex = entries.findIndex(entry => entry.document === selectedProfileForCheckIn.document);

    if (existingEntryIndex !== -1) {
      const updatedEntries = [...entries];
      const existingEntry = updatedEntries[existingEntryIndex];
      
      updatedEntries[existingEntryIndex] = {
        ...existingEntry,
        vehiclePlate: vehiclePlate || undefined,
        reason,
        destination,
        authorizedBy,
        checkInTime: new Date().toISOString(),
        checkOutTime: undefined,
        status: 'Ativo'
      };

      const [movedEntry] = updatedEntries.splice(existingEntryIndex, 1);
      saveEntries([movedEntry, ...updatedEntries]);
      await visitsApi.saveEntry(movedEntry);
    } else {
      const newEntry: VisitEntry = {
        id: Date.now().toString(),
        name: selectedProfileForCheckIn.name,
        company: selectedProfileForCheckIn.company,
        document: selectedProfileForCheckIn.document,
        vehiclePlate: vehiclePlate || undefined,
        reason,
        destination,
        authorizedBy,
        checkInTime: new Date().toISOString(),
        status: 'Ativo'
      };
      saveEntries([newEntry, ...entries]);
      await visitsApi.saveEntry(newEntry);
    }

    updateProfileHistory(selectedProfileForCheckIn.document, {
      checkInTime: new Date().toISOString(),
      reason,
      destination,
      authorizedBy
    });

    showToast('Sucesso!', 'Entrada rápida autorizada com sucesso.', 'success');
    setShowQuickCheckInModal(false);
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

    setValidationError(null);
    setPhotoDataUrl('');
    setPhotoDateStr('');
    closeCamera();
    setShowModal(true);
  };

  const handleOpenEdit = (entry: VisitEntry) => {
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
    if (!name || !targetCompany || !document || !reason || !destination || !authorizedBy) {
      alert('Preencha os campos obrigatórios.');
      return;
    }
    // Dates are optional for saving - blocking only happens at entry authorization

    if (editingEntry) {
      const updated = entries.map(item => {
        if (item.id === editingEntry.id) {
          return { ...item, name, company: targetCompany, document, vehiclePlate: vehiclePlate || undefined, reason, destination, authorizedBy, photoBase64: photoDataUrl || undefined, photoDate: photoDataUrl ? photoDateStr : undefined };
        }
        return item;
      });
      saveEntries(updated);
      await visitsApi.saveEntry(updated.find(item => item.id === editingEntry.id));
    } else {
      const existingEntryIndex = entries.findIndex(item => item.document === document);
      
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
          photoBase64: photoDataUrl || undefined,
          photoDate: photoDataUrl ? photoDateStr : undefined
        };
        
        const [movedEntry] = updatedEntries.splice(existingEntryIndex, 1);
        saveEntries([movedEntry, ...updatedEntries]);
        await visitsApi.saveEntry(movedEntry);
      } else {
        const newEntry: VisitEntry = {
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
          photoBase64: photoDataUrl || undefined,
          photoDate: photoDataUrl ? photoDateStr : undefined
        };
        saveEntries([newEntry, ...entries]);
        await visitsApi.saveEntry(newEntry);
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
    let existingProfile = profiles.find(p => p.document === document);
    if (existingProfile) {
      const updatedProfiles = profiles.map(p => {
        if (p.document === document) {
          return {
            ...p,
            photoBase64: photoDataUrl || p.photoBase64,
            photoDate: photoDataUrl ? photoDateStr : p.photoDate
          };
        }
        return p;
      });
      saveProfiles(updatedProfiles);
      await visitsApi.saveProfile(updatedProfiles.find(p => p.document === document));
    } else {
      const newProfile: VisitProfile = {
        id: Date.now().toString() + '_prof',
        name,
        company: targetCompany,
        document,
        vehiclePlate: vehiclePlate || undefined,
        photoBase64: photoDataUrl || undefined,
        photoDate: photoDataUrl ? photoDateStr : undefined,
        documentHistory: []
      };
      saveProfiles([newProfile, ...profiles]);
      await visitsApi.saveProfile(newProfile);
    }
    showToast('Sucesso!', editingProfile ? 'Perfil atualizado com sucesso.' : 'Perfil cadastrado com sucesso.', 'success');
    setShowProfileModal(false);
  };

  const handleCheckOut = async (id: string) => {
    const checkOutStr = new Date().toISOString();
    let targetEntry = null;
    const updated = entries.map(item => {
      if (item.id === id) {
        targetEntry = { ...item, checkOutTime: checkOutStr, status: 'Concluído' as const };
        return targetEntry;
      }
      return item;
    });
    
    if (targetEntry) {
      await updateProfileCheckOut(targetEntry.document, checkOutStr, targetEntry);
      saveEntries(updated);
      await visitsApi.saveEntry(targetEntry);
    }
    showToast('Sucesso!', 'Saída registrada com sucesso.', 'success');
    setConfirmCheckOutId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este registro?')) {
      saveEntries(entries.filter(item => item.id !== id));
      await visitsApi.deleteEntry(id);
    }
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const getComplianceStatus = (entry: VisitEntry) => {
    return { isValid: true, errors: [] };
  };

  const getProfileComplianceForEntry = (entry: VisitEntry) => {
    const profile = profiles.find(p => p.document === entry.document);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiredItems: string[] = [];

    const photoDate = profile ? profile.photoDate : entry.photoDate;

    if (profile && profile.isBanned) {
      return { isValid: false, errors: [`Proibido: ${profile.banReason || 'Motivo não informado'}`], isBanned: true };
    }

    if (!photoDate || photoDate.trim() === '') {
      expiredItems.push('Foto Pendente');
    } else {
      const pDate = new Date(photoDate);
      const expDate = new Date(pDate.getTime() + photoValidityDays * 24 * 60 * 60 * 1000);
      expDate.setHours(23, 59, 59, 999);
      if (expDate < today) expiredItems.push('Foto Vencida');
    }

    return { isValid: expiredItems.length === 0, errors: expiredItems };
  };

  const handleNewEntryFromHistory = (entry: VisitEntry) => {
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
    }
    
    if (!profile.photoDate) expiredItems.push('Foto Pendente');
    else {
      const pDate = new Date(profile.photoDate);
      const expDate = new Date(pDate.getTime() + photoValidityDays * 24 * 60 * 60 * 1000);
      expDate.setHours(23, 59, 59, 999);
      if (expDate < today) expiredItems.push('Foto Vencida');
    }

    if (expiredItems.length > 0) {
      alert(`Entrada BLOQUEADA — Problemas: ${expiredItems.join(', ')}.\nAtualize a foto ou situação do visitante antes de autorizar a entrada.`);
      return;
    }

    handleProfileCheckIn(profile);
  };

  const handleViewHistoryFromEntry = (entry: VisitEntry) => {
    const profile = profiles.find(p => p.document === entry.document);
    if (profile) {
      setHistoryTab('visits');
      handleOpenProfileEdit(profile, 'historico');
    } else {
      alert("Perfil completo não encontrado para este registro histórico.");
    }
  };

  const handleEditProfileFromHistory = (entry: VisitEntry) => {
    const profile = profiles.find(p => p.document === entry.document);
    if (profile) {
      setEditingProfile(profile);
      setName(profile.name);
      setDocument(profile.document);
      setSelectedCompanyId(profile.company);
      setVehiclePlate(profile.vehiclePlate || '');
      setIsBanned(profile.isBanned || false);
      setBanReason(profile.banReason || '');
      
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
      alert("Perfil completo não encontrado para este registro histórico.");
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
    const counts = { 'Todos': 0, 'No Local': 0, 'Concluído': 0, 'Bloqueado': 0 };
    entries.forEach(item => {
      counts['Todos']++;
      let effStatus = item.status;
      if (item.status === 'Bloqueado') {
        const comp = getProfileComplianceForEntry(item);
        if (comp.isValid) effStatus = 'Resolvido';
      }
      if (effStatus === 'Ativo') counts['No Local']++;
      if (effStatus === 'Concluído' || effStatus === 'Resolvido') counts['Concluído']++;
      if (effStatus === 'Bloqueado') counts['Bloqueado']++;
    });
    return counts;
  }, [entries, profiles, photoValidityDays]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Users className="w-8 h-8 text-purple-600" />
            Controle de Visitas
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenProfileRegister}
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            + Nova Visita
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
          onClick={() => { setStatusFilter('Concluído'); }}
          className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm cursor-pointer hover:bg-slate-50 hover:border-emerald-200 transition-all active:scale-95"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Saídas Concluídas</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{entries.filter(item => item.status === 'Concluído').length}</p>
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
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome, documento, empresa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium mr-2">Filtrar:</span>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(['Todos', 'No Local', 'Concluído', 'Bloqueado'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={clsx(
                    'text-xs font-semibold px-3 py-1.5 rounded-lg transition-all',
                    statusFilter === status
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  {status} ({tabCounts[status]})
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {entries.filter(item => {
            const matchesSearch = 
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.document.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (item.vehiclePlate && item.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()));

            let effStatus = item.status;
            if (item.status === 'Bloqueado') {
              const comp = getProfileComplianceForEntry(item);
              if (comp.isValid) effStatus = 'Resolvido';
            }

            const matchesStatus = statusFilter === 'Todos' || 
              (statusFilter === 'No Local' ? effStatus === 'Ativo' : 
               statusFilter === 'Concluído' ? (effStatus === 'Concluído' || effStatus === 'Resolvido') :
               effStatus === statusFilter);

            return matchesSearch && matchesStatus;
          }).length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-medium text-sm">Nenhum registro encontrado</p>
              <p className="text-xs text-slate-400 mt-1">Experimente alterar os filtros de busca ou cadastrar um novo visitante.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-800 border-b border-slate-900 divide-x divide-slate-600 text-white text-[11px] font-extrabold uppercase tracking-wider">
                  <th className="py-2 px-3">Visitante / Empresa</th>
                  <th className="py-2 px-3">Destino / Autorizador</th>
                  <th className="py-2 px-3">Motivo da Visita</th>
                  <th className="py-2 px-3 w-[1%] whitespace-nowrap">Entrada / Saída</th>
                  <th className="py-2 px-3 w-32 whitespace-nowrap">Status</th>
                  <th className="py-2 px-3 text-center w-[1%] whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-300 text-xs text-slate-700 bg-white">
                {entries.filter(item => {
                  const matchesSearch = 
                    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.document.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (item.vehiclePlate && item.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()));

                  let effStatus = item.status;
                  if (item.status === 'Bloqueado') {
                    const comp = getProfileComplianceForEntry(item);
                    if (comp.isValid) effStatus = 'Resolvido';
                  }

                  const matchesStatus = statusFilter === 'Todos' || 
                    (statusFilter === 'No Local' ? effStatus === 'Ativo' : 
                     statusFilter === 'Concluído' ? (effStatus === 'Concluído' || effStatus === 'Resolvido') :
                     effStatus === statusFilter);

                  return matchesSearch && matchesStatus;
                }).map((entry) => {
                  const currentProfile = profiles.find(p => p.document === entry.document);
                  const displayPhotoUrl = currentProfile?.photoUrl || currentProfile?.photoBase64 || entry.photoUrl || entry.photoBase64;
                  
                  return (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors group divide-x-2 divide-slate-300">
                    <td className="py-1.5 px-3">
                      <div className="flex items-center gap-3">
                        {displayPhotoUrl ? (
                          <img src={displayPhotoUrl.startsWith('data:image') ? displayPhotoUrl : getAssetUrl(displayPhotoUrl)} alt={entry.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                            <Users className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">{entry.name}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3.5 h-3.5" />
                            {entry.company}
                          </p>
                          {entry.vehiclePlate && (
                            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                              Placa: {entry.vehiclePlate}
                            </p>
                          )}
                        {(() => {
                          const compliance = getProfileComplianceForEntry(entry);
                          return compliance.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 mt-1.5 shadow-sm">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              Autorizado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 mt-1.5 shadow-sm" title={compliance.errors.join('. ')}>
                              <AlertCircle className="w-3 h-3 text-red-500 animate-pulse" />
                              Bloqueado ({compliance.errors.join(', ')})
                            </span>
                          );
                        })()}
                        </div>
                      </div>
                    </td>
                    <td className="py-1 px-2">
                      <div>
                        <p className="font-medium text-slate-700">{entry.destination}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Aut: {entry.authorizedBy}</p>
                      </div>
                    </td>
                    <td className="py-1 px-2 max-w-[150px]">
                      <p className="truncate text-xs text-slate-500" title={entry.reason}>
                        {(() => {
                          if (entry.status === 'Bloqueado' && entry.reason.startsWith('Bloqueado:')) {
                            const comp = getProfileComplianceForEntry(entry);
                            if (comp.isValid) return "Bloqueio resolvido (Aguardando Nova Entrada)";
                            return `Bloqueado: ${comp.errors.join(', ')}`;
                          }
                          return entry.reason;
                        })()}
                      </p>
                    </td>
                    <td className="py-1.5 px-3 whitespace-nowrap text-xs">
                      <div className="space-y-0.5">
                        <p className="text-emerald-600 font-semibold flex items-center gap-1">
                          <LogIn className="w-3 h-3" />
                          {formatDateTime(entry.checkInTime)}
                        </p>
                        {entry.checkOutTime && (
                          <p className="text-purple-600 font-semibold flex items-center gap-1">
                            <LogOut className="w-3 h-3" />
                            {formatDateTime(entry.checkOutTime)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-1.5 px-3">
                      {(() => {
                        let displayStatus = entry.status;
                        let colorClass = '';

                        if (entry.status === 'Ativo') {
                          displayStatus = 'No Local';
                          colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
                        } else if (entry.status === 'Concluído') {
                          colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        } else if (entry.status === 'Bloqueado') {
                          const comp = getProfileComplianceForEntry(entry);
                          if (comp.isValid) {
                            displayStatus = 'Resolvido';
                            colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
                          } else {
                            colorClass = 'bg-red-50 text-red-700 border-red-200';
                          }
                        }

                        if (displayStatus === 'No Local') {
                          return (
                            <span className="inline-flex items-center justify-center w-6 h-6 text-amber-600 bg-amber-50 rounded-md border border-amber-200 shadow-sm" title="No Local">
                              <MapPin className="w-3.5 h-3.5" />
                            </span>
                          );
                        }

                        return (
                          <span className={clsx(
                            'text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border whitespace-nowrap',
                            colorClass
                          )}>
                            {displayStatus}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-1 px-2 text-center whitespace-nowrap bg-slate-50">
                      <div className="flex items-center justify-end gap-1">
                        {entry.status !== 'Ativo' && (() => {
                          const profileComp = getProfileComplianceForEntry(entry);
                          return profileComp.isValid ? (
                            <button
                              onClick={() => handleNewEntryFromHistory(entry)}
                              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 px-2 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-sm"
                              title="Autorizar Nova Entrada"
                            >
                              <LogIn className="w-4 h-4" />
                              <span className="text-[10px] font-bold">Nova Entrada</span>
                            </button>
                          ) : (
                            <button
                              disabled
                              className="bg-red-50 text-red-400 px-2 py-1.5 rounded-lg cursor-not-allowed opacity-70 flex items-center gap-1 shadow-sm"
                              title={`Entrada BLOQUEADA — Vencido: ${profileComp.errors.join(', ')}`}
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                          );
                        })()}
                        <button
                          onClick={() => handleViewHistoryFromEntry(entry)}
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 p-1.5 rounded-lg transition-all flex items-center justify-center shadow-sm"
                          title="Ver Histórico de Documentos"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditProfileFromHistory(entry)}
                          className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 p-1.5 rounded-lg transition-all flex items-center justify-center shadow-sm"
                          title="Editar Cadastro SESMT"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        {entry.status === 'Ativo' && (
                          <button
                            onClick={() => {
                              setCheckOutPassword('');
                              setCheckOutAuthorizedBy('');
                              setConfirmCheckOutId(entry.id);
                            }}
                            className="bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 p-1.5 rounded-lg transition-all flex items-center justify-center shadow-sm"
                            title="Registrar Saída"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(entry)}
                          className="hidden bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 p-1.5 rounded-lg transition-all flex items-center justify-center shadow-sm"
                          title="Editar Visita"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {canDeleteThirdParty && (
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 p-1.5 rounded-lg transition-all flex items-center justify-center shadow-sm"
                            title="Excluir Visita"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal - Registrar / Editar Entrada (LEGADO) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingEntry ? 'Editar Registro de Visitante' : 'Registrar Entrada de Visitante'}
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Empresa *
                    </label>
                  </div>
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
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Ex: Bloco B Apto 104, TI"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
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
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-purple-500/20 text-sm"
                >
                  {editingEntry ? 'Salvar Alterações' : 'Confirmar Entrada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* 1. Modal - Cadastrar / Editar Perfil de Visitante */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="px-6 pt-4 bg-slate-50 border-b border-slate-150 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-lg">
                  {editingProfile ? 'Editar Perfil do Visitante' : 'Cadastrar Visitante (SESMT)'}
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

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">Empresa *</label>
                    </div>
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
                          placeholder="Justifique o motivo pelo qual este visitante está proibido de entrar na empresa..."
                        />
                      </div>
                    )}
                  </div>

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
                                  <td className="px-6 py-3.5 text-slate-500 font-mono text-xs">{entry.updatedAt}</td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      )
                    ) : (() => {
                      const activeEntry = entries.find(e => e.document === editingProfile?.document && e.status === 'Ativo');
                      const storedVisits = editingProfile?.visitHistory || [];
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
                              {historyDateFilter ? 'Tente limpar o filtro de data para ver o histórico completo.' : 'O histórico de entradas deste visitante aparecerá aqui.'}
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
                                  {new Date(visit.checkInTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-6 py-3.5 text-purple-700 bg-purple-50/30 font-medium">
                                  {visit.checkOutTime ? new Date(visit.checkOutTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
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
                  {editingProfile ? 'Salvar Alterações' : 'Cadastrar Visitante'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal - Quick Check-in de Visitante */}
      {showQuickCheckInModal && selectedProfileForCheckIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <h3 className="font-bold text-emerald-800 text-lg flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Autorizar Entrada de Visitante
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
                    <input
                      type="text"
                      required
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
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
                className="px-6 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95"
              >
                Confirmar Entrada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal - Renovação de Documentos Vencidos */}

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
                Deseja registrar a saída deste visitante? Ele deixará de aparecer na lista de ativos e a visita será concluída no histórico.
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

      {/* Modal Visitantes no Local */}
      {showActiveModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-amber-600 animate-pulse" />
                <h3 className="font-bold text-amber-800 text-lg">
                  Visitantes no Local (Ativos)
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
                  <p className="text-slate-500 font-medium">Não há visitantes no local no momento.</p>
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

      {/* Modal Visitantes Banidos */}
      {showBannedModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-red-600" />
                <h3 className="font-bold text-red-800 text-lg">
                  Visitantes Banidos do Local
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
                  <p className="text-slate-500 font-medium">Não há visitantes banidos no momento.</p>
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
                Você está prestes a remover o banimento deste visitante. É necessário registrar o motivo e o nome de quem autorizou a liberação.
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
                    placeholder="Por que este visitante foi liberado novamente?"
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
                  <input type="text" required value={newCompActivityArea} onChange={(e) => setNewCompActivityArea(e.target.value)} placeholder="Ex: Manutenção" className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all" />
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
    </div>
  );
}
