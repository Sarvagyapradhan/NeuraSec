import uvicorn
import os
from dotenv import load_dotenv
from app.database.database import engine
from app.database.models import Base

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    # Get host and port from environment variables or use defaults
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    
    # Start the FastAPI server
    uvicorn.run("app.main:app", host=host, port=port, reload=True) 