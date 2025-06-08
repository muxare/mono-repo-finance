import type { ReactNode } from 'react';

export interface CardProps {
    children: ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    shadow?: 'none' | 'sm' | 'md' | 'lg';
    border?: boolean;
    hover?: boolean;
}

/**
 * A flexible card component for displaying content
 */
export const Card = ({
    children,
    className = '',
    padding = 'md',
    shadow = 'sm',
    border = true,
    hover = false
}: CardProps) => {
    const baseClasses = ['bg-white', 'rounded-lg'];

    const paddingClasses = {
        none: [],
        sm: ['p-3'],
        md: ['p-4'],
        lg: ['p-6']
    };

    const shadowClasses = {
        none: [],
        sm: ['shadow-sm'],
        md: ['shadow-md'],
        lg: ['shadow-lg']
    };

    const borderClasses = border ? ['border', 'border-gray-200'] : [];
    const hoverClasses = hover ? ['hover:shadow-md', 'transition-shadow', 'duration-200'] : [];

    const classes = [
        ...baseClasses,
        ...paddingClasses[padding],
        ...shadowClasses[shadow],
        ...borderClasses,
        ...hoverClasses,
        className
    ].join(' ');

    return (
        <div className={classes}>
            {children}
        </div>
    );
};
