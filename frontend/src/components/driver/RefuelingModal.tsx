import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, MapPin, AlertCircle } from 'lucide-react';
import api from '@/services/api';

const refuelingSchema = z.object({
  current_km: z.coerce.number().min(0, 'KM inválido'),
  liters: z.coerce.number().min(0.1, 'Deve ser maior que zero'),
  total_cost: z.coerce.number().min(0.1, 'Deve ser maior que zero')
});

type RefuelingForm = z.infer<typeof refuelingSchema>;

interface RefuelingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentKm: number;
}

export default function RefuelingModal({ isOpen, onClose, onSuccess, currentKm }: RefuelingModalProps) {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting }, reset } = useForm<RefuelingForm>({
    resolver: zodResolver(refuelingSchema) as any,
    defaultValues: {
      current_km: currentKm,
      liters: '' as any,
      total_cost: '' as any
    }
  });

  // Fetch location when modal opens
  useEffect(() => {
    if (isOpen) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            setLocError(null);
          },
          (error) => {
            console.error('Error getting location', error);
            setLocError('Não foi possível obter a localização. Certifique-se de que o GPS está ativo e permitido.');
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setLocError('Geolocalização não é suportada por este navegador.');
      }
    } else {
      // Reset state when closed
      setLocation(null);
      setLocError(null);
      reset();
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: RefuelingForm) => {
    if (!location) {
      alert('É obrigatório estar com o GPS ativado e capturado para registrar o abastecimento.');
      return;
    }

    try {
      const payload = {
        ...data,
        latitude: location.lat,
        longitude: location.lng
      };
      
      await api.post('/driver/refueling', payload);
      alert('Abastecimento registrado com sucesso!');
      onSuccess();
    } catch (error: any) {
      console.error('Error saving refueling:', error);
      alert(error.response?.data?.detail || 'Erro ao registrar abastecimento.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 fade-in duration-300 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Registrar Abastecimento</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit as any)} className="p-6 overflow-y-auto flex-1">
          
          {/* Location Status */}
          <div className={`flex items-center gap-2 p-3 rounded-xl mb-6 text-sm font-medium ${location ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {location ? (
              <><MapPin className="w-4 h-4" /> Localização GPS capturada</>
            ) : (
              <><AlertCircle className="w-4 h-4" /> {locError || 'Buscando localização...'}</>
            )}
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Odômetro Atual (km)</label>
              <input 
                type="number" 
                step="0.1" 
                {...register('current_km')} 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-4 text-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 transition-all" 
              />
              {errors.current_km && <p className="text-red-500 text-xs mt-1">{errors.current_km.message}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Litros</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  {...register('liters')} 
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val) {
                      setValue('liters', (Number(val) / 100).toFixed(2) as any, { shouldValidate: true });
                    } else {
                      setValue('liters', '' as any);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-4 text-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 transition-all" 
                  placeholder="0.00"
                />
                {errors.liters && <p className="text-red-500 text-xs mt-1">{errors.liters.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor Total (R$)</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  {...register('total_cost')} 
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val) {
                      setValue('total_cost', (Number(val) / 100).toFixed(2) as any, { shouldValidate: true });
                    } else {
                      setValue('total_cost', '' as any);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-4 text-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 transition-all" 
                  placeholder="0.00"
                />
                {errors.total_cost && <p className="text-red-500 text-xs mt-1">{errors.total_cost.message}</p>}
              </div>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting || !location} 
            className="w-full py-4 bg-slate-900 text-white text-lg font-bold rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-70 flex justify-center items-center"
          >
            {isSubmitting ? 'Salvando...' : (!location ? 'Aguardando GPS...' : 'Confirmar Abastecimento')}
          </button>
        </form>
      </div>
    </div>
  );
}
