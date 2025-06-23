# Gitty

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![DrizzleORM](https://img.shields.io/badge/DrizzleORM-000000?style=for-the-badge&logo=drizzle&logoColor=white)](https://orm.drizzle.team/)
[![Fly.io](https://img.shields.io/badge/Fly.io-000000?style=for-the-badge&logo=fly.io&logoColor=white)](https://fly.io/)
[![Neon](https://img.shields.io/badge/Neon-00E599?style=for-the-badge&logo=neon&logoColor=white)](https://neon.tech/)

Welcome to Gitty - Your AI-Powered GitHub Repository Analysis Tool.

## 🌐 Production URLs

- Frontend: [https://gitty.alfardil.com/](https://gitty.alfardil.com/)
- API Documentation: [https://gitty-api.fly.dev/docs](https://gitty-api.fly.dev/docs)
- API Base URL: [https://gitty-api.fly.dev](https://gitty-api.fly.dev)

**Deployment Details:**

- **Production Database:** Hosted on [Neon](https://neon.tech/)
- **Frontend:** Built with Next.js
- **Backend:** Deployed on [Fly.io](https://fly.io/)

## 🚀 Features

- **Comprehensive GitHub Repository Contextualization**
  - Analyze and contextualize the entire GitHub repository for LLM-powered insights.
- **Automated System Design Visualization**
  - Instantly generate images that represent your project's system architecture.
- **API Endpoint & Routing Documentation**
  - Automatically produce detailed documentation of all possible API endpoints and routing logic.
- **Codebase Intelligence**
  - Identify function entry points and trace where functions are invoked.
  - Locate the main file for each component, streamlining navigation.
  - Retrieve any file and provide a clear explanation of what it renders.
  - Instantly pinpoint routing logic and its implementation location.
  - Summarize functions, files, or entire modules for rapid understanding.
- **Developer Productivity Tools**
  - Integrated chatbot for quick codebase queries and navigation.
  - Easy project setup with a Makefile for streamlined development.
- **Planned Features**
  - Visual Studio Code extension for seamless in-editor assistance (coming soon).

## 🛠️ Development Setup

### Prerequisites

- Python 3.8+
- Node.js 18+
- pnpm
- Make (optional)

### Running the Development Server

#### Option 1: Using Make (Recommended)

```bash
make dev
```

#### Option 2: Manual Setup

```bash
# Start backend
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload

# Start frontend (in a new terminal)
pnpm i && pnpm run dev
```

#### Option 3: Using Virtual Environment

```bash
# Find and activate virtual environment
find . -type d -name "*.venv"
source ${result}/bin/activate
```

### Development URLs

- Frontend: [http://localhost:3000](http://localhost:3000)
- API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
