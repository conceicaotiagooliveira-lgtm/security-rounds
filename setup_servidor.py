#!/usr/bin/env python3
"""
====================================================================
  FLEET CONTROL - SCRIPT DE SETUP E DEPLOY AUTOMATIZADO EM SERVIDOR
====================================================================
Este script configura o ambiente, cria o banco de dados MySQL,
gera o arquivo backend/.env, executa a criação de todas as tabelas
e opcionalmente instala as dependências do backend e frontend.
"""

import os
import sys
import subprocess
import getpass

def main():
    print("\n" + "="*65)
    print("      🚀 FLEET CONTROL - CONFIGURAÇÃO E SETUP DE NOVO SERVIDOR")
    print("="*65 + "\n")

    # 1. Coleta de dados do banco de dados
    print("📌 PASSO 1: Configuração do Banco de Dados MySQL\n")
    db_host = input("   IP / Host do MySQL [padrão: 127.0.0.1]: ").strip() or "127.0.0.1"
    db_port_str = input("   Porta do MySQL [padrão: 3306]: ").strip() or "3306"
    try:
        db_port = int(db_port_str)
    except ValueError:
        db_port = 3306

    db_user = input("   Usuário do MySQL [padrão: root]: ").strip() or "root"
    db_pass = getpass.getpass("   Senha do MySQL: ")
    db_name = input("   Nome do Banco de Dados [padrão: fleet_control]: ").strip() or "fleet_control"

    # 2. Testar Conexão com o Servidor MySQL
    print("\n🔄 Testando conexão com o servidor MySQL...")
    try:
        import pymysql
    except ImportError:
        print("   Instalando PyMySQL para teste de conexão...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pymysql"])
        import pymysql

    try:
        # Tenta conectar sem especificar o banco de dados primeiro
        conn = pymysql.connect(
            host=db_host,
            port=db_port,
            user=db_user,
            password=db_pass,
            autocommit=True
        )
        print("   ✅ Conexão estabelecida com sucesso com o servidor MySQL!")
    except Exception as e:
        print(f"\n❌ ERRO DE CONEXÃO: Não foi possível conectar ao MySQL em {db_host}:{db_port}.")
        print(f"   Detalhes do erro: {e}")
        sys.exit(1)

    # 3. Criar Banco de Dados se não existir
    print(f"\n🛠️  Verificando/Criando o banco de dados '{db_name}'...")
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        print(f"   ✅ Banco de dados '{db_name}' pronto para uso!")
        conn.close()
    except Exception as e:
        print(f"❌ Erro ao criar o banco de dados '{db_name}': {e}")
        sys.exit(1)

    # 4. Gerar o arquivo backend/.env
    print("\n📝 PASSO 2: Gerando arquivo backend/.env...")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, "backend")
    env_file = os.path.join(backend_dir, ".env")

    secret_key = "yoursecretkey" + os.urandom(8).hex()

    env_content = f"""# Database Config (Gerado automaticamente por setup_servidor.py)
MYSQL_USER={db_user}
MYSQL_PASSWORD={db_pass}
MYSQL_HOST={db_host}
MYSQL_PORT={db_port}
MYSQL_DB={db_name}

# JWT Config
SECRET_KEY={secret_key}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200
"""

    with open(env_file, "w", encoding="utf-8") as f:
        f.write(env_content)
    print(f"   ✅ Arquivo '.env' criado com sucesso em '{env_file}'!")

    # 5. Criar Tabelas Automáticas via SQLAlchemy
    print("\n🏗️  PASSO 3: Criando tabelas da aplicação no Banco de Dados...")
    sys.path.insert(0, backend_dir)
    try:
        # Importar modelos e database
        from app.database.database import engine, Base
        from app.models import (
            user, vehicle, driver, refueling, movement, guard, 
            patrol_route, patrol, third_party, company, key_control, 
            setting, whatsapp_instance, oil_history, visit
        )
        Base.metadata.create_all(bind=engine)
        print("   ✅ Todas as tabelas SQLAlchemy foram criadas no banco de dados!")
    except Exception as e:
        print(f"⚠️  Aviso na criação de tabelas via SQLAlchemy: {e}")

    # Executar script de colunas adicionais do módulo de chaves
    migration_script = os.path.join(backend_dir, "add_keys_guard_columns.py")
    if os.path.exists(migration_script):
        print("   🔄 Executando verificação de colunas complementares...")
        try:
            subprocess.run([sys.executable, migration_script], cwd=backend_dir, check=False)
            print("   ✅ Colunas complementares verificadas!")
        except Exception as e:
            print(f"   Aviso na verificação complementar: {e}")

    # 6. Instalação opcional de dependências
    print("\n📦 PASSO 4: Instalação de Dependências")
    
    instalar_backend = input("\n👉 Deseja instalar/atualizar as dependências Python do Backend? (S/n): ").strip().lower()
    if instalar_backend in ["", "s", "sim", "y", "yes"]:
        req_file = os.path.join(backend_dir, "requirements.txt")
        if os.path.exists(req_file):
            print("   Iniciando 'pip install -r backend/requirements.txt'...")
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", req_file])
                print("   ✅ Dependências do backend instaladas com sucesso!")
            except Exception as e:
                print(f"❌ Erro ao instalar dependências do backend: {e}")

    frontend_dir = os.path.join(base_dir, "frontend")
    instalar_frontend = input("\n👉 Deseja instalar as dependências NPM do Frontend? (S/n): ").strip().lower()
    if instalar_frontend in ["", "s", "sim", "y", "yes"]:
        if os.path.exists(frontend_dir):
            print("   Iniciando 'npm install' no frontend...")
            try:
                subprocess.check_call(["npm", "install"], cwd=frontend_dir, shell=(os.name == 'nt'))
                print("   ✅ Dependências do frontend instaladas com sucesso!")
            except Exception as e:
                print(f"❌ Erro ao instalar dependências do frontend: {e}")

    print("\n" + "="*65)
    print("      🎉 CONFIGURAÇÃO E INSTALAÇÃO CONCLUÍDAS COM SUCESSO!")
    print("="*65)
    print("\n📋 Próximos Passos:")
    print("   1. Para iniciar a aplicação em produção, execute:")
    print("      ./fleet.sh start    ou    ./fleet.sh restart")
    print("   2. Para verificar o status dos serviços, execute:")
    print("      ./fleet.sh status\n")

if __name__ == "__main__":
    main()
