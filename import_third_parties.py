import csv
import sys
import os
import re
from datetime import datetime

# Add the backend directory to sys.path so we can import the app modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.models.third_party import ThirdPartyProfile

def clean_document(doc):
    if not doc:
        return ""
    # Remove all non-numeric characters
    cleaned = re.sub(r'\\D', '', doc)
    return cleaned

def generate_id():
    # Use timestamp to generate unique string ID
    import time
    return str(int(time.time() * 1000))

def run_import():
    csv_path = os.path.join(os.path.dirname(__file__), 'tercerios.csv')
    
    if not os.path.exists(csv_path):
        print(f"File not found: {csv_path}")
        return

    db = SessionLocal()
    imported_count = 0
    skipped_count = 0
    updated_count = 0
    
    seen_cpfs = {}

    try:
        with open(csv_path, newline='', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile, delimiter=';')
            for row in reader:
                nome = row.get('NOME', '').strip()
                cpf = row.get('CPF', '').strip()
                celular = row.get('CELULAR', '').strip()
                endereco = row.get('ENDERECO', '').strip()
                bairro = row.get('BAIRRO', '').strip()
                cidade = row.get('CIDADE', '').strip()
                empresa = row.get('EMPRESA', '').strip()
                contato = row.get('CONTATO', '').strip()

                if not nome or not cpf:
                    print(f"Skipping row with missing Name or CPF: {nome} - {cpf}")
                    skipped_count += 1
                    continue

                cleaned_cpf = clean_document(cpf)
                if not cleaned_cpf:
                    print(f"Skipping row, invalid CPF: {cpf}")
                    skipped_count += 1
                    continue

                if cleaned_cpf in seen_cpfs:
                    existing = seen_cpfs[cleaned_cpf]
                else:
                    existing = db.query(ThirdPartyProfile).filter(ThirdPartyProfile.document == cleaned_cpf).first()

                if existing:
                    # Update fields that are provided
                    existing.name = nome
                    if empresa:
                        existing.company = empresa
                    if celular:
                        existing.phone = celular
                    if endereco:
                        existing.address = endereco
                    if bairro:
                        existing.neighborhood = bairro
                    if cidade:
                        existing.city = cidade
                    if contato:
                        existing.internal_contact = contato
                    updated_count += 1
                else:
                    # Create new ThirdPartyProfile
                    new_profile = ThirdPartyProfile(
                        id=generate_id() + str(imported_count),
                        name=nome,
                        document=cleaned_cpf,
                        company=empresa or "Não Informado",
                        phone=celular,
                        address=endereco,
                        neighborhood=bairro,
                        city=cidade,
                        internal_contact=contato
                    )
                    
                    db.add(new_profile)
                    seen_cpfs[cleaned_cpf] = new_profile
                    imported_count += 1

                # Commit in batches to avoid locking up
                if (imported_count + updated_count) % 100 == 0:
                    db.commit()

        # Final commit
        db.commit()
        print(f"Import completed successfully!")
        print(f"Created: {imported_count}")
        print(f"Updated: {updated_count}")
        print(f"Skipped: {skipped_count}")

    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_import()
