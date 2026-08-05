# Fleet Control - Sistema de Gestão de Frotas

Sistema completo e moderno para gestão e monitoramento de frotas e veículos. Construído com Vite, React, TailwindCSS, FastAPI e MySQL.

## Estrutura do Projeto

O projeto está dividido em duas partes principais:
- `/frontend`: Aplicação SPA React moderna.
- `/backend`: API RESTful construída com Python e FastAPI.

## Pré-requisitos
- Node.js v18+
- Python 3.10+
- Servidor MySQL rodando localmente.

## Configuração do Backend (API)

1. Entre na pasta `backend`:
   ```bash
   cd backend
   ```
2. Crie e ative um ambiente virtual:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # No Windows use: venv\Scripts\activate
   ```
3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure o arquivo `.env` baseado no `.env.example` com as credenciais do seu MySQL.
5. Inicie o servidor (o banco e tabelas serão criados automaticamente):
   ```bash
   uvicorn app.main:app --reload --port 8080
   ```

A API estará disponível em: http://localhost:8080
Documentação Swagger em: http://localhost:8080/docs

## Configuração do Frontend

1. Entre na pasta `frontend`:
   ```bash
   cd frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

O sistema estará acessível no navegador na porta informada (ex: http://localhost:5173).
Você pode logar com qualquer email/senha na tela de login pois por enquanto é um mock de testes visuais.
