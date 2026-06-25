import { Icon } from '../ui/Icon';

export interface AdminAlertRowProps {
    title: string;
    status: 'Pending' | 'In Progress';
    location: string;
    details: string;
    actionLabel: string;
    isUrgent?: boolean;
}

export function AdminAlertRow({ title, status, location, details, actionLabel, isUrgent }: AdminAlertRowProps) {
    return (
        <div className="bg-surface-container-lowest border-[3px] border-on-surface p-4 flex flex-col gap-2 relative overflow-hidden group">
            {isUrgent && (
                <div className="absolute right-0 top-0 w-16 h-16 bg-error-container -rotate-45 translate-x-8 -translate-y-8 border-b-[3px] border-l-[3px] border-on-surface flex items-end justify-center pb-1 pl-1">
                    <Icon name="priority_high" className="text-on-error-container text-sm" />
                </div>
            )}
            <div className="flex justify-between items-start">
                <h4 className="font-headline-md font-bold text-[24px] text-on-surface">{title}</h4>
                <span
                    className={`${status === 'Pending' ? 'bg-error-container text-on-error-container' : 'bg-secondary-fixed text-on-secondary-fixed'} font-label-bold font-bold px-2 py-1 border-[2px] border-on-surface`}
                >
                    {status}
                </span>
            </div>
            <p className="font-body-md text-on-surface-variant">
                {location} • {details}
            </p>
            <button className="mt-2 text-left font-label-bold font-bold text-primary underline hover:text-on-surface transition-colors w-max">
                {actionLabel}
            </button>
        </div>
    );
}
