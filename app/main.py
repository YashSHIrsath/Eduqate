from fastapi import FastAPI

app = FastAPI(title="Eduqate API")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Eduqate API"}
