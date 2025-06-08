import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    fullWidth?: boolean;
}

/**
 * A flexible button component with multiple variants and sizes
 */
export const Button = ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    children,
    className = '',
    disabled,
    ...props
}: ButtonProps) => {
    const baseClasses = [
        'inline-flex',
        'items-center',
        'justify-center',
        'border',
        'font-medium',
        'rounded-md',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-offset-2',
        'transition-colors',
        'duration-200'
    ];

    const variantClasses = {
        primary: [
            'bg-blue-600',
            'border-blue-600',
            'text-white',
            'hover:bg-blue-700',
            'focus:ring-blue-500',
            'disabled:bg-blue-300'
        ],
        secondary: [
            'bg-gray-100',
            'border-gray-300',
            'text-gray-900',
            'hover:bg-gray-200',
            'focus:ring-gray-500',
            'disabled:bg-gray-50'
        ],
        outline: [
            'bg-transparent',
            'border-gray-300',
            'text-gray-700',
            'hover:bg-gray-50',
            'focus:ring-gray-500',
            'disabled:text-gray-400'
        ],
        ghost: [
            'bg-transparent',
            'border-transparent',
            'text-gray-600',
            'hover:bg-gray-100',
            'hover:text-gray-900',
            'focus:ring-gray-500',
            'disabled:text-gray-400'
        ],
        danger: [
            'bg-red-600',
            'border-red-600',
            'text-white',
            'hover:bg-red-700',
            'focus:ring-red-500',
            'disabled:bg-red-300'
        ]
    };

    const sizeClasses = {
        sm: ['px-3', 'py-2', 'text-sm'],
        md: ['px-4', 'py-2', 'text-sm'],
        lg: ['px-6', 'py-3', 'text-base']
    };

    const widthClasses = fullWidth ? ['w-full'] : [];

    const classes = [
        ...baseClasses,
        ...variantClasses[variant],
        ...sizeClasses[size],
        ...widthClasses,
        className
    ].join(' ');

    return (
        <button
            className={classes}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            {!isLoading && leftIcon && (
                <span className="mr-2">{leftIcon}</span>
            )}
            {children}
            {!isLoading && rightIcon && (
                <span className="ml-2">{rightIcon}</span>
            )}
        </button>
    );
};
