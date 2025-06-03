# MonoRepo

A modern monorepo containing .NET Core backend and React TypeScript frontend applications.

## 📁 Structure

```
├── apps/                    # Applications
│   ├── api/                # .NET Core Web API
│   └── web/                # React TypeScript with Vite
├── libs/                    # Shared libraries
├── tools/                   # Build tools and scripts
├── docs/                    # Documentation
└── package.json            # Root package.json with workspaces
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm (v8+)
- .NET 8 SDK
- Git

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

### Development

#### Start all applications in development mode:
```bash
pnpm dev
```

#### Start specific applications:
```bash
# Start React frontend
pnpm nx serve web

# Start .NET API
pnpm nx serve api
```

### Building

#### Build all applications:
```bash
pnpm build
```

#### Build specific applications:
```bash
# Build React frontend
pnpm nx build web

# Build .NET API
pnpm nx build api
```

### Testing

#### Run all tests:
```bash
pnpm test
```

#### Run tests for specific applications:
```bash
# Test React frontend
pnpm nx test web

# Test .NET API
pnpm nx test api
```

## 🏗️ Architecture

### Frontend (React + TypeScript + Vite)
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library
- **Styling**: CSS Modules / Styled Components
- **State Management**: React Query + Zustand

### Backend (.NET Core)
- **Framework**: .NET 8 Web API
- **Database**: Entity Framework Core
- **Authentication**: JWT
- **Testing**: xUnit
- **Documentation**: Swagger/OpenAPI

### Monorepo Management
- **Tool**: Nx
- **Package Manager**: pnpm workspaces
- **CI/CD**: GitHub Actions (planned)
- **Code Quality**: ESLint, Prettier, SonarQube (planned)

## 📦 Scripts

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps for production
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all code
- `pnpm format` - Format all code with Prettier
- `pnpm clean` - Clean all build artifacts and node_modules

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
