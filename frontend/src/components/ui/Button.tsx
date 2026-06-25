import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        const baseStyles =
            'inline-flex items-center justify-center gap-2 font-label-bold font-bold transition-all border-[3px] border-on-surface cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

        const variants = {
            primary: 'bg-primary text-on-primary neo-shadow neo-shadow-hover neo-shadow-active',
            secondary: 'bg-secondary-fixed text-on-secondary-fixed neo-shadow neo-shadow-hover neo-shadow-active',
            outline: 'bg-surface text-on-surface neo-shadow-sm neo-active-sm hover:bg-surface-variant',
            danger: 'bg-error-container text-on-error-container neo-shadow-sm neo-active-sm hover:bg-error hover:text-on-error',
            ghost: 'border-transparent bg-transparent shadow-none hover:bg-surface-variant',
        };

        const sizes = {
            sm: 'py-2 px-4 text-[14px]',
            md: 'py-3 px-6 text-[14px] md:text-[16px]',
            lg: 'py-4 px-8 text-[20px]',
            icon: 'w-12 h-12 p-0',
        };

        return <button ref={ref} className={cn(baseStyles, variants[variant], sizes[size], className)} {...props} />;
    },
);
Button.displayName = 'Button';
export { Button };
