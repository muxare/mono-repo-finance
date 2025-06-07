# Shared Libraries

This directory is intended for shared libraries that can be used across multiple applications in the mono repo.

## Purpose

The `libs/` directory should contain:
- Shared TypeScript types and interfaces
- Common utilities and helper functions
- Shared UI components (if using a component library)
- Business logic that is shared between the web app and potentially other frontends
- API client libraries
- Data models and validators

## Creating a New Library

When you need to share code between applications, create a new library here:

```bash
# Example structure:
libs/
├── shared-types/     # TypeScript interfaces and types
├── ui-components/    # Shared React components
├── api-client/       # Shared API client logic
└── utils/           # Common utility functions
```

Each library should have its own `package.json` and be properly configured in the workspace.