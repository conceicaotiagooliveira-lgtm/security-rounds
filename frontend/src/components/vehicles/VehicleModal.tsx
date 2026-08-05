import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Upload } from 'lucide-react';
import api, { getAssetUrl } from '@/services/api';

const vehicleSchema = z.object({
  plate: z.string().min(7, 'A placa é obrigatória'),
  model: z.string().min(2, 'O modelo é obrigatório'),
  brand: z.string().min(2, 'A marca é obrigatória'),
  year: z.coerce.number().min(1900, 'Ano inválido'),
  chassis: z.string().min(5, 'Chassi é obrigatório'),
  renavam: z.string().min(5, 'Renavam é obrigatório'),
  color: z.string().min(2, 'A cor é obrigatória'),
  fuel_type: z.string().min(2, 'Tipo de combustível é obrigatório'),
  tank_capacity: z.coerce.number().min(1, 'Capacidade inválida'),
  expected_kml: z.coerce.number().min(0, 'Consumo médio inválido'),
  current_km: z.coerce.number().min(0, 'Quilometragem inválida'),
  oil_change_interval_km: z.coerce.number().min(0, 'Intervalo inválido').default(10000),
  last_oil_change_km: z.coerce.number().min(0, 'Km inválida').default(0),
  oil_alert_threshold_km: z.coerce.number().min(0, 'Km inválida').default(1000),
  notify_whatsapp_oil: z.boolean().default(false),
  whatsapp_numbers_oil: z.string().nullable().optional(),
  status: z.string(),
  driver_id: z.coerce.number().optional().nullable(),
});

type VehicleForm = z.infer<typeof vehicleSchema>;

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicle?: any;
}

export default function VehicleModal({ isOpen, onClose, onSuccess, vehicle }: VehicleModalProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset, setValue } = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema) as any,
    defaultValues: vehicle || {
      status: 'Ativo',
      current_km: 0,
      tank_capacity: 0,
      expected_kml: 0,
      oil_change_interval_km: 10000,
      last_oil_change_km: 0,
      oil_alert_threshold_km: 1000,
      notify_whatsapp_oil: false,
      whatsapp_numbers_oil: '',
    }
  });

  const notifyWhatsapp = watch('notify_whatsapp_oil');

  useEffect(() => {
    if (isOpen) {
      api.get('/drivers').then(res => {
        setDrivers(res.data);
        if (vehicle) {
          Object.keys(vehicle).forEach((key) => {
            if (key in vehicleSchema.shape) {
              setValue(key as keyof VehicleForm, vehicle[key]);
            }
          });
        }
      }).catch(console.error);
    }
  }, [isOpen, vehicle, setValue]);

  if (!isOpen) return null;

  const onSubmit = async (data: VehicleForm) => {
    try {
      const payload = {
        ...data,
        driver_id: data.driver_id || null
      };

      let savedVehicle;
      if (vehicle) {
        const response = await api.put(`/vehicles/${vehicle.id}`, payload);
        savedVehicle = response.data;
      } else {
        const response = await api.post('/vehicles', payload);
        savedVehicle = response.data;
      }
      
      // Se houver foto selecionada, faz o upload
      if (photoFile && savedVehicle && savedVehicle.id) {
        const formData = new FormData();
        formData.append('file', photoFile);
        await api.post(`/vehicles/${savedVehicle.id}/photo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      setPhotoFile(null);
      reset();
      onSuccess();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('Erro ao salvar veículo. Verifique os dados e tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">
            {vehicle ? 'Editar Veículo' : 'Novo Veículo'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <form id="vehicleForm" onSubmit={handleSubmit(onSubmit as any)}>
            <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Placa</label>
              <input {...register('plate')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-slate-900" placeholder="ABC-1234" />
              {errors.plate && <p className="text-red-500 text-xs mt-1">{errors.plate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
              <input {...register('brand')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-slate-900" placeholder="Ex: Scania" />
              {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
              <input {...register('model')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-slate-900" placeholder="Ex: R450" />
              {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ano</label>
              <input type="number" {...register('year')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-slate-900" placeholder="Ex: 2023" />
              {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Chassi</label>
              <input {...register('chassis')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-slate-900" placeholder="Chassi" />
              {errors.chassis && <p className="text-red-500 text-xs mt-1">{errors.chassis.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Renavam</label>
              <input {...register('renavam')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-slate-900" placeholder="Renavam" />
              {errors.renavam && <p className="text-red-500 text-xs mt-1">{errors.renavam.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cor</label>
              <input {...register('color')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-slate-900" placeholder="Cor" />
              {errors.color && <p className="text-red-500 text-xs mt-1">{errors.color.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Combustível</label>
              <select {...register('fuel_type')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-slate-900">
                <option value="Diesel">Diesel</option>
                <option value="Gasolina">Gasolina</option>
                <option value="Etanol">Etanol</option>
                <option value="Elétrico">Elétrico</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Capacidade Tanque (L)</label>
              <input type="number" step="0.1" {...register('tank_capacity')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-slate-900" placeholder="Ex: 400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Consumo de Fábrica (km/L)</label>
              <input type="number" step="0.1" {...register('expected_kml')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-slate-900" placeholder="Ex: 12.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quilometragem (km)</label>
              <input type="number" step="0.1" {...register('current_km')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-slate-900" placeholder="Ex: 15000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select {...register('status')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-slate-900">
                <option value="Ativo">Ativo</option>
                <option value="Manutenção">Em Manutenção</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Intervalo Troca de Óleo (km)</label>
              <input type="number" step="100" {...register('oil_change_interval_km')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-slate-900" placeholder="Ex: 10000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Km Última Troca</label>
              <input 
                type="number" 
                step="0.1" 
                {...register('last_oil_change_km')} 
                className="w-full bg-slate-100 text-slate-500 border border-slate-200 rounded-xl py-2 px-3 outline-none cursor-not-allowed" 
                placeholder="Ex: 50000" 
                readOnly
                title="Para alterar, use o recurso de Histórico de Troca de Óleo na lista de veículos."
              />
              <p className="text-[10px] text-slate-400 mt-1">Alterado automaticamente pelo Histórico de Óleo</p>
            </div>

            <div className="col-span-2 mt-2 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-amber-900">Alerta de Troca de Óleo</h4>
                  <p className="text-sm text-amber-700">Notificar via WhatsApp quando a quilometragem atual atingir o prazo de troca.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register('notify_whatsapp_oil')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-amber-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-amber-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
              
              <div className="mt-4 pt-4 border-t border-amber-200/50">
                <label className="block text-sm font-medium text-amber-800 mb-1">Avisar com (km) de antecedência</label>
                <input 
                  type="number" 
                  step="10" 
                  {...register('oil_alert_threshold_km')} 
                  className="w-full bg-white border border-amber-300 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-amber-500 text-amber-900 placeholder:text-amber-400" 
                  placeholder="Ex: 1000" 
                />
                <p className="text-xs text-amber-600 mt-1">O sistema começará a avisar quando faltar essa quilometragem, e repetirá a cada 100km excedidos.</p>
              </div>
              
              {notifyWhatsapp && (
                <div className="mt-4 pt-4 border-t border-amber-200/50">
                  <label className="block text-sm font-medium text-amber-800 mb-1">Números de WhatsApp (separados por vírgula)</label>
                  <input 
                    type="text" 
                    {...register('whatsapp_numbers_oil')} 
                    className="w-full bg-white border border-amber-300 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-amber-500 text-amber-900 placeholder:text-amber-400" 
                    placeholder="Ex: 11999999999, 11888888888" 
                  />
                  <p className="text-xs text-amber-600 mt-1">Insira os números com DDD, apenas os dígitos.</p>
                </div>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Motorista Fixo (Uso Exclusivo)</label>
              <select {...register('driver_id')} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-slate-900">
                <option value="">Nenhum (Veículo Disponível para a Frota)</option>
                {drivers?.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.cpf})</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Se preenchido, este veículo não aparecerá na tela de controle da portaria.</p>
            </div>
            
            <div className="col-span-2 mt-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Foto do Veículo</label>
              <div className="flex items-center gap-4 w-full">
                  {(photoFile || vehicle?.photo_url) && (
                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200 shrink-0">
                      <img 
                        src={photoFile ? URL.createObjectURL(photoFile) : vehicle?.photo_url ? getAssetUrl(vehicle.photo_url) : ''} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center flex-1 h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-3 text-slate-400" />
                          <p className="mb-2 text-sm text-slate-500 font-medium text-center">
                            {photoFile ? 'Trocar foto selecionada' : (vehicle?.photo_url ? 'Enviar nova foto' : 'Clique para enviar uma foto')}
                          </p>
                          <p className="text-xs text-slate-500">PNG, JPG ou WEBP</p>
                      </div>
                      <input 
                        id="dropzone-file" 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                      />
                  </label>
              </div>
            </div>
            </div>
          </form>
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 rounded-b-3xl">
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors">
              Cancelar
            </button>
            <button type="submit" form="vehicleForm" disabled={isSubmitting} className="px-5 py-2.5 bg-slate-900 text-white font-medium hover:bg-slate-800 rounded-xl transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-70">
              {isSubmitting ? 'Salvando...' : 'Salvar Veículo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
