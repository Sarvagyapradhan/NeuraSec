import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content
import logging
import traceback
from pathlib import Path

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure email settings
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME", "")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@neurasec.com")
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
USE_SENDGRID = os.getenv("USE_SENDGRID", "false").lower() == "true"

# OTP log file - use absolute path
OTP_LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "otp_logs.txt")

def log_otp(email, otp):
    """Log OTP to file for development purposes"""
    try:
        # Create parent directory if it doesn't exist
        log_dir = os.path.dirname(OTP_LOG_FILE)
        os.makedirs(log_dir, exist_ok=True)
        
        with open(OTP_LOG_FILE, "a") as f:
            f.write(f"{email}: {otp}\n")
        logger.info(f"OTP logged for {email}: {otp}")
    except Exception as e:
        logger.error(f"Failed to log OTP: {e}")

def send_otp_email_smtp(email, otp):
    """Send OTP via SMTP (Gmail)"""
    try:
        # Always log OTP first in case email fails
        log_otp(email, otp)
        
        # Check if email credentials are set
        if not EMAIL_USERNAME or not EMAIL_PASSWORD:
            logger.warning("Email username or password not set. Using development mode with OTP logs only.")
            return True
        
        msg = EmailMessage()
        msg['Subject'] = 'Your NeuraSec Authentication Code'
        msg['From'] = EMAIL_FROM
        msg['To'] = email
        
        # Email content
        content = f"""
        <html>
        <body>
            <h2>NeuraSec Authentication</h2>
            <p>Your verification code is: <strong>{otp}</strong></p>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request this code, please ignore this email.</p>
        </body>
        </html>
        """
        
        msg.add_alternative(content, subtype='html')
        
        # Connect to server and send
        logger.info(f"Attempting to send email via SMTP to {email}")
        logger.info(f"Using SMTP server: {EMAIL_HOST}:{EMAIL_PORT}")
        logger.info(f"Using username: {EMAIL_USERNAME}")
        
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
            server.send_message(msg)
        
        # Log success
        logger.info(f"OTP email sent to {email} via SMTP")
        return True
    
    except Exception as e:
        error_trace = traceback.format_exc()
        logger.error(f"Failed to send OTP email via SMTP: {e}")
        logger.error(f"Error details: {error_trace}")
        
        # Don't raise the error - we've already logged the OTP above
        # In development, the OTP can be retrieved from the logs
        return True  # Return true even on failure since we logged the OTP

def send_otp_email_sendgrid(email, otp):
    """Send OTP via SendGrid"""
    try:
        # Always log OTP first in case email fails
        log_otp(email, otp)
        
        # Check if sendgrid API key is set
        if not SENDGRID_API_KEY:
            logger.warning("SendGrid API key not set. Using development mode with OTP logs only.")
            return True
            
        sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
        
        from_email = Email(EMAIL_FROM)
        to_email = To(email)
        subject = "Your NeuraSec Authentication Code"
        
        # Email content
        content = Content(
            "text/html", 
            f"""
            <html>
            <body>
                <h2>NeuraSec Authentication</h2>
                <p>Your verification code is: <strong>{otp}</strong></p>
                <p>This code will expire in 10 minutes.</p>
                <p>If you did not request this code, please ignore this email.</p>
            </body>
            </html>
            """
        )
        
        mail = Mail(from_email, to_email, subject, content)
        response = sg.client.mail.send.post(request_body=mail.get())
        
        # Log success
        logger.info(f"OTP email sent to {email} via SendGrid")
        return True
    
    except Exception as e:
        error_trace = traceback.format_exc()
        logger.error(f"Failed to send OTP email via SendGrid: {e}")
        logger.error(f"Error details: {error_trace}")
        
        # Don't raise the error - we've already logged the OTP above
        # In development, the OTP can be retrieved from the logs
        return True  # Return true even on failure since we logged the OTP

def send_otp_email(email, otp):
    """Send OTP email using configured method"""
    # Always log the OTP for development purposes
    log_otp(email, otp)
    
    if USE_SENDGRID and SENDGRID_API_KEY:
        return send_otp_email_sendgrid(email, otp)
    else:
        return send_otp_email_smtp(email, otp) 