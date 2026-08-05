# Análise e Arquitetura do Sistema — SGP Florestal (FrotaPatrimonial)

> **Documento de Referência Estratégica e Regras de Negócio**
> Use este arquivo como contexto principal (`@SGP_FLORESTAL_ANALYSIS.md`) para que qualquer agente/subagente entenda imediatamente o escopo, arquitetura e regras, detalhe por detalhe, antes de fazer alterações.

---

## 1. Ambiente e Infraestrutura

- **IP do Servidor / Banco de Dados**: `192.168.0.53`
- **URL de Produção**: `https://sgp.florestal.com/`
- **Serviços Atuais**:
  - **Backend**: FastAPI (Python) rodando na porta `5011`.
  - **Frontend**: React + Vite (PWA) rodando na porta `5186`.
- **Banco de Dados**: `fleet_control` no servidor `192.168.0.53` acessado via SQLAlchemy.

### 🚨 Regras Críticas de Ambiente
1. **NUNCA assuma `localhost`**: O sistema roda num servidor remoto, as chamadas de API do frontend devem usar caminhos relativos (ex: `/api/vehicles`).
2. **Reinicialização de Serviços**: Agentes autônomos **NUNCA** devem executar `./fleet.sh restart` diretamente. Eles rodam num sandbox que não afeta o servidor real. Caso necessite, peça sempre para o **USUÁRIO** rodar `cd /Server_vite/FrotaPatrimonial && ./fleet.sh restart`.
3. **Problemas de Permissão**: As pastas `dist/` e `node_modules/.vite/deps/` costumam sofrer de `EACCES`. Se houver bloqueio no Vite, não delete o `node_modules`, oriente o usuário.
4. **Instalação e Exclusão de Pacotes/Módulos**: Caso seja necessário instalar ou deletar algum pacote/biblioteca (ex: `npm install`, complementos do `npx`, `pip install`, etc.), o agente **NÃO** deve executar o comando diretamente no terminal. O comando exato deve ser passado para o **USUÁRIO** informando para que ele acesse o servidor remotamente e faça a execução manualmente.

---

## 2. Tipos de Usuários e Acessos (Frontend - PWA e Web)

A aplicação (SPA React) roteia a interface baseada no `role` do usuário (via `authStore` Zustand):
1. **Administrador / Operador**: Acesso irrestrito a `/dashboard`, relatórios, configurações e todos os cadastros.
2. **Motorista (`Motorista`)**: Acesso restrito a `/driver/dashboard`. PWA focado no próprio veículo.
3. **Vigia (`Vigia`)**: Acesso restrito a `/guard/dashboard`. PWA focado em registro de rondas e portaria.

---

## 3. Módulos e Regras de Negócio Detalhadas (Backend)

### 3.1 Gestão de Frotas (Fleet Control)

#### 🚙 Veículos (`vehicles`)
- **Regra de Unicidade**: A Placa (`plate`) não pode ser duplicada.
- **Deleção Segura**: Não é possível excluir um veículo se ele possuir histórico (abastecimentos, movimentos ou trocas de óleo), a menos que o modo `force=True` seja ativado (cascade delete).
- **Notificação de Óleo**: Gera alertas via WhatsApp (`manual_notify_oil`) para o celular do motorista vinculado. Atualiza as variáveis `last_oil_alert_km` e data do alerta automaticamente após o disparo.
- **Relacionamento**: Apenas 1 Motorista por veículo. Atualizar o veículo reflete na FK do motorista correspondente.

#### 🛣️ Movimentações (Check-in/Check-out)
- **Status da Viagem**: Veículo com status `"EM USO"` não pode iniciar uma nova viagem (Check-out) antes de concluir a atual.
- **Validação de Odômetro (KM)**: O KM de Chegada (Check-in) **nunca** pode ser menor que o KM de Saída.
- **Atualização Cascata**: Ao registrar uma Chegada, o KM atual do veículo (`current_km`) é atualizado automaticamente caso a KM de chegada seja superior à registrada no veículo.

#### ⛽ Abastecimentos (`refueling`)
- Regra anti-fraude básica: O KM informado no abastecimento não pode ser menor que o KM atual do veículo. O KM do veículo é atualizado com o valor do último abastecimento registrado.

### 3.2 Controle Patrimonial e Rondas

#### 👮 Vigias (`guards`)
- Identificados de forma única pela Matrícula (`registration`).
- Possuem uma Senha de Autorização (`auth_password`) para aprovar requisições críticas na portaria sem precisar logar na conta admin.

#### 🔦 Rondas e Geofencing (`patrols`, `patrol_routes`)
- **Rondas Ativas**: Um Vigia só pode ter UMA ronda `"Em Andamento"` por vez.
- **Justificativas de Atraso**: Se um vigia inicia uma ronda com justificativa, o alerta de `last_missed_alert_time` da rota é limpo.
- **Validação de GPS (Ray Casting)**: Durante a ronda, o backend computa a localização do dispositivo via algoritmo Ray Casting (`point_in_polygon`). 
  - Se o vigia sair da "cerca virtual" (Geofence), o sistema embute um alerta `"FORA_DA_AREA"` na ronda.
  - Se habilitado (`notify_whatsapp`), a violação envia mensagem instantânea ao supervisor via WhatsApp.
- **Conclusão**: O sistema checa se todos os Checkpoints (`checkpoints_visited`) foram visitados. Se sim, o status muda para `"Concluída"`. Caso o vigia force o encerramento antes de concluir, o status vai para `"Incompleta"` (disparando WhatsApp para a chefia).

### 3.3 Portaria e Controle de Acessos

#### 👷 Terceiros e Prestadores de Serviço (`third_party`)
- **Unicidade e Migração**: Baseado em CPF/Documento. Se o documento for alterado, todo o histórico em `ThirdPartyEntry` (as visitas realizadas) migra para o novo documento automaticamente.
- **Armazenamento de Fotos**: As fotos da webcam são enviadas via base64 e o backend as converte para arquivos físicos salvos em `uploads/third_party/`.
- **Exclusão em Cascata**: Deletar um perfil de terceiro **deleta todo o histórico de entradas** (ThirdPartyEntry) daquele documento.
- **Controles de Segurança**: Suporte a banimento (`is_banned` com `ban_reason`) e integração com catracas Control ID (`enable_control_id`).

#### 🤝 Visitas Pontuais (`visits`)
- Segue lógicas e rotas quase idênticas a Terceiros, contudo focado em visitantes de menor duração. Imagens ficam em `uploads/visits/`.

#### 🔑 Controle de Chaves (`key_control`)
- **Status Binário**: Uma chave do claviculário está `"Disponível"` ou `"Emprestada"`. O sistema guarda o histórico de quem pegou, qual departamento, qual motivo, a hora de saída e retorno.

### 3.4 Integrações Externas

#### 💬 Motor de WhatsApp (`whatsapp_instances`)
- O sistema se conecta a uma API (Evolution API ou similar via endpoint genérico configurável). Envia dados JSON com `apikey` e `Content-Type: application/json`.
- Disparos rodando no backend (`send_whatsapp_alert`) frequentemente rodam em Threads isoladas para não travar o loop do FastAPI.

---
**Fim da análise detalhada.** Use essas informações para respeitar arquitetura ao refatorar tabelas ou adicionar campos no banco.
