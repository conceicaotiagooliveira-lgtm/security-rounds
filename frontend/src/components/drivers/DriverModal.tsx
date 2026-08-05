import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Upload, User as UserIcon } from 'lucide-react';
import api, { getAssetUrl } from '@/services/api';

const driverSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  cpf: z.string().min(11, 'CPF deve ter no mínimo 11 dígitos').max(14, 'CPF deve ter no máximo 14 dígitos'),
  cnh: z.string().min(5, 'CNH inválida'),
  cnh_expiration: z.string().min(10, 'Data inválida'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  status: z.string().default('Disponível'),
  vehicle_id: z.coerce.number().optional().nullable(),
  user_id: z.coerce.number().optional().nullable(),
});

type DriverForm = z.infer<typeof driverSchema>;

interface DriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  driver?: any;
}

export default function DriverModal({ isOpen, onClose, onSuccess, driver }: DriverModalProps) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasAppAccess, setHasAppAccess] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<DriverForm>({
    resolver: zodResolver(driverSchema) as any,
    defaultValues: {
      status: 'Disponível'
    }
  });

  useEffect(() => {
    if (isOpen) {
      fetchVehiclesAndUsers();
      if (driver) {
        Object.keys(driver).forEach((key) => {
          if (key === 'cnh_expiration' && driver[key]) {
            setValue('cnh_expiration', driver[key].split('T')[0]);
          } else if (key in driverSchema.shape) {
            setValue(key as keyof DriverForm, driver[key]);
          }
        });
        setPhotoPreview(driver.photo_url ? getAssetUrl(driver.photo_url) : null);
      } else {
        reset();
        setPhotoFile(null);
        setPhotoPreview(null);
        setHasAppAccess(false);
        setAccountPassword('');
      }
      
      if (driver?.user_id) {
        setHasAppAccess(true);
      }
    }
  }, [isOpen, driver, reset, setValue]);

  const fetchVehiclesAndUsers = async () => {
    try {
      const [vehRes, userRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/auth/users') // We might need to ensure this endpoint exists, or just do simple users
      ]);
      setVehicles(vehRes.data);
      setUsers(userRes.data);
      
      // Auto-link if driver has email but no user_id
      if (driver && !driver.user_id && driver.email) {
        const matchingUser = userRes.data.find((u: any) => u.email.toLowerCase() === driver.email.toLowerCase());
        if (matchingUser) {
          setValue('user_id', matchingUser.id);
          setHasAppAccess(true);
        }
      }
    } catch (e) {
      console.error("Failed to fetch relations", e);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async (driverId: number) => {
    if (!photoFile) return;
    const formData = new FormData();
    formData.append('file', photoFile);
    await api.post(`/drivers/${driverId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  };

  const onSubmit = async (data: DriverForm) => {
    try {
      if (hasAppAccess) {
        if (!data.email) {
          alert('Email é obrigatório para habilitar o acesso ao app.');
          return;
        }

        if (data.user_id) {
          if (accountPassword) {
            if (accountPassword.length < 6) {
              alert('A senha deve ter pelo menos 6 caracteres.');
              return;
            }
            await api.put(`/auth/users/${data.user_id}`, { password: accountPassword });
          }
        } else {
          const existingUser = users.find(u => u.email.toLowerCase() === data.email!.toLowerCase());
          if (existingUser) {
            data.user_id = existingUser.id;
            if (accountPassword) {
              if (accountPassword.length < 6) {
                alert('A senha deve ter pelo menos 6 caracteres.');
                return;
              }
              await api.put(`/auth/users/${existingUser.id}`, { password: accountPassword });
            }
          } else {
            if (!accountPassword || accountPassword.length < 6) {
              alert('Para liberar um novo acesso, defina uma senha de pelo menos 6 caracteres.');
              return;
            }
            const userRes = await api.post('/auth/register', {
              name: data.name,
              email: data.email,
              password: accountPassword,
              role: 'Motorista'
            });
            data.user_id = userRes.data.id;
          }
        }
      } else {
        data.user_id = null;
      }

      // Clean up empty optional fields
      const payload = {
        ...data,
        vehicle_id: data.vehicle_id || null,
        user_id: data.user_id || null,
        email: data.email || null,
      };

      if (driver?.id) {
        await api.put(`/drivers/${driver.id}`, payload);
        if (photoFile) await uploadPhoto(driver.id);
      } else {
        const response = await api.post('/drivers', payload);
        if (photoFile) await uploadPhoto(response.data.id);
      }
      onSuccess();
    } catch (error: any) {
      console.error('Failed to save driver', error);
      alert(error.response?.data?.detail || 'Erro ao salvar motorista');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {driver ? 'Editar Motorista' : 'Novo Motorista'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="driverForm" onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
            
            {/* Photo Upload Section */}
            <div className="flex justify-center">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 rounded-full border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden group relative"
              >
                {photoPreview ? (
                  <>
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <UserIcon className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-xs text-slate-500 font-medium">Add Foto</span>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoSelect} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <input type="text" {...register('name')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-purple-500 outline-none" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                <input type="text" {...register('cpf')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ex: 123.456.789-00" />
                {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                <input type="text" {...register('phone')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CNH</label>
                <input type="text" {...register('cnh')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-purple-500 outline-none" />
                {errors.cnh && <p className="text-red-500 text-xs mt-1">{errors.cnh.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Validade CNH</label>
                <input type="date" {...register('cnh_expiration')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-purple-500 outline-none" />
                {errors.cnh_expiration && <p className="text-red-500 text-xs mt-1">{errors.cnh_expiration.message as string}</p>}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" {...register('email')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-purple-500 outline-none" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select {...register('status')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-purple-500 outline-none">
                  <option value="Disponível">Disponível</option>
                  <option value="Em Rota">Em Rota</option>
                  <option value="Afastado">Afastado</option>
                  <option value="Férias">Férias</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input type="checkbox" checked={hasAppAccess} onChange={(e) => setHasAppAccess(e.target.checked)} className="rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                  <span className="text-sm font-medium text-slate-700">Habilitar Acesso ao App (Requer Email)</span>
                </label>
              </div>

              {hasAppAccess && (
                <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Senha de Acesso {driver?.user_id ? '(Opcional: preencha apenas se quiser redefinir a senha)' : ''}
                  </label>
                  <input 
                    type="password" 
                    value={accountPassword} 
                    onChange={(e) => setAccountPassword(e.target.value)} 
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-purple-500 outline-none" 
                    placeholder="Mínimo 6 caracteres" 
                  />
                  {driver?.user_id && (
                    <p className="text-xs text-slate-500 mt-2 font-medium">
                      ✓ Este motorista já possui uma conta vinculada ao email dele.
                    </p>
                  )}
                </div>
              )}

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Veículo Alocado</label>
                <select {...register('vehicle_id')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-purple-500 outline-none">
                  <option value="">Sem veículo fixo</option>
                  {vehicles?.map((v) => (
                    <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-full transition-colors">
              Cancelar
            </button>
            <button type="submit" form="driverForm" disabled={isSubmitting} className="px-5 py-2.5 bg-slate-900 text-white font-medium rounded-full shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors disabled:opacity-70">
              {isSubmitting ? 'Salvando...' : 'Salvar Motorista'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
