# DOCUMENTAÇÃO TÉCNICA EXECUTIVA E ARQUITETURAL
## SISTEMA INTEGRADO DE GESTÃO DE FROTA, RONDAS E CONTROLE PATRIMONIAL (FLEET CONTROL)

---

# SEÇÃO 1: DOCUMENTAÇÃO EM PORTUGUÊS DO BRASIL (PT-BR)

## 1. Visão Geral do Sistema

O Sistema de Gestão de Frota, Rondas Patrimoniais e Controle de Acesso (Fleet Control) é uma plataforma corporativa web e móvel desenvolvida para automatizar, monitorar e auditoriar operações patrimoniais críticas em tempo real. O sistema integra em uma arquitetura unificada o gerenciamento de frota veicular, controle de rondas patrimoniais baseadas em geofencing GPS, controle de portaria para terceirizados e visitantes, clavulário digital de chaves e notificações automáticas via WhatsApp.

### Propósito do Projeto
Centralizar operações que historicamente dependiam de registros manuais, planilhas dispersas e controles em papel, garantindo rastreabilidade completa, integridade de dados, conformidade operacional e rápida resposta a incidentes de segurança patrimonial ou manutenção veicular.

### Problemas Resolvidos
- Falta de auditoria na entrega e devolução de chaves da organização.
- Ausência de rastreamento em tempo real sobre cumprimento de itinerários de rondas de segurança.
- Atrasos não detectados no início de rondas preventivas.
- Falta de controle sobre a manutenção preventiva de óleo e odômetro da frota.
- Ineficiência e vulnerabilidades no cadastro e permanência de prestadores de serviço terceirizados.
- Falhas na comunicação de alertas críticos para a equipe de gestão.

---

## 2. Objetivos e Capacidades Operacionais

### Objetivos Estratégicos de Negócio
- Reduzir custos operacionais decorrentes de manutenções corretivas em veículos.
- Elevar os níveis de segurança patrimonial através do monitoramento rigoroso de rondas e cerceamento geográfico (geofencing).
- Garantir conformidade jurídica e regulatória no controle de acesso de terceiros e visitantes.
- Prover dashboards executivos e relatórios analíticos para tomada de decisão baseada em dados em tempo real.

### Capacidades Operacionais do Sistema
- **Gestão de Frota e Odômetro**: Registro de saídas, entradas, abastecimentos e cálculo automático do limite de quilometragem para troca de óleo.
- **Rondas Inteligentes com GPS e Geofencing**: Validação contínua de rotas, verificação de checkpoints georreferenciados e detecção imediata de saídas do perímetro demarcado.
- **Clavulário Digital (Controle de Chaves)**: Autenticação corporativa por código PIN do vigia para liberação e recebimento de chaves com registro de data, hora e responsável.
- **Portaria e Controle de Terceiros**: Cadastro completo de prestadores de serviço, consulta de status em tempo real (No Local, Ativo, Bloqueado) e historização de entradas e saídas.
- **Notificações Automáticas via WhatsApp**: Integração com motor de envio assíncrono para notificações de rondas atrasadas e alertas de manutenção de óleo.
- **Interface Progressiva Móvel (PWA)**: Aplicação responsiva otimizada para dispositivos móveis de vigias e motoristas com suporte a operações com conectividade intermitente.

---

## 3. Diagrama do Fluxo Operacional (End-to-End)

```mermaid
flowchart TD
    A[Inicio da Operacao] --> B{Tipo de Acesso ou Acao}
    
    B -->|Controle de Chaves| C[Selecao de Chave no Clavulario]
    C --> D[Informe do PIN de Autenticacao do Vigia]
    D --> E{Validacao do PIN}
    E -->|PIN Invalido| F[Rejeicao do Acesso e Log de Erro]
    E -->|PIN Valido| G[Registro de Retirada ou Devolucao]
    G --> H[Atualizacao de Status no Banco de Dados]

    B -->|Ronda Patrimonial| I[Selecao do Roteiro no Dispositivo Movel]
    I --> J[Inicio da Captura de Coordenadas GPS]
    J --> K[Checkins em Checkpoints Georreferenciados]
    K --> L{Verificacao de Perimetro Geofence}
    L -->|Fora da Area| M[Geracao de Alerta de Saida de Cerca]
    L -->|Dentro da Area| N[Confirmacao de Checkpoint]
    M --> O[Encerramento e Sincronizacao da Ronda]
    N --> O

    B -->|Controle de Terceiros| P[Busca de CPF ou Documento]
    P --> Q{Verificacao de Status}
    Q -->|Bloqueado| R[Alerta de Impedimento de Entrada]
    Q -->|Liberado| S[Registro de Entrada no Local]
    S --> T[Vinculacao de Cracha e Empresa]
    T --> U[Registro do Horario de Saida no Encerramento]

    H --> V[Atualizacao dos Dashboards em Tempo Real]
    O --> V
    U --> V
    F --> V
    V --> W[Fim do Fluxo Operacional]
```

---

## 4. Diagrama de Arquitetura em Camadas

```mermaid
flowchart TD
    subgraph Camada_Apresentacao[Camada de Apresentacao e Interface - UI/UX]
        UI1[Web Dashboard - React / TypeScript / Tailwind]
        UI2[Painel Movel do Vigia - PWA / Leaflet Maps]
        UI3[Painel Movel do Motorista - PWA / Responsive UI]
    end

    subgraph Camada_Orquestracao[Camada de Orquestracao e Backend - FastAPI]
        API1[Roteadores REST API - Autenticacao e Usuarios]
        API2[Roteadores REST API - Gestao de Frota e Abastecimento]
        API3[Roteadores REST API - Rondas Patrimoniais e Geofencing]
        API4[Roteadores REST API - Clavulario e Controle de Chaves]
        API5[Roteadores REST API - Terceiros e Portaria]
        SEC[Camada de Seguranca - JWT / Bcrypt / CORS]
    end

    subgraph Camada_Trabalhadores[Camada de Agentes e Trabalhadores Background]
        WORK1[APScheduler - Verificador de Rondas Atrasadas]
        WORK2[APScheduler - Monitor de Troca de Oleo da Frota]
        WORK3[Gerenciador de Notificacoes - Evolution WhatsApp API]
    end

    subgraph Camada_Persistencia[Camada de Persistencia e Banco de Dados]
        DB[(Banco de Dados Relacional - MySQL / MariaDB)]
        ORM[SQLAlchemy ORM - Modelos e Migracoes]
    end

    subgraph Sistemas_Externos[Sistemas Externos e Hardware]
        EXT1[API Evolution - Gateway WhatsApp]
        EXT2[Integracao Hardware - Control iD Access]
    end

    Camada_Apresentacao -->|Requisicoes HTTP / JSON| Camada_Orquestracao
    Camada_Orquestracao --> ORM
    Camada_Trabalhadores --> ORM
    ORM --> DB
    Camada_Trabalhadores -->|Alertas HTTP REST| EXT1
    Camada_Orquestracao -->|Sync SQL / HTTP| EXT2
```

---

## 5. Ciclo de Vida da Execução Distribuída

```mermaid
sequenceDiagram
    autonumber
    participant M as Dispositivo Movel / Web (UI)
    participant B as Backend FastAPI
    participant DB as Banco de Dados MySQL
    participant S as APScheduler (Worker)
    participant W as API Evolution (WhatsApp)

    Note over M,B: Ciclo de Execucao de Ronda Patrimonial
    M->>B: POST /api/patrols (Iniciar Ronda com GPS)
    B->>DB: Inserir Registro de Ronda (Status: Em Andamento)
    DB-->>B: Confirmacao de Gravacao
    B-->>M: Retorno HTTP 201 (Ronda Iniciada)

    loop Captura de Telemetria GPS
        M->>B: PUT /api/patrols/{id} (Enviar Coordenadas e Checkpoint)
        B->>DB: Atualizar Trajeto GPS e Checkpoints Visitados
        DB-->>B: Confirmacao de Atualizacao
    end

    M->>B: PUT /api/patrols/{id} (Finalizar Ronda com Observacoes)
    B->>DB: Atualizar Status (Concluida) e Timestamp de Fim
    DB-->>B: Confirmacao
    B-->>M: Retorno HTTP 200 (Ronda Finalizada)

    Note over S,W: Ciclo Assincrono de Monitoramento de Pendencias
    loop Execucao a cada 5 minutos
        S->>DB: Consultar Rondas Programadas Nao Iniciadas
        DB-->>S: Retornar Lista de Rondas Atrasadas
        opt Ronda Atrasada Detectada
            S->>DB: Atualizar Data da Ultima Notificacao
            S->>W: POST /message/sendText (Enviar Alerta de Atraso)
            W-->>S: Confirmacao de Envio WhatsApp
        end
    end
```

---

## 6. Catálogo Completo de Componentes e Módulos

| Categoria | Módulo / Componente | Arquivo Fonte | Descrição Técnica e Responsabilidade |
| :--- | :--- | :--- | :--- |
| Backend API | Roteador de Autenticação | `backend/app/api/endpoints/auth.py` | Gestão de login, emissão de tokens JWT e controle de acesso por função. |
| Backend API | Módulo de Veículos | `backend/app/api/endpoints/vehicles.py` | Cadastro de frota, odômetro, histórico de manutenção e controle de óleo. |
| Backend API | Módulo de Motoristas | `backend/app/api/endpoints/drivers.py` | Cadastro de condutores, vínculo com veículos e validações institucionais. |
| Backend API | Módulo de Rondas | `backend/app/api/endpoints/patrols.py` | Processamento de GPS, validação de geofencing e cálculo de tolerâncias. |
| Backend API | Módulo de Roteiros | `backend/app/api/endpoints/patrol_routes.py` | Definição de pontos de checagem, cercas virtuais e horários repetitivos. |
| Backend API | Módulo de Clavulário | `backend/app/api/routers/keys.py` | Gestão do armário de chaves, histórico de retiradas e validação por PIN. |
| Backend API | Módulo de Terceiros | `backend/app/api/routers/third_party.py` | Cadastro de prestadores de serviço, consulta de impedimentos e crachás. |
| Backend API | Módulo de Visitas | `backend/app/api/routers/visits.py` | Controle de visitantes na portaria, anfitrião de destino e horários. |
| Backend API | WhatsApp Integration | `backend/app/api/endpoints/whatsapp_instances.py` | Gerenciamento de instâncias da API Evolution e status de conexão. |
| Worker | Scheduler de Tarefas | `backend/app/scheduler.py` | Agendador APScheduler para alertas de rondas atrasadas e troca de óleo. |
| Modelo DB | Modelos de Dados ORM | `backend/app/models/` | Definições de tabelas SQLAlchemy (veículos, vigias, chaves, rondas, etc). |
| Frontend | Dashboard Executivo | `frontend/src/pages/Dashboard.tsx` | Painel gráfico com KPIs, métricas de rondas, frota e alertas operacionais. |
| Frontend | Controle de Terceiros | `frontend/src/pages/control/ThirdPartyControl.tsx` | Interface de portaria com filtros avançados (No Local, Ativos, Bloqueados). |
| Frontend | Controle de Chaves | `frontend/src/pages/control/KeysControl.tsx` | Painel visual do clavulário com autenticação por senha de vigia. |
| Frontend | Módulo Movel Vigia | `frontend/src/pages/guard/GuardDashboard.tsx` | Interface PWA para execução de rondas, mapa Leaflet e check-in offline. |

---

## 7. Mecanismo de Decisão Inteligente

```mermaid
flowchart TD
    A[Recebimento de Evento Operacional] --> B{Tipo de Evento}

    B -->|Atualizacao de Quilometragem| C[Verificar KM Atual do Veiculo]
    C --> D[Calcular Proxima KM de Troca de Oleo]
    D --> E{KM Atual >= Proxima Troca - Margem?}
    E -->|Sim| F{Alerta Ja Enviado para esta KM?}
    F -->|Nao| G[Gerar Mensagem de Alerta de Oleo]
    G --> H[Disparar Notificacao WhatsApp para o Motorista]
    F -->|Sim| I[Ignorar Envio Duplicado]
    E -->|Nao| J[Manter Status Normal do Veiculo]

    B -->|Ciclo de Monitoramento de Ronda| K[Consultar Roteiros Ativos]
    K --> L[Calcular Horario Previsto + Tolerancia]
    L --> M{Horario Atual > Limite da Tolerancia?}
    M -->|Sim| N{Existe Ronda Registrada no Horario?}
    N -->|Nao| O{Alerta de Atraso Ja Enviado?}
    O -->|Nao| P[Gerar Mensagem de Alerta de Atraso de Ronda]
    P --> Q[Disparar Notificacao WhatsApp para Gestao]
    O -->|Sim| R[Aguardar Proximo Ciclo]
    N -->|Sim| S[Ronda Executada Dentro da Normalidade]
    M -->|Nao| T[Aguardar Janela de Tolerancia]
```

---

## 8. Configuração de Rede, Portas e Segurança

### Tabela de Mapeamento de Portas de Rede

| Porta | Protocolo | Serviço / Aplicação | Escopo de Acesso | Descrição de Segurança |
| :--- | :--- | :--- | :--- | :--- |
| `5011` | TCP / HTTP | FastAPI Backend Service | Interno / Proxy Reverso | Endpoint da API RESTful com autenticação JWT obrigatória. |
| `5173` | TCP / HTTP | Vite Frontend Dev Server | Ambiente de Desenvolvimento | Servidor de desenvolvimento com HMR (Hot Module Replacement). |
| `4173` | TCP / HTTP | Vite Frontend Production Preview | Interno / Proxy Reverso | Servidor de pré-visualização de build otimizado de produção. |
| `3306` | TCP / MySQL | MySQL Server | Estritamente Interno / Rede Local | Banco de dados relacional. Acesso bloqueado externamente. |
| `8080` | TCP / HTTP | Evolution API Gateway | Interno / Rede Local | Serviço gateway para integração de mensagens via WhatsApp. |

### Template Seguro de Configuração (.env)

```ini
# ===================================================================
# CONFIGURACAO DE BANCO DE DADOS MYSQL (PRODUCAO)
# ===================================================================
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=fleet_prod_user
MYSQL_PASSWORD=<SENHA_BANCO_DE_DADOS_SEGRA>
MYSQL_DB=fleet_control_db

# ===================================================================
# CONFIGURACAO DE SEGURANCA E AUTENTICACAO JWT
# ===================================================================
SECRET_KEY=<CHAVE_SECRETA_JWT_GERADA_ALEATORIAMENTE>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# ===================================================================
# CONFIGURACAO DE INTEGRACAO WHATSAPP EVOLUTION API
# ===================================================================
EVOLUTION_API_URL=http://127.0.0.1:8080
EVOLUTION_API_KEY=<CHAVE_API_EVOLUTION_CONFIDENCIAL>
EVOLUTION_INSTANCE_NAME=instancia_patrimonial

# ===================================================================
# CONFIGURACAO DE AGENDADOR DE TAREFAS (APSCHEDULER)
# ===================================================================
PATROL_SCHEDULER_ACTIVE=true
OIL_CHECK_INTERVAL_MINUTES=5
```

---
---

# SECTION 2: EXECUTIVE TECHNICAL DOCUMENTATION (ENGLISH)

## 1. System Overview

The Integrated Fleet Management, Security Rounds, and Access Control System (Fleet Control) is an enterprise web and mobile platform engineered to automate, monitor, and audit critical physical security and fleet operations in real time. The platform merges vehicle fleet logistics, GPS geofenced security patrol verification, contractor/visitor facility access management, digital key cabinet tracking, and automated WhatsApp alert dispatching into a unified multi-layer architecture.

### Purpose of the Project
To centralize core operational workflows that historically relied on manual logs, disconnected spreadsheets, and paper records, ensuring total traceability, data integrity, regulatory compliance, and immediate incident response capabilities.

### Problems Solved
- Absence of verifiable audit trails for organizational key borrowing and returns.
- Lack of real-time tracking for security guard patrol route compliance.
- Undetected delays in the execution of scheduled preventive rounds.
- Unmonitored vehicle oil change thresholds leading to costly engine maintenance.
- Operational inefficiencies and security risks in contractor access logs.
- Delayed critical notification delivery to facility managers.

---

## 2. Objectives and Operational Capabilities

### Strategic Business Objectives
- Decrease fleet maintenance overhead through automated odometer and oil change scheduling.
- Enhance physical asset protection via GPS geofencing and real-time route verification.
- Ensure legal and regulatory compliance regarding third-party visitor facility access.
- Provide executive dashboards and real-time telemetry for data-driven management.

### System Operational Capabilities
- **Fleet and Odometer Management**: Comprehensive logging of vehicle checkouts, check-ins, refueling entries, and automated oil service threshold calculations.
- **Intelligent Patrols with GPS Geofencing**: Continuous route tracking, georeferenced checkpoint validation, and instant perimeter breach detection.
- **Digital Key Cabinet (Key Control)**: Guard PIN-code authentication for key borrowing and returns with complete timestamped audit logging.
- **Visitor and Contractor Control**: Personnel registration, real-time status filtering (On-Site, Active, Banned), and entry/exit history tracking.
- **Automated WhatsApp Notifications**: Asynchronous background dispatch for missed patrol warnings and vehicle oil change alerts.
- **Progressive Mobile Interface (PWA)**: Responsive application optimized for mobile devices used by guards and drivers, featuring offline data buffering.

---

## 3. End-to-End Operational Flow Diagram

```mermaid
flowchart TD
    A[Operation Start] --> B{Access Type or Action}
    
    B -->|Key Control| C[Select Key in Digital Cabinet]
    C --> D[Enter Guard Security PIN]
    D --> E{PIN Validation}
    E -->|Invalid PIN| F[Access Rejected and Logged]
    E -->|Valid PIN| G[Register Checkout or Return]
    G --> H[Update Status in Database]

    B -->|Security Patrol| I[Select Route on Mobile Device]
    I --> J[Initialize GPS Location Tracking]
    J --> K[Check-in at Georeferenced Checkpoints]
    K --> L{Geofence Perimeter Verification}
    L -->|Out of Boundary| M[Generate Geofence Breach Alert]
    L -->|Inside Boundary| N[Confirm Checkpoint Visit]
    M --> O[Complete and Synchronize Patrol]
    N --> O

    B -->|Contractor Control| P[Search Document or ID Number]
    P --> Q{Status Verification}
    Q -->|Banned| R[Entry Restriction Alert Displayed]
    Q -->|Cleared| S[Register Facility Entry]
    S --> T[Assign Access Badge and Company]
    T --> U[Log Exit Timestamp on Departure]

    H --> V[Update Real-Time Dashboards]
    O --> V
    U --> V
    F --> V
    V --> W[End of Operational Flow]
```

---

## 4. Layered Architecture Diagram

```mermaid
flowchart TD
    subgraph Presentation_Layer[Presentation & Interface Layer - UI/UX]
        UI1[Web Executive Dashboard - React / TypeScript / Tailwind]
        UI2[Guard Mobile Panel - PWA / Leaflet Maps]
        UI3[Driver Mobile Panel - PWA / Responsive UI]
    end

    subgraph Orchestration_Layer[Orchestration & Backend Layer - FastAPI]
        API1[REST API Routers - Authentication & Users]
        API2[REST API Routers - Fleet & Refueling Management]
        API3[REST API Routers - Security Patrols & Geofencing]
        API4[REST API Routers - Digital Key Cabinet]
        API5[REST API Routers - Contractors & Visitors]
        SEC[Security Module - JWT / Bcrypt / CORS Policy]
    end

    subgraph Worker_Layer[Background Services & Workers Layer]
        WORK1[APScheduler - Missed Patrol Detector Worker]
        WORK2[APScheduler - Fleet Oil Change Monitoring Worker]
        WORK3[Notification Dispatcher - Evolution WhatsApp API]
    end

    subgraph Persistence_Layer[Persistence & Database Layer]
        DB[(Relational Database - MySQL / MariaDB)]
        ORM[SQLAlchemy ORM - Data Models & Migrations]
    end

    subgraph External_Systems[External Systems & Hardware Interfaces]
        EXT1[Evolution API - WhatsApp Messaging Gateway]
        EXT2[Hardware Integration - Control iD Access Systems]
    end

    Presentation_Layer -->|HTTP Requests / JSON Payload| Orchestration_Layer
    Orchestration_Layer --> ORM
    Worker_Layer --> ORM
    ORM --> DB
    Worker_Layer -->|REST HTTP Alerts| EXT1
    Orchestration_Layer -->|SQL Sync / HTTP| EXT2
```

---

## 5. Distributed Execution Lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant M as Mobile / Web Client (UI)
    participant B as FastAPI Backend
    participant DB as MySQL Database
    participant S as APScheduler (Worker)
    participant W as Evolution API (WhatsApp)

    Note over M,B: Security Patrol Execution Lifecycle
    M->>B: POST /api/patrols (Initialize Patrol with GPS)
    B->>DB: Insert Patrol Record (Status: In Progress)
    DB-->>B: Write Confirmation
    B-->>M: HTTP 201 Created (Patrol Started)

    loop GPS Telemetry Stream
        M->>B: PUT /api/patrols/{id} (Transmit GPS Coordinates & Checkpoint)
        B->>DB: Update Trajectory Track & Visited Checkpoints
        DB-->>B: Update Confirmation
    end

    M->>B: PUT /api/patrols/{id} (Finalize Patrol with Notes)
    B->>DB: Update Status (Completed) & End Timestamp
    DB-->>B: Confirmation
    B-->>M: HTTP 200 OK (Patrol Completed)

    Note over S,W: Asynchronous Monitoring & Alerting Loop
    loop Execution Every 5 Minutes
        S->>DB: Query Scheduled Unstarted Patrols
        DB-->>S: Return Overdue Patrol List
        opt Overdue Patrol Detected
            S->>DB: Update Last Notification Timestamp
            S->>W: POST /message/sendText (Send Overdue Warning)
            W-->>S: WhatsApp Delivery Confirmation
        end
    end
```

---

## 6. Complete Catalog of Components and Modules

| Category | Module / Component | Source File | Technical Description & Scope |
| :--- | :--- | :--- | :--- |
| Backend API | Auth Router | `backend/app/api/endpoints/auth.py` | Handles user authentication, JWT issuance, password hashing, and role checks. |
| Backend API | Vehicles Module | `backend/app/api/endpoints/vehicles.py` | Manages fleet registration, odometer readings, maintenance, and oil change metrics. |
| Backend API | Drivers Module | `backend/app/api/endpoints/drivers.py` | Drivers management, vehicle bindings, and credentials validation. |
| Backend API | Patrols Module | `backend/app/api/endpoints/patrols.py` | Ingests GPS tracks, validates geofences, and handles patrol completion logic. |
| Backend API | Patrol Routes Module | `backend/app/api/endpoints/patrol_routes.py` | Route definition, geofence coordinate storage, and recurring schedule setups. |
| Backend API | Key Cabinet Module | `backend/app/api/routers/keys.py` | Key registry, checkout/return logs, and security guard PIN validation. |
| Backend API | Third-Party Module | `backend/app/api/routers/third_party.py` | Contractor profiles, active/banned status queries, and access logs. |
| Backend API | Visits Module | `backend/app/api/routers/visits.py` | Visitor registry, host designation, entry/exit timestamp management. |
| Backend API | WhatsApp Integration | `backend/app/api/endpoints/whatsapp_instances.py` | Evolution API instance configuration and connection status monitoring. |
| Worker | Job Scheduler | `backend/app/scheduler.py` | APScheduler background service checking overdue patrols and oil service triggers. |
| DB Model | ORM Schemas | `backend/app/models/` | SQLAlchemy relational definitions (vehicles, guards, keys, patrols, visits). |
| Frontend | Executive Dashboard | `frontend/src/pages/Dashboard.tsx` | Analytics portal presenting KPIs, patrol charts, fleet status, and alerts. |
| Frontend | Contractor Control | `frontend/src/pages/control/ThirdPartyControl.tsx` | Facility gate panel with real-time status filtering (On-Site, Active, Banned). |
| Frontend | Key Control | `frontend/src/pages/control/KeysControl.tsx` | Visual key cabinet board requiring guard PIN entry for checkouts. |
| Frontend | Guard Mobile PWA | `frontend/src/pages/guard/GuardDashboard.tsx` | PWA interface for field security guards, Leaflet maps, and offline syncing. |

---

## 7. Intelligent Decision Mechanism

```mermaid
flowchart TD
    A[Operational Event Received] --> B{Event Classification}

    B -->|Odometer Update| C[Read Vehicle Current KM]
    C --> D[Calculate Target Oil Change KM]
    D --> E{Current KM >= Target KM - Threshold?}
    E -->|Yes| F{Alert Already Sent for Current KM?}
    F -->|No| G[Construct Oil Maintenance Alert Message]
    G --> H[Dispatch WhatsApp Alert to Assigned Driver]
    F -->|Yes| I[Suppress Duplicate Notification]
    E -->|No| J[Maintain Normal Vehicle Status]

    B -->|Patrol Scheduler Audit Loop| K[Query Active Scheduled Routes]
    K --> L[Calculate Expected Start + Tolerance Window]
    L --> M{Current Time > Tolerance Window Limit?}
    M -->|Yes| N{Does Patrol Record Exist for Window?}
    N -->|No| O{Overdue Alert Already Dispatched?}
    O -->|No| P[Construct Missed Patrol Warning Message]
    P --> Q[Dispatch WhatsApp Warning to Facility Managers]
    O -->|Yes| R[Await Next Audit Interval]
    N -->|Yes| S[Patrol Executed Within SLA]
    M -->|No| T[Await Tolerance Window Expiration]
```

---

## 8. Network, Ports, and Security Configuration

### Network Port Mapping Matrix

| Port | Protocol | Service / Component | Access Scope | Security & Isolation Details |
| :--- | :--- | :--- | :--- | :--- |
| `5011` | TCP / HTTP | FastAPI Backend Service | Internal / Reverse Proxy | Core RESTful API endpoint enforcing mandatory JWT authorization. |
| `5173` | TCP / HTTP | Vite Frontend Dev Server | Development Host Only | Dev server providing Hot Module Replacement (HMR). |
| `4173` | TCP / HTTP | Vite Production Preview | Internal / Reverse Proxy | Optimized production build static preview server. |
| `3306` | TCP / MySQL | MySQL Database Engine | Strictly Internal / LAN | Relational database server. External direct access prohibited. |
| `8080` | TCP / HTTP | Evolution API Gateway | Internal / LAN | Gateway endpoint for automated WhatsApp notification dispatches. |

### Secure Production Configuration Template (.env)

```ini
# ===================================================================
# MYSQL PRODUCTION DATABASE CONFIGURATION
# ===================================================================
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=fleet_prod_user
MYSQL_PASSWORD=<SECURE_DATABASE_PASSWORD>
MYSQL_DB=fleet_control_db

# ===================================================================
# JWT SECURITY AND AUTHENTICATION CONFIGURATION
# ===================================================================
SECRET_KEY=<RANDOM_GENERATED_SECURE_JWT_SECRET>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# ===================================================================
# WHATSAPP EVOLUTION API INTEGRATION CONFIGURATION
# ===================================================================
EVOLUTION_API_URL=http://127.0.0.1:8080
EVOLUTION_API_KEY=<CONFIDENTIAL_EVOLUTION_API_KEY>
EVOLUTION_INSTANCE_NAME=patrol_instance

# ===================================================================
# APSCHEDULER WORKER TASK CONFIGURATION
# ===================================================================
PATROL_SCHEDULER_ACTIVE=true
OIL_CHECK_INTERVAL_MINUTES=5
```
