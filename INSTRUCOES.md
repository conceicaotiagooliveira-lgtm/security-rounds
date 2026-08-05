# 📘 Manual de Instruções: Deploy & Instalação em Novo Servidor

Este manual descreve o passo a passo completo para clonar, configurar e colocar em execução o sistema **Fleet Control (Frota & Controle Patrimonial)** em qualquer novo servidor Linux (Ubuntu/Debian) ou ambiente de produção.

---

## 📋 Pré-requisitos no Novo Servidor

Antes de iniciar a instalação, certifique-se de que o novo servidor possui os seguintes pacotes instalados:

1. **Python 3.9+** e `pip`:
   ```bash
   sudo apt update
   sudo apt install -y python3 python3-pip python3-venv
   ```
2. **Node.js 18+** e `npm`:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```
3. **Servidor MySQL / MariaDB**:
   - Pode estar rodando no próprio servidor ou em um servidor dedicado na rede (ex: `192.168.0.53`).

---

## 🚀 Passo a Passo de Instalação e Deploy

### 1. Clonar o Repositório
Acesse o diretório onde deseja instalar a aplicação (ex: `/var/www/` ou `/opt/`) e clone o repositório:

```bash
git clone <URL_DO_REPOSITORIO> FrotaPatrimonial
cd FrotaPatrimonial
```

---

### 2. Rodar o Setup Automatizado (`setup_servidor.py`)
Execute o script interativo de configuração:

```bash
python3 setup_servidor.py
```

O script guiará você passo a passo:
1. **Credenciais do MySQL**: Solicita o IP/Host, Porta, Usuário, Senha e Nome do Banco de Dados.
2. **Teste de Conexão**: Valida se a senha e o host estão corretos.
3. **Criação do Banco de Dados**: Cria o banco MySQL automaticamente caso ele não exista.
4. **Geração do `.env`**: Cria o arquivo `backend/.env` configurado com as credenciais informadas.
5. **Criação de Tabelas**: Cria todas as tabelas e colunas da aplicação automaticamente via SQLAlchemy.
6. **Instalação de Dependências**: Pergunta se deseja executar o `pip install` do backend e `npm install` do frontend.

---

### 3. Iniciar a Aplicação

O projeto conta com o script de gerenciamento `./fleet.sh` para controlar os serviços de backend e frontend em segundo plano.

#### Iniciar todos os serviços:
```bash
./fleet.sh start
```

#### Reiniciar serviços (após atualizações de código):
```bash
./fleet.sh restart
```

#### Verificar status dos serviços:
```bash
./fleet.sh status
```

#### Parar todos os serviços:
```bash
./fleet.sh stop
```

---

## 🌐 Portas e Acesso aos Serviços

- **Backend (API FastAPI)**: Porta `5011` (ex: `http://IP_DO_SERVIDOR:5011`)
- **Frontend (Vite Preview / App Web)**: Porta `4173` ou `5173` (ex: `http://IP_DO_SERVIDOR:4173`)

---

## 🔧 Solução de Problemas Rápidos

- **Logs do Backend**: Veja em `backend/backend.log` ou `backend/uvicorn.log`
- **Logs do Frontend**: Veja em `frontend/build.log` ou `frontend/frontend.log`
- **Erros de Permissão no Vite/Service Worker**: O script `./fleet.sh` recompila automaticamente o frontend. Certifique-se de que a pasta `frontend/dist` possui permissão de escrita.

---

*Fleet Control - Sistema de Gestão de Frota, Terceiros, Chaves e Controle Patrimonial.*
