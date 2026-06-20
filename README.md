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

### 6. Database Configuration
The application is pre-configured to connect to a PostgreSQL database. Ensure you set the `DATABASE_URL` in your `.env` file.

* **Connection format**:
  ```env
  DATABASE_URL=postgresql://[username]:[password]@[host]:[port]/[database]
  ```
* **Special Characters in Passwords**: If your password contains special characters (like `@`, `:`, `/`, etc.), you must URL-encode them. For example, `@` becomes `%40`.
* **Testing Connections**: Once configured, you can verify connection health by visiting the `/api/health` route.

---


## Running the Application

You can run the app locally with Uvicorn (Python) or with Docker.

- Run with Uvicorn (local development):
  ```bash
  uvicorn app.main:app --reload
  ```
  The server will start on http://127.0.0.1:8000. Use `/docs` for the Swagger UI.

- Run with Docker (recommended for development using your Dockerfile):
  Prerequisite: Docker Desktop must be installed and running.

  From the project root (`Eduqate`):

  Build the image using the project's Dockerfile:
  ```bash
  docker build -t eduqate:latest .
  ```

  Run the built image:
  ```bash
  docker run --rm -p 8000:8000 --env-file .env eduqate:latest
  ```

  Or use docker-compose (build + run):
  ```bash
  docker compose up --build
  # or run detached
  docker compose up --build -d
  ```

  Stop and remove containers created by compose:
  ```bash
  docker compose down
  ```

  Notes:
  - In development we use `--reload` so Uvicorn will auto-reload on code changes.
  - In the browser, use http://localhost:8000 or http://127.0.0.1:8000. Do not use `0.0.0.0` in the browser address bar.
  - If you get a warning about `version` in `docker-compose.yml` being obsolete, remove the `version:` line from that file to avoid the warning.
  - To view logs:
    ```bash
    docker compose logs -f web
    ```

- Production recommendations:
  - Build a reproducible image in CI and push to a registry.
  - Do not use bind mounts or `--reload` in production. Run Uvicorn without `--reload` or use a production server like Gunicorn with Uvicorn workers.

---

## API Documentation

FastAPI automatically generates interactive API documentation. Once the server is running, you can access it at:
* **Swagger UI (Interactive Docs):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## Syncing & Updating (For Contributors)

Whenever new updates are pushed, follow these steps to keep your local workspace synchronized:

1. **Pull the latest changes**:
   ```bash
   git pull origin main
   ```
2. **Activate your virtual environment**:
   * Windows: `.\venv\Scripts\Activate.ps1`
   * macOS/Linux: `source venv/bin/activate`
3. **Install updated dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Apply database migrations**:
   Make sure your local `.env` is configured with a valid `DATABASE_URL`, then run:
   ```bash
   alembic upgrade head
   ```

# Contributors
- Yashraj Deshmukh
- Yash Shirsath

---

## Frontend Client Setup & Launch

Ensure you have **Node.js (v18+)** installed on your system.

### 1. Install Frontend Dependencies
Navigate into the `/frontend` directory and install the packages:
```bash
cd frontend
npm install
```

### 2. Run the Frontend in Development Mode
Start the Vite development server:
```bash
npm run dev
```
The client dashboard will start on [http://localhost:5173/](http://localhost:5173/).

---

## Accessing the Platform (Initial Admin Login)

To test the application locally when starting with a clean database, you must seed the initial Super Admin credentials.

1. **Apply alembic migrations**:
   ```bash
   alembic upgrade head
   ```
2. **Seed the initial organization and admin account**:
   Run the following command from the project root directory:
   * **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\python -c "from app.core.database import SessionLocal; from app.api.v1.endpoints.auth import get_auth_service; db = SessionLocal(); s = get_auth_service(db); s.register_user(email='admin@eduqate.com', password='Password@123', organization_slug='default-academy', organization_name='Default Academy', ip_address='127.0.0.1', user_agent='Script', request_id='boot'); print('Admin user created successfully!')"
     ```
   * **macOS / Linux**:
     ```bash
     python -c "from app.core.database import SessionLocal; from app.api.v1.endpoints.auth import get_auth_service; db = SessionLocal(); s = get_auth_service(db); s.register_user(email='admin@eduqate.com', password='Password@123', organization_slug='default-academy', organization_name='Default Academy', ip_address='127.0.0.1', user_agent='Script', request_id='boot'); print('Admin user created successfully!')"
     ```
3. **Login Details**:
   Use these credentials on the frontend login page at [http://localhost:5173/login](http://localhost:5173/login):
   * **Organization Slug**: `default-academy`
   * **Email Address**: `admin@eduqate.com`
   * **Password**: `Password@123`

