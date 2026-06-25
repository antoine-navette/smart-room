import { Icon } from '../ui/Icon';

export interface AdminStatCardProps {
    title: string;
    value: string | number;
    unit?: string;
    subtitle: string;
    icon: string;
    bgClass: string;
    valueColorClass?: string;
}

export function AdminStatCard({
    title,
    value,
    unit,
    subtitle,
    icon,
    bgClass,
    valueColorClass = 'text-on-surface',
}: AdminStatCardProps) {
    return (
        <div
            className={`${bgClass} border-[3px] border-on-surface neo-shadow p-gutter flex flex-col justify-between hover:-translate-y-1 transition-transform`}
        >
            <div className="flex justify-between items-start border-b-[3px] border-on-surface pb-4 mb-4">
                <h2 className="font-headline-md font-bold text-[24px] text-on-surface uppercase">{title}</h2>
                <Icon name={icon} className="text-on-surface text-4xl" />
            </div>
            <div className="flex items-baseline gap-2">
                <span
                    className={`font-headline-xl font-black ${valueColorClass} text-[64px] leading-none tracking-tighter`}
                >
                    {value}
                </span>
                {unit && <span className="font-headline-md font-bold text-on-surface">{unit}</span>}
            </div>
            <p
                className={`font-label-bold font-bold mt-4 uppercase ${valueColorClass === 'text-on-surface' ? '' : valueColorClass}`}
            >
                {subtitle}
            </p>
        </div>
    );
}
