from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import pymysql
import sqlite3

router = APIRouter()

class SqlProxyRequest(BaseModel):
    engine: str = "mysql"
    host: Optional[str] = None
    port: Optional[int] = 3306
    user: Optional[str] = None
    password: Optional[str] = None
    database: Optional[str] = None
    query: str

@router.post("/")
async def proxy_sql(req: SqlProxyRequest):
    if req.engine == "mysql":
        if not req.host or not req.user or not req.database:
            raise HTTPException(status_code=400, detail="Missing MySQL connection parameters")
        try:
            connection = pymysql.connect(
                host=req.host,
                port=req.port or 3306,
                user=req.user,
                password=req.password or "",
                database=req.database,
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=10
            )
            with connection:
                with connection.cursor() as cursor:
                    cursor.execute(req.query)
                    if req.query.strip().upper().startswith("SELECT"):
                        result = cursor.fetchall()
                        return {"success": True, "data": result}
                    else:
                        connection.commit()
                        return {"success": True, "message": f"Query executed successfully. Rows affected: {cursor.rowcount}"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    elif req.engine == "sqlite":
        if not req.database:
            raise HTTPException(status_code=400, detail="Missing SQLite database path")
        try:
            # Need to format Dict-like rows
            def dict_factory(cursor, row):
                d = {}
                for idx, col in enumerate(cursor.description):
                    d[col[0]] = row[idx]
                return d

            connection = sqlite3.connect(req.database, timeout=10)
            connection.row_factory = dict_factory
            with connection:
                cursor = connection.cursor()
                cursor.execute(req.query)
                if req.query.strip().upper().startswith("SELECT") or req.query.strip().upper().startswith("PRAGMA"):
                    result = cursor.fetchall()
                    return {"success": True, "data": result}
                else:
                    return {"success": True, "message": f"Query executed successfully. Rows affected: {cursor.rowcount}"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported database engine: {req.engine}")
