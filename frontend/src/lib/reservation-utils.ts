import type { components } from '../api/schema.d.ts';

type Reservation = components['schemas']['Reservation'];
type Room = components['schemas']['Room'];
type Floor = components['schemas']['Floor'];
type Building = components['schemas']['Building'];
type User = components['schemas']['User'];

export type ReservationFeedbackType = '' | 'success' | 'error';

export function sortReservations(reservations: Reservation[]) {
    return [...reservations].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
}

export function formatDateTime(value: string) {
    return new Date(value).toLocaleString('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

export function formatTime(value: string) {
    return new Date(value).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatDayLabel(value: string) {
    return new Date(value).toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
    });
}

export function toDateTimeLocalValue(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function isSameMonth(value: string, referenceDate: Date) {
    const date = new Date(value);

    return date.getMonth() === referenceDate.getMonth() && date.getFullYear() === referenceDate.getFullYear();
}

export function getReservationStatus(reservation: Reservation) {
    const now = Date.now();
    const start = new Date(reservation.start_time).getTime();
    const end = new Date(reservation.end_time).getTime();

    if (start <= now && now < end) {
        return {
            label: 'En cours',
            className: 'bg-tertiary-fixed text-on-tertiary-fixed',
        };
    }

    if (now < start) {
        return {
            label: 'A venir',
            className: 'bg-secondary-fixed text-on-secondary-fixed',
        };
    }

    return {
        label: 'Passee',
        className: 'bg-surface-container-high text-on-surface',
    };
}

export function buildLocation(room: Room | null, floorById: Map<number, Floor>, buildingById: Map<number, Building>) {
    if (!room) {
        return 'Emplacement inconnu';
    }

    const floor = floorById.get(room.floor_id);
    if (!floor) {
        return 'Etage inconnu';
    }

    const building = buildingById.get(floor.building_id);
    if (!building) {
        return floor.name;
    }

    return `${building.name} - ${floor.name}`;
}

export function canCancelReservation(reservation: Reservation) {
    return Date.now() < new Date(reservation.start_time).getTime();
}

export function canModifyReservation(reservation: Reservation) {
    return canCancelReservation(reservation);
}

export function canManageReservation(user: User | null, reservation: Reservation) {
    return !!user && (user.role === 'ADMIN' || user.id === reservation.user_id);
}

export function getErrorCode(error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error) {
        return String(error.code);
    }

    return '';
}
