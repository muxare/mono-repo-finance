module.exports = {
    root: true,
    env: {
        browser: true,
        es2022: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        'prettier'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    plugins: ['@typescript-eslint', 'import'],
    rules: {
        // TypeScript specific rules
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',

        // Import rules
        'import/order': [
            'error',
            {
                groups: [
                    'builtin',
                    'external',
                    'internal',
                    'parent',
                    'sibling',
                    'index',
                ],
                'newlines-between': 'always',
                alphabetize: {
                    order: 'asc',
                    caseInsensitive: true,
                },
            },
        ],

        // General rules
        'no-console': 'warn',
        'prefer-const': 'error',
        'no-var': 'error',
    },
    overrides: [
        {
            files: ['*.tsx', '*.jsx'],
            extends: [
                'plugin:react/recommended',
                'plugin:react-hooks/recommended',
                'plugin:jsx-a11y/recommended',
            ],
            plugins: ['react', 'react-hooks', 'jsx-a11y'],
            settings: {
                react: {
                    version: 'detect',
                },
            },
            rules: {
                'react/react-in-jsx-scope': 'off', // Not needed in React 17+
                'react/prop-types': 'off', // Using TypeScript
            },
        },
        {
            files: ['*.test.*', '*.spec.*'],
            env: {
                jest: true,
            },
            rules: {
                'no-console': 'off',
            },
        },
    ],
};
