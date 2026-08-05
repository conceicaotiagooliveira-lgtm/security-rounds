#!/bin/bash

# Diretório base do projeto
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$BASE_DIR/backend"
FRONTEND_DIR="$BASE_DIR/frontend"

BACKEND_PID_FILE="$BASE_DIR/backend.pid"
FRONTEND_PID_FILE="$BASE_DIR/frontend.pid"

start() {
    echo "Iniciando serviços do Fleet Control..."

    # Iniciar Backend
    if [ -f "$BACKEND_PID_FILE" ] && kill -0 $(cat "$BACKEND_PID_FILE") 2>/dev/null; then
        echo "Backend já está rodando (PID: $(cat $BACKEND_PID_FILE))"
    else
        echo "Iniciando Backend na porta 5011..."
        cd "$BACKEND_DIR"
        source venv/bin/activate
        python3 add_keys_guard_columns.py
        nohup uvicorn app.main:app --host 0.0.0.0 --port 5011 > backend.log 2>&1 &
        BACKEND_PID=$!
        echo $BACKEND_PID > "$BACKEND_PID_FILE"
        echo "Backend iniciado (PID: $BACKEND_PID)"
    fi

    echo "Gerando Build de Produção do Frontend (Vite)..."
    cd "$FRONTEND_DIR"
    node node_modules/vite/bin/vite.js build > build.log 2>&1

    if [ -f "$FRONTEND_PID_FILE" ] && kill -0 $(cat "$FRONTEND_PID_FILE") 2>/dev/null; then
        echo "Frontend já está rodando (PID: $(cat $FRONTEND_PID_FILE))"
    else
        echo "Iniciando Frontend (Vite Preview)..."
        nohup npm run preview > frontend.log 2>&1 &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
        echo "Frontend iniciado (PID: $FRONTEND_PID)"
    fi

    echo "Serviços iniciados com sucesso!"
}

stop() {
    echo "Parando serviços do Fleet Control..."

    # Parar Backend
    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat "$BACKEND_PID_FILE")
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID
            echo "Backend (PID: $BACKEND_PID) parado."
        else
            echo "Backend não estava rodando."
        fi
        rm -f "$BACKEND_PID_FILE"
    else
        echo "Arquivo de PID do backend não encontrado."
    fi

    # Parar Frontend
    if [ -f "$FRONTEND_PID_FILE" ]; then
        FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
        # Frontend via npm spawn subprocesses (vite), better kill the process group or kill Vite directly.
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            pkill -P $FRONTEND_PID 2>/dev/null
            kill $FRONTEND_PID 2>/dev/null
            echo "Frontend (PID: $FRONTEND_PID) parado."
        else
            echo "Frontend não estava rodando."
        fi
        rm -f "$FRONTEND_PID_FILE"
    else
        echo "Arquivo de PID do frontend não encontrado."
    fi
    
    # Garantir que processos órfãos caiam apenas se pertencerem a esta aplicação
    for pid in $(pgrep -f "uvicorn" 2>/dev/null); do
        if [ -d "/proc/$pid" ] && [ "$(readlink -f /proc/$pid/cwd 2>/dev/null)" = "$BACKEND_DIR" ]; then
            kill -9 $pid 2>/dev/null
        fi
    done
    
    for pid in $(pgrep -f "vite" 2>/dev/null); do
        if [ -d "/proc/$pid" ] && [ "$(readlink -f /proc/$pid/cwd 2>/dev/null)" = "$FRONTEND_DIR" ]; then
            kill -9 $pid 2>/dev/null
        fi
    done
    
    echo "Todos os serviços foram parados."
}

status() {
    if [ -f "$BACKEND_PID_FILE" ] && kill -0 $(cat "$BACKEND_PID_FILE") 2>/dev/null; then
        echo "Backend: RODANDO (PID: $(cat $BACKEND_PID_FILE))"
    else
        echo "Backend: PARADO"
    fi

    if [ -f "$FRONTEND_PID_FILE" ] && kill -0 $(cat "$FRONTEND_PID_FILE") 2>/dev/null; then
        echo "Frontend: RODANDO (PID: $(cat $FRONTEND_PID_FILE))"
    else
        echo "Frontend: PARADO"
    fi
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        sleep 2
        start
        ;;
    status)
        status
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac

exit 0
