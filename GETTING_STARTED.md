# Getting Started with MonoRepo

This guide will help you get the monorepo up and running on your local machine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify: `node --version`

2. **pnpm** (v8 or higher)
   - Install globally: `npm install -g pnpm`
   - Verify: `pnpm --version`

3. **.NET SDK** (v9.0 or higher)
   - Download from [dotnet.microsoft.com](https://dotnet.microsoft.com/download)
   - Verify: `dotnet --version`

4. **Git**
   - Download from [git-scm.com](https://git-scm.com/)
   - Verify: `git --version`

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install all dependencies
pnpm install
```

### 2. Start Development Servers

#### Option A: Start All Services (Recommended)
```bash
# Start both API and Web app in parallel
pnpm dev

# Or use the helper script (Windows)
.\dev.ps1 dev

# Or use the helper script (macOS/Linux)
./dev.sh dev
```

#### Option B: Start Services Individually
```bash
# Terminal 1: Start .NET API
pnpm dev:api

# Terminal 2: Start React Web App
pnpm dev:web
```

### 3. Access the Applications

Once the development servers are running:

- **Web Application**: http://localhost:5173
- **API Endpoints**: https://localhost:7000/api
- **API Documentation (Swagger)**: https://localhost:7000/swagger

## 🏗️ Project Structure

```
MonoRepo/
├── apps/                    # Applications
│   ├── api/                # .NET Core Web API
│   │   └── Api/            # API project files
│   │       ├── Controllers/
│   │       ├── Models/
│   │       └── Program.cs
│   └── web/                # React TypeScript with Vite
│       ├── src/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── services/
│       │   └── types/
│       ├── package.json
│       └── vite.config.ts
├── libs/                   # Shared libraries (for future use)
├── tools/                  # Build tools and scripts
├── nx.json                 # Nx workspace configuration
├── package.json            # Root package.json with workspaces
├── pnpm-workspace.yaml     # pnpm workspace configuration
└── README.md
```

## 📦 Available Scripts

### Root Level Scripts
```bash
# Development
pnpm dev                    # Start all apps in development
pnpm dev:api               # Start only the API
pnpm dev:web               # Start only the web app

# Building
pnpm build                 # Build all applications
pnpm build:api             # Build only the API
pnpm build:web             # Build only the web app

# Testing
pnpm test                  # Run all tests

# Code Quality
pnpm lint                  # Lint all code
pnpm format                # Format all code with Prettier

# Maintenance
pnpm clean                 # Clean all build artifacts and dependencies
```

### Helper Scripts
```bash
# Windows PowerShell
.\dev.ps1 install          # Install dependencies
.\dev.ps1 dev              # Start development
.\dev.ps1 build            # Build all projects
.\dev.ps1 clean            # Clean everything

# macOS/Linux Bash
./dev.sh install           # Install dependencies
./dev.sh dev               # Start development
./dev.sh build             # Build all projects
./dev.sh clean             # Clean everything
```

## 🧪 Testing the Setup

### 1. Verify API is Running
- Open https://localhost:7000/swagger in your browser
- You should see the Swagger UI with the Todos API endpoints

### 2. Test API Endpoints
```bash
# Get all todos
curl -k https://localhost:7000/api/todos

# Create a new todo
curl -k -X POST https://localhost:7000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Todo", "description": "Testing the API"}'
```

### 3. Verify Frontend is Running
- Open http://localhost:5173 in your browser
- You should see the Todo application interface
- Try creating, editing, and deleting todos

## 🔧 Configuration

### Environment Variables

#### API (.NET)
- Default port: 7000 (HTTPS), 5000 (HTTP)
- Configuration in `apps/api/Api/appsettings.json`

#### Web App (React)
- Default port: 5173
- Environment variables in `apps/web/.env`
- API base URL: `VITE_API_BASE_URL=https://localhost:7000/api`

### CORS Configuration
The API is configured to allow requests from the frontend:
- `http://localhost:5173` (development)
- `https://localhost:5173` (development HTTPS)

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   netstat -ano | findstr :5173
   netstat -ano | findstr :7000
   
   # Kill the process or change the port in configuration
   ```

2. **CORS Issues**
   - Ensure the API is running before starting the frontend
   - Check that CORS is properly configured in `Program.cs`

3. **SSL Certificate Issues**
   ```bash
   # Trust the development certificate
   dotnet dev-certs https --trust
   ```

4. **Build Failures**
   ```bash
   # Clean and reinstall
   pnpm clean
   pnpm install
   ```

5. **TypeScript Errors**
   ```bash
   # Check TypeScript configuration
   cd apps/web
   pnpm tsc --noEmit
   ```

## 📚 Learning Resources

### .NET Core
- [ASP.NET Core Documentation](https://docs.microsoft.com/en-us/aspnet/core/)
- [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/)

### React & TypeScript
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)

### Monorepo Tools
- [Nx Documentation](https://nx.dev/)
- [pnpm Workspaces](https://pnpm.io/workspaces)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly (`pnpm test`)
4. Format code (`pnpm format`)
5. Lint code (`pnpm lint`)
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
