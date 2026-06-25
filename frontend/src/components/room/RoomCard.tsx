import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { Card, CardContent } from '../ui/Card';

export interface RoomCardProps {
    id: string | number;
    title: string;
    capacity: number;
    location: string;
    status?: 'available' | 'occupied' | 'upcoming';
    statusLabel?: string;
    imageUrl: string;
    equipmentNames: string[];
    additionalEquipmentCount?: number;
    actionLabel: string;
    actionLink?: string;
    actionClass?: string;
    imageOpacity?: string;
}

export function RoomCard({
    id,
    title,
    capacity,
    location,
    status,
    statusLabel,
    imageUrl,
    equipmentNames,
    additionalEquipmentCount = 0,
    actionLabel,
    actionLink,
    actionClass,
    imageOpacity = 'opacity-80 group-hover:opacity-100',
}: RoomCardProps) {
    const equipmentSummary = equipmentNames.join(', ');

    const getStatusBadge = () => {
        if (!status) {
            return null;
        }

        switch (status) {
            case 'available':
                return (
                    <div className="absolute top-4 right-4 bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 neo-border font-label-bold font-bold text-[14px] leading-[20px] rounded-DEFAULT flex items-center gap-1 shadow-[4px_4px_0px_0px_#000]">
                        <div className="w-2 h-2 rounded-full bg-on-tertiary-fixed animate-pulse"></div>
                        {statusLabel || 'Disponible'}
                    </div>
                );
            case 'occupied':
                return (
                    <div className="absolute top-4 right-4 bg-secondary-container text-on-secondary-container px-3 py-1 neo-border font-label-bold font-bold text-[14px] leading-[20px] rounded-DEFAULT flex items-center gap-1 shadow-[4px_4px_0px_0px_#000]">
                        <Icon name="schedule" className="text-[16px]" />
                        {statusLabel || 'Occupée'}
                    </div>
                );
            case 'upcoming':
                return (
                    <div className="absolute top-4 right-4 bg-secondary-fixed text-on-secondary-fixed px-3 py-1 neo-border font-label-bold font-bold text-[14px] leading-[20px] rounded-DEFAULT flex items-center gap-1 shadow-[4px_4px_0px_0px_#000]">
                        {statusLabel || 'À venir'}
                    </div>
                );
        }
    };

    return (
        <Card interactive className="group">
            <div className="h-40 bg-surface-variant border-b-[3px] border-on-surface relative overflow-hidden">
                {status === 'available' && id === 3 && (
                    <div className="absolute inset-0 bg-primary-container mix-blend-color"></div>
                )}
                <img
                    alt="Interieur de la salle"
                    className={`w-full h-full object-cover grayscale transition-all duration-300 ${
                        status === 'occupied'
                            ? 'mix-blend-multiply opacity-60'
                            : 'group-hover:grayscale-0 group-hover:scale-105'
                    } ${imageOpacity}`}
                    src={imageUrl}
                />
                {getStatusBadge()}
            </div>

            <CardContent>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-headline-md font-bold text-[24px] leading-none">{title}</h3>
                    <div className="flex items-center gap-1 bg-surface-container px-2 py-1 neo-border rounded-DEFAULT">
                        <Icon name="group" className="text-[18px]" />
                        <span className="font-label-bold font-bold text-[14px]">{capacity} pers.</span>
                    </div>
                </div>

                <p className="text-on-surface-variant font-body-md mb-6 flex items-center gap-2">
                    <Icon name="location_on" className="text-[18px]" />
                    {location}
                </p>

                {equipmentNames.length > 0 ? (
                    <div className="mb-6 flex items-center gap-2 min-w-0">
                        <p
                            title={equipmentSummary}
                            className="min-w-0 flex-1 truncate bg-surface-container px-3 py-2 neo-border rounded-DEFAULT font-body-md text-on-surface-variant"
                        >
                            {equipmentSummary}
                        </p>

                        {additionalEquipmentCount > 0 ? (
                            <span className="shrink-0 bg-secondary-container text-on-secondary-container px-3 py-2 neo-border rounded-DEFAULT font-label-bold font-bold text-[14px]">
                                +{additionalEquipmentCount}
                            </span>
                        ) : null}
                    </div>
                ) : null}

                <div className="mt-auto">
                    {actionLink ? (
                        <Link
                            to={actionLink}
                            className={`block w-full text-center font-label-bold font-bold text-[14px] py-3 neo-border neo-shadow transition-all rounded-DEFAULT ${
                                actionClass || 'bg-primary text-on-primary neo-shadow-hover neo-shadow-active'
                            }`}
                        >
                            {actionLabel}
                        </Link>
                    ) : (
                        <button
                            className={`w-full font-label-bold font-bold text-[14px] py-3 neo-border neo-shadow transition-all rounded-DEFAULT ${
                                actionClass || 'bg-primary text-on-primary neo-shadow-hover neo-shadow-active'
                            }`}
                        >
                            {actionLabel}
                        </button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}