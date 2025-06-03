#!/bin/bash

# MonoRepo Development Helper Script

show_help() {
    echo "MonoRepo Development Commands:"
    echo ""
    echo "  install   - Install all dependencies"
    echo "  dev       - Start all applications in development mode"
    echo "  build     - Build all applications"
    echo "  test      - Run all tests"
    echo "  clean     - Clean all build artifacts"
    echo "  api       - Start only the .NET API"
    echo "  web       - Start only the React web app"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./dev.sh install"
    echo "  ./dev.sh dev"
    echo "  ./dev.sh api"
}

install_dependencies() {
    echo "Installing dependencies..."
    pnpm install
    echo "Dependencies installed!"
}

start_development() {
    echo "Starting all applications in development mode..."
    echo "API will be available at: https://localhost:7000"
    echo "Web app will be available at: http://localhost:5173"
    echo ""
    echo "Press Ctrl+C to stop all services"
    pnpm nx run-many --target=serve --projects=api,web --parallel
}

build_all() {
    echo "Building all applications..."
    pnpm nx run-many --target=build --all
    echo "Build completed!"
}

test_all() {
    echo "Running all tests..."
    pnpm nx run-many --target=test --all
    echo "Tests completed!"
}

clean_all() {
    echo "Cleaning all build artifacts..."
    pnpm nx reset
    rm -rf node_modules apps/*/node_modules libs/*/node_modules
    rm -rf apps/api/Api/bin apps/api/Api/obj apps/web/dist
    echo "Clean completed!"
}

start_api() {
    echo "Starting .NET API..."
    echo "API will be available at: https://localhost:7000"
    pnpm nx serve api
}

start_web() {
    echo "Starting React web app..."
    echo "Web app will be available at: http://localhost:5173"
    pnpm nx serve web
}

# Main execution
case "${1:-help}" in
    install)
        install_dependencies
        ;;
    dev)
        start_development
        ;;
    build)
        build_all
        ;;
    test)
        test_all
        ;;
    clean)
        clean_all
        ;;
    api)
        start_api
        ;;
    web)
        start_web
        ;;
    help|*)
        show_help
        ;;
esac
