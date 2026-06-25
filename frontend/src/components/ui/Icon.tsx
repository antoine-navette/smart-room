import { cn } from '../../lib/utils';

export function Icon({ name, className, fill = false }: { name: string; className?: string; fill?: boolean }) {
    return (
        <span
            aria-hidden="true"
            className={cn('material-symbols-outlined', className)}
            style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
            {name}
        </span>
    );
}
