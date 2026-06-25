import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';

export interface BookingCardProps {
    time: string;
    meridiem: string;
    title: string;
    status: string;
    capacity: number;
    hasVc?: boolean;
    isUpcoming?: boolean;
}

export function BookingCard({ time, meridiem, title, status, capacity, hasVc, isUpcoming }: BookingCardProps) {
    const timeBgClass = isUpcoming ? 'bg-surface-variant text-on-surface' : 'bg-primary-fixed text-on-primary-fixed';
    const statusBgClass = isUpcoming
        ? 'bg-secondary-fixed text-on-secondary-fixed'
        : 'bg-tertiary-fixed text-on-tertiary-fixed';

    return (
        <div className="bg-surface-container-lowest border-[3px] border-on-surface neo-shadow flex flex-col md:flex-row mt-4">
            <div
                className={`md:w-1/3 p-6 flex flex-col justify-center items-center border-b-[3px] md:border-b-0 md:border-r-[3px] border-on-surface ${timeBgClass}`}
            >
                <span className="font-headline-xl font-black text-[48px]">{time}</span>
                <span className="font-label-bold font-bold text-on-surface-variant uppercase">{meridiem}</span>
            </div>
            <div className="p-6 md:w-2/3 flex flex-col justify-between">
                <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-headline-md font-bold text-[24px]">{title}</h3>
                        <span
                            className={`${statusBgClass} font-label-bold font-bold px-3 py-1 border-[3px] border-on-surface text-xs uppercase`}
                        >
                            {status}
                        </span>
                    </div>
                    <p className="font-body-md text-on-surface-variant flex items-center gap-2">
                        <Icon name="group" className="text-sm" /> Capacité: {capacity}
                        {hasVc && (
                            <>
                                <Icon name="videocam" className="text-sm ml-2" /> Vidéoconférence Équipée
                            </>
                        )}
                    </p>
                </div>
                <div className="flex gap-4 mt-4">
                    <Button variant="outline" className="flex-1 neo-shadow-sm neo-active-sm py-2">
                        Modifier
                    </Button>
                    <Button variant="danger" className="flex-1 neo-shadow-sm neo-active-sm py-2">
                        Annuler
                    </Button>
                </div>
            </div>
        </div>
    );
}
