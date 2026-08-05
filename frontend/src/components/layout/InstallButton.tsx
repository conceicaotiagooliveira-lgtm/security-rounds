import { Download } from 'lucide-react';
import { useInstallStore } from '../../store/useInstallStore';

export default function InstallButton() {
  const deferredPrompt = useInstallStore(state => state.deferredPrompt);
  const setDeferredPrompt = useInstallStore(state => state.setDeferredPrompt);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Mostra o prompt nativo de instalação
    deferredPrompt.prompt();
    
    // Aguarda a escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('Usuário aceitou a instalação');
    }
    
    // Limpa o prompt pois ele só pode ser usado uma vez
    setDeferredPrompt(null);
  };

  // Se já está instalado ou não suportado, não mostra o botão
  if (!deferredPrompt) return null;

  return (
    <button 
      onClick={handleInstallClick}
      className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg active:scale-95"
    >
      <Download size={18} />
      Instalar App
    </button>
  );
}
