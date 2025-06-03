# How to run the development server:

```bash
make dev
```

OR

```bash
(cd backend && pip install -r requirements.txt && uvicorn main:app --reload) & (pnpm i && pnpm run dev)
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Documentation is availible at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

## Features

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
