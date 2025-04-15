from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List

from app.database.database import get_db
from app.database.models import OTP
from app.schemas.auth import OTPOut, OTPLogList
from app.core.auth_dependencies import get_admin_user, validate_admin_api_key

router = APIRouter()

@router.get("/otp-logs", response_model=OTPLogList)
async def get_otp_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: bool = Depends(validate_admin_api_key)
):
    """
    Get all OTP logs for admin view
    
    Requires either:
    - Admin JWT token with role=admin
    - X-ADMIN-KEY header with valid admin API key
    """
    otps = db.query(OTP).order_by(desc(OTP.created_at)).offset(skip).limit(limit).all()
    return {"otps": otps}

@router.delete("/otp-logs/{otp_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_otp_log(
    otp_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(validate_admin_api_key)
):
    """
    Delete an OTP log (for GDPR compliance)
    
    Requires either:
    - Admin JWT token with role=admin
    - X-ADMIN-KEY header with valid admin API key
    """
    otp = db.query(OTP).filter(OTP.id == otp_id).first()
    if not otp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OTP not found"
        )
    
    db.delete(otp)
    db.commit()
    return None 