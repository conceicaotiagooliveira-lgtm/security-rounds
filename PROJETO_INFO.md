# 📋 Informações do Projeto — SGP Florestal

> [!IMPORTANT]
> **TODOS os agentes (subagentes) DEVEM ler este arquivo ANTES de fazer qualquer alteração no projeto.**

---

## 🌐 Ambiente de Produção

| Item                | Valor                                      |
| ------------------- | ------------------------------------------ |
| **URL de Produção** | `https://sgp.florestal.com/`               |
| **IP do Servidor**  | `192.168.0.53`                             |
| **Banco de Dados**  | SQLite local no servidor `192.168.0.53`    |
| **Backend (API)**   | FastAPI — porta `5011`                     |
| **Frontend (Vite)** | Vite dev server — porta `5186`             |
| **PWA**             | Ativado (Service Worker + manifest)        |

> [!CAUTION]
> O app **NÃO roda em localhost**. Ele roda no servidor `192.168.0.53` e é acessado via `https://sgp.florestal.com/`.
> Nunca assuma que o ambiente é local. Todas as URLs de API usam caminhos relativos (`/api/...`).

---

## 📁 Estrutura do Projeto

```
/Server_vite/FrotaPatrimonial/
├── backend/                  # FastAPI (Python)
│   ├── app/
│   │   ├── api/              # Endpoints e routers
│   │   ├── models/           # Modelos SQLAlchemy
│   │   ├── schemas/          # Schemas Pydantic
│   │   ├── database/         # Configuração do BD
│   │   └── main.py           # Entry point do FastAPI
│   ├── venv/                 # Virtual environment Python
│   └── backend.log           # Log do backend
├── frontend/                 # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/            # Páginas da aplicação
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── services/         # API services (axios)
│   │   ├── store/            # Zustand stores
│   │   └── main.tsx          # Entry point do React
│   ├── public/               # Assets estáticos (ícones PWA)
│   ├── dist/                 # Build de produção (gerado)
│   ├── vite.config.ts        # Configuração do Vite
│   ├── build.log             # Log do último build
│   └── frontend.log          # Log do frontend
├── fleet.sh                  # Script de controle (start/stop/restart/status)
└── PROJETO_INFO.md           # ← ESTE ARQUIVO
```

---

## 🚀 Como Reiniciar os Serviços

> [!CAUTION]
> **AGENTES NÃO DEVEM EXECUTAR `./fleet.sh restart` DIRETAMENTE.**
> Quando o agente roda esse comando, ele roda dentro de um sandbox que não afeta o servidor real.
> **Sempre peça ao USUÁRIO para reiniciar manualmente** com o comando abaixo:

```bash
cd /Server_vite/FrotaPatrimonial
./fleet.sh restart
```

O script `fleet.sh` faz:
1. Para o backend e frontend
2. Inicia o backend (uvicorn na porta 5011)
3. Executa `vite build` para gerar a build de produção
4. Inicia o frontend (vite dev server na porta 5186)

---

## ⚠️ Problemas Conhecidos

### Permissão de arquivos na pasta `dist/` e `node_modules/.vite/`
- A pasta `dist/` e `node_modules/.vite/deps/` podem ter arquivos com permissão travada.
- Se o build falhar com `EACCES: permission denied`, a solução é usar o `cacheDir` alternativo no `vite.config.ts` (já configurado como `.vite-cache`).
- Caso o `dist/` esteja travado, é necessário pedir ao usuário para liberar as permissões manualmente ou usar `sudo`.

### PWA / Service Worker
- O Service Worker é registrado automaticamente quando o app roda em domínios que **não são localhost**.
- Em localhost, o SW é desregistrado para evitar problemas de cache durante o desenvolvimento.
- O manifest PWA está configurado com `display: standalone` para funcionar como app nativo.

---

## 📌 Regras para Agentes

1. **Sempre leia este arquivo** antes de iniciar qualquer tarefa.
2. **Nunca assuma localhost** — o servidor é `192.168.0.53`.
3. **Sempre use caminhos relativos** para chamadas de API (`/api/...`).
4. **⛔ NUNCA execute `./fleet.sh restart`** — peça ao usuário para reiniciar manualmente.
5. **Após alterações**, informe ao usuário: _"Por favor, execute `./fleet.sh restart` no servidor para aplicar as mudanças."_
6. **Verifique `build.log`** após o restart para garantir que o build passou.
7. **Não delete `node_modules/`** — a reinstalação pode demorar muito.
8. **Cuidado com a pasta `dist/`** — pode ter problemas de permissão.
