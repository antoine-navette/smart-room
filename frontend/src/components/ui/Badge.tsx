import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(({ className, variant = 'default', ...props }, ref) => {
    const baseStyles =
        'inline-flex items-center gap-1 border-[2px] md:border-[3px] border-on-surface px-2 md:px-3 py-1 font-label-bold font-bold text-[12px] uppercase tracking-wide neo-shadow-sm';

    const variants = {
        default: 'bg-surface-container-high text-on-surface',
        success: 'bg-tertiary-fixed text-on-tertiary-fixed',
        warning: 'bg-secondary-fixed text-on-secondary-fixed',
        danger: 'bg-error-container text-on-error-container',
        info: 'bg-primary-container text-on-primary-container',
    };

    return <div ref={ref} className={cn(baseStyles, variants[variant], className)} {...props} />;
});
Badge.displayName = 'Badge';
export { Badge };
