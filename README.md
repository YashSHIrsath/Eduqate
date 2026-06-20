# Eduqate Backend API

This is the FastAPI backend repository for the **Eduqate** project.

Follow the instructions below to set up and run the project locally on your machine.

---

## Prerequisites

Ensure you have **Python 3.10+** installed on your system. You can check your version by running:
```bash
python --version
```

---

## Quick Setup Instructions

### 1. Clone the Repository
Clone this repository to your local machine and navigate into the project directory:
```bash
git clone <repository-url>
cd Eduqate
```

### 2. Set Up a Virtual Environment (`venv`)
Create a virtual environment to isolate the project's dependencies:
```bash
python -m venv venv
```

### 3. Activate the Virtual Environment
Activate the environment based on your operating system and terminal:

* **Windows (PowerShell):**
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
* **Windows (Command Prompt):**
  ```cmd
  venv\Scripts\activate.bat
  ```
* **macOS / Linux:**
  ```bash
  source venv/bin/activate
  ```

Once activated, your terminal prompt will show `(venv)`.

### 4. Install Dependencies
Install all the required Python packages:
```bash
pip install -r requirements.txt
```

### 5. Set Up Configuration Variables
Copy the template configuration file to create your local environment file:
* **Windows:**
  ```cmd
  copy .env.example .env
  ```
* **macOS / Linux:**
  ```bash
  cp .env.example .env
  ```
Open the newly created `.env` file in your editor and adjust any configuration settings as needed.

---

## Running the Application

Start the Uvicorn development server:
```bash
uvicorn app.main:app --reload
```

The server will start on **`http://127.0.0.1:8000`** and will automatically reload whenever you make changes to the code.

---

## API Documentation

FastAPI automatically generates interactive API documentation. Once the server is running, you can access it at:
* **Swagger UI (Interactive Docs):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
