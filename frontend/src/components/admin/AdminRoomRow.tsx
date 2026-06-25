import { Icon } from '../ui/Icon';

export interface AdminRoomRowProps {
    title: string;
    capacity: number;
    equipment: string;
    status: 'available' | 'unavailable';
}

export function AdminRoomRow({ title, capacity, equipment, status }: AdminRoomRowProps) {
    const isAvailable = status === 'available';

    return (
        <div className="bg-surface-container-lowest border-[3px] border-on-surface neo-shadow p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-surface-container-highest border-[3px] border-on-surface flex items-center justify-center">
                    <Icon name="meeting_room" className="text-3xl" />
                </div>
                <div>
                    <h3 className="font-headline-md font-bold text-[24px]">{title}</h3>
                    <p className="font-body-md text-on-surface-variant">
                        Capacité: {capacity} • {equipment}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                {isAvailable ? (
                    <span className="bg-tertiary-fixed text-on-tertiary-fixed border-[3px] border-on-surface px-3 py-1 font-label-bold font-bold neo-shadow-sm">
                        Disponible
                    </span>
                ) : (
                    <span className="bg-secondary-fixed text-on-secondary-fixed border-[3px] border-on-surface px-3 py-1 font-label-bold font-bold neo-shadow-sm">
                        Indisponible
                    </span>
                )}

                <button className="bg-surface text-on-surface border-[3px] border-on-surface neo-shadow-sm font-label-bold font-bold px-4 py-2 hover:bg-secondary-fixed hover:text-on-secondary-fixed transition-colors neo-active-sm">
                    {isAvailable ? 'Rendre indisponible' : 'Restaurer la disponibilité'}
                </button>
            </div>
        </div>
    );
}
