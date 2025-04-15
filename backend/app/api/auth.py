from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any
from sqlalchemy.sql import func
from datetime import timedelta, datetime

from app.database.database import get_db
from app.database.models import User, OTP
from app.schemas.auth import UserCreate, UserOut, OTPVerify, Token, OTPCreate
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    generate_otp
)
from app.utils.email import send_otp_email
from app.core.auth_dependencies import get_current_active_user

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    background_tasks: BackgroundTasks,
    user_in: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user and send OTP for verification"""
    try:
        # Check if email already exists
        user = db.query(User).filter(User.email == user_in.email).first()
        if user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Generate OTP
        otp_code = generate_otp()
        
        # Create OTP in database
        db_otp = OTP(
            email=user_in.email,
            otp=otp_code,
            expiry=OTP.create_expiry()
        )
        db.add(db_otp)
        db.commit()
        db.refresh(db_otp)
        
        # Send OTP email in background
        try:
            background_tasks.add_task(send_otp_email, user_in.email, otp_code)
        except Exception as e:
            # Log error but don't fail the request
            print(f"Error scheduling email task: {e}")
        
        return {"message": "Registration initiated. Please verify your email with the OTP sent."}
    except Exception as e:
        db.rollback()  # Rollback any db changes if an error occurs
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/verify-registration", response_model=Token)
async def verify_registration(
    otp_data: OTPVerify,
    db: Session = Depends(get_db)
):
    """Verify OTP and complete user registration"""
    try:
        # Find the OTP
        db_otp = db.query(OTP).filter(
            OTP.email == otp_data.email,
            OTP.otp == otp_data.otp,
            OTP.used == False
        ).order_by(OTP.created_at.desc()).first()
        
        if not db_otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP"
            )
        
        if db_otp.is_expired():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP has expired"
            )
        
        # Check if user already exists (might have registered elsewhere)
        existing_user = db.query(User).filter(User.email == otp_data.email).first()
        if existing_user:
            # Just mark the OTP as used and generate a token
            db_otp.used = True
            db.add(db_otp)
            db.commit()
            
            access_token = create_access_token(
                data={"sub": existing_user.email, "user_id": existing_user.id, "role": existing_user.role}
            )
            
            return {"access_token": access_token, "token_type": "bearer"}
            
        # For the frontend registration flow, we should store the password temporarily
        # somewhere. Since this is a demo, we'll use a fixed password.
        # In a real application, you'd use a secure temporary storage.
        temp_password = "changeme123"
        
        # Create the user
        hashed_password = get_password_hash(temp_password)
        db_user = User(
            email=otp_data.email,
            password=hashed_password,
            full_name=None  # This would come from the stored registration data
        )
        db.add(db_user)
        
        # Mark OTP as used
        db_otp.used = True
        db.add(db_otp)
        db.commit()
        db.refresh(db_user)
        
        # Create access token
        access_token = create_access_token(
            data={"sub": db_user.email, "user_id": db_user.id, "role": db_user.role}
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration verification failed: {str(e)}"
        )

@router.post("/login")
async def login(
    background_tasks: BackgroundTasks,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login with email and password, and send OTP"""
    print(f"Login attempt for username: {form_data.username}")
    
    # Find the user
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        print(f"❌ User not found: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"✅ Found user: {user.email} (ID: {user.id})")
    
    # Verify password
    password_valid = verify_password(form_data.password, user.password)
    print(f"Password verification: {'✅ Success' if password_valid else '❌ Failed'}")
    
    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate OTP
    otp_code = generate_otp()
    print(f"Generated OTP: {otp_code}")
    
    # Create OTP in database
    db_otp = OTP(
        email=user.email,
        otp=otp_code,
        user_id=user.id,
        expiry=OTP.create_expiry()
    )
    db.add(db_otp)
    db.commit()
    db.refresh(db_otp)
    
    # Send OTP email in background
    background_tasks.add_task(send_otp_email, user.email, otp_code)
    print(f"OTP email scheduled to be sent to: {user.email}")
    
    return {"message": "Login initiated. Please verify with the OTP sent to your email."}

@router.post("/verify-login", response_model=Token)
async def verify_login(
    otp_data: OTPVerify,
    db: Session = Depends(get_db)
):
    """Verify OTP and complete login"""
    # Find the OTP
    db_otp = db.query(OTP).filter(
        OTP.email == otp_data.email,
        OTP.otp == otp_data.otp,
        OTP.used == False
    ).order_by(OTP.created_at.desc()).first()
    
    if not db_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP"
        )
    
    if db_otp.is_expired():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired"
        )
    
    # Find the user
    user = db.query(User).filter(User.email == otp_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )
    
    # Mark OTP as used
    db_otp.used = True
    db.add(db_otp)
    db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id, "role": user.role}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/resend-otp")
async def resend_otp(
    background_tasks: BackgroundTasks,
    otp_data: OTPCreate,
    db: Session = Depends(get_db)
):
    """Resend OTP to user's email"""
    # Check for rate limiting (5 OTPs per hour)
    otp_count = db.query(OTP).filter(
        OTP.email == otp_data.email,
        OTP.created_at > func.now() - timedelta(hours=1)
    ).count()
    
    if otp_count >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many OTP requests. Please try again later."
        )
    
    # Generate new OTP
    otp_code = generate_otp()
    
    # Find user (optional)
    user = db.query(User).filter(User.email == otp_data.email).first()
    user_id = user.id if user else None
    
    # Create OTP in database
    db_otp = OTP(
        email=otp_data.email,
        otp=otp_code,
        user_id=user_id,
        expiry=OTP.create_expiry()
    )
    db.add(db_otp)
    db.commit()
    
    # Send OTP email in background
    background_tasks.add_task(send_otp_email, otp_data.email, otp_code)
    
    return {"message": "OTP has been sent to your email"}

@router.post("/send-otp")
async def send_otp(
    background_tasks: BackgroundTasks,
    otp_data: OTPCreate,
    db: Session = Depends(get_db)
):
    """Send OTP to user's email"""
    # Check for rate limiting (5 OTPs per hour)
    otp_count = db.query(OTP).filter(
        OTP.email == otp_data.email,
        OTP.created_at > func.now() - timedelta(hours=1)
    ).count()
    
    if otp_count >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many OTP requests. Please try again later."
        )
    
    # Generate new OTP
    otp_code = generate_otp()
    
    # Find user (optional)
    user = db.query(User).filter(User.email == otp_data.email).first()
    user_id = user.id if user else None
    
    # Create OTP in database
    db_otp = OTP(
        email=otp_data.email,
        otp=otp_code,
        user_id=user_id,
        expiry=OTP.create_expiry()
    )
    db.add(db_otp)
    db.commit()
    
    # Send OTP email in background
    background_tasks.add_task(send_otp_email, otp_data.email, otp_code)
    
    return {"message": "OTP has been sent to your email"}

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user profile"""
    # Add default values for fields that are in the Pydantic model but not in the database
    user_dict = {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": getattr(current_user, "full_name", None),
        "profile_picture": getattr(current_user, "profile_picture", None),
        "role": getattr(current_user, "role", "user"),
        "created_at": datetime.now() if not hasattr(current_user, "created_at") else current_user.created_at
    }
    
    from app.schemas.auth import UserOut
    return UserOut(**user_dict)

@router.post("/direct-login", response_model=Token)
async def direct_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Authenticate user directly without OTP verification
    """
    print(f"Direct login attempt for username: {form_data.username}")
    
    # Find the user by email only (until username column is added to database)
    user = db.query(User).filter(User.email == form_data.username).first()
        
    if not user:
        print(f"❌ User not found: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"✅ Found user: {user.email} (ID: {user.id})")
    
    # Verify password
    password_valid = verify_password(form_data.password, user.password)
    print(f"Password verification: {'✅ Success' if password_valid else '❌ Failed'}")
    
    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id, "role": user.role}
    )
    
    # Update last login timestamp
    user.last_login = func.now()
    db.add(user)
    db.commit()
    
    return {"access_token": access_token, "token_type": "bearer"} 