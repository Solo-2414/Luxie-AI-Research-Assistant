from app.main import app

@app.get("/")
def read_root():
    return {"message": "Luxcie AI Research Assistant Backend is running!"}

__all__ = ["app"]
