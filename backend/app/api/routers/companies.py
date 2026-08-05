from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database.database import get_db
from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyResponse

router = APIRouter(prefix="/api/companies", tags=["companies"])

@router.get("/", response_model=List[CompanyResponse])
def get_companies(db: Session = Depends(get_db)):
    return db.query(Company).all()

@router.post("/", response_model=CompanyResponse)
def create_company(company_in: CompanyCreate, db: Session = Depends(get_db)):
    db_company = db.query(Company).filter(Company.name == company_in.name).first()
    if db_company:
        raise HTTPException(status_code=400, detail="Company already exists")
    
    new_company = Company(
        id=str(uuid.uuid4()),
        name=company_in.name,
        corporate_name=company_in.corporate_name,
        cnpj=company_in.cnpj,
        phone=company_in.phone,
        email=company_in.email,
        manager=company_in.manager,
        activity_area=company_in.activity_area,
        status=company_in.status
    )
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    return new_company

@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(company_id: str, company_in: CompanyCreate, db: Session = Depends(get_db)):
    db_company = db.query(Company).filter(Company.id == company_id).first()
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    db_company.name = company_in.name
    db_company.corporate_name = company_in.corporate_name
    db_company.cnpj = company_in.cnpj
    db_company.phone = company_in.phone
    db_company.email = company_in.email
    db_company.manager = company_in.manager
    db_company.activity_area = company_in.activity_area
    db_company.status = company_in.status
    
    db.commit()
    db.refresh(db_company)
    return db_company

@router.delete("/{company_id}")
def delete_company(company_id: str, db: Session = Depends(get_db)):
    db_company = db.query(Company).filter(Company.id == company_id).first()
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    db.delete(db_company)
    db.commit()
    return {"message": "Company deleted"}
