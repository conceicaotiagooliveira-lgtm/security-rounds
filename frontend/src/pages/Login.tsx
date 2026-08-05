import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Lock, User, CheckCircle2, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

import { useState } from 'react';
import api from '@/services/api';
import InstallButton from '@/components/layout/InstallButton';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      setErrorMsg('');
      
      // Limpa qualquer sessão anterior para evitar conflito de tokens
      useAuthStore.getState().logout();
      
      // FastAPI OAuth2PasswordRequestForm needs form data, not JSON
      const formData = new URLSearchParams();
      formData.append('username', data.email);
      formData.append('password', data.password);
      
      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      const token = response.data.access_token;
      
      // Fetch user data
      const userResponse = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      login(token, userResponse.data);
      const redirectPath = userResponse.data.role === 'Motorista' ? '/driver/dashboard' : '/dashboard';
      navigate(redirectPath);
    } catch (err: any) {
      setErrorMsg('Credenciais inválidas. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      
      {/* Left Panel - Dark */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#0f172a] relative overflow-hidden flex-col items-center justify-center text-white p-12">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-900/30 rounded-full blur-[120px]"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.7 }}
          className="relative z-10 flex flex-col items-center text-center max-w-sm"
        >
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-blue-600/20 border-2 border-blue-500/40 flex items-center justify-center mb-8">
            <Truck className="w-10 h-10 text-blue-400" />
          </div>
          
          <h1 className="text-2xl font-bold tracking-wide uppercase mb-3">Frota & Patrimônio</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-10">
            Plataforma completa para gestão de veículos, motoristas e abastecimentos.
          </p>
          
          {/* Feature list */}
          <div className="space-y-4 text-left w-full">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="text-sm text-slate-300">Gestão de Frota e Motoristas</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="text-sm text-slate-300">Controle de Abastecimentos</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="text-sm text-slate-300">Histórico e Relatórios Detalhados</span>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <p className="absolute bottom-6 text-xs text-slate-600">© 2026 Florestal Alimentos</p>
      </div>

      {/* Right Panel - White */}
      <div className="flex-1 flex items-center justify-center bg-white p-8 sm:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="mb-10 flex flex-col items-center text-center">
            <img src="/florestal.png" alt="Florestal Alimentos" className="max-h-40 mb-10 object-contain drop-shadow-sm" />
            <h3 className="text-2xl font-bold text-slate-800">Bem-vindo de volta!</h3>
            <p className="text-sm text-slate-500 mt-1">Por favor, insira suas credenciais para acessar o sistema.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Usuário</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  {...register('email')}
                  className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:text-slate-400"
                  placeholder="Seu nome de usuário ou e-mail"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
            </div>
            
            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  {...register('password')}
                  className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:text-slate-400"
                  placeholder="Sua senha"
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center font-medium border border-red-100">
                {errorMsg}
              </div>
            )}
            
            {/* Submit */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#0f172a] hover:bg-[#1e293b] disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-xl py-3.5 font-semibold text-sm transition-colors shadow-lg shadow-slate-900/10 mt-2"
            >
              {loading ? 'Entrando...' : 'Acessar Sistema'}
            </button>
            
            <div className="flex justify-center mt-4">
              <InstallButton />
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
