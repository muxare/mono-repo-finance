# Development Tools

This directory is intended for development tools and scripts that support the mono repo workflow.

## Purpose

The `tools/` directory should contain:
- Build scripts and utilities
- Code generation tools
- Migration scripts
- Development automation tools
- Custom linters or formatters
- Deployment scripts
- CI/CD helper scripts

## Example Tools

```bash
# Example structure:
tools/
├── code-gen/         # Code generation utilities
├── scripts/          # Build and deployment scripts
├── migrations/       # Database migration tools
└── analyzers/        # Custom code analyzers
```

## Usage

Tools in this directory should be invoked through npm scripts defined in the root `package.json` or through Nx custom executors.