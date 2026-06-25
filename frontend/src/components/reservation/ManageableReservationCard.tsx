import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { components } from '../../api/schema.d.ts';
import {
    buildLocation,
    canCancelReservation,
    canManageReservation,
    canModifyReservation,
    formatDateTime,
    formatDayLabel,
    formatTime,
    getErrorCode,
    getReservationStatus,
    toDateTimeLocalValue,
    type ReservationFeedbackType,
} from '../../lib/reservation-utils';
import { Icon } from '../ui/Icon';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

type Reservation = components['schemas']['Reservation'];
type Room = components['schemas']['Room'];
type Floor = components['schemas']['Floor'];
type Building = components['schemas']['Building'];
type User = components['schemas']['User'];

type ManageableReservationCardProps = {
    reservation: Reservation;
    rooms: Room[];
    floorById: Map<number, Floor>;
    buildingById: Map<number, Building>;
    user: User | null;
    allowManage?: boolean;
    allowRoomChange?: boolean;
    showRoomLink?: boolean;
    showLocation?: boolean;
    onUpdated: (reservation: Reservation) => void;
    onDeleted: (reservationId: number) => void;
    onFeedback?: (type: ReservationFeedbackType, message: string) => void;
};

export function ManageableReservationCard({
    reservation,
    rooms,
    floorById,
    buildingById,
    user,
    allowManage = false,
    allowRoomChange = true,
    showRoomLink = true,
    showLocation = true,
    onUpdated,
    onDeleted,
    onFeedback,
}: ManageableReservationCardProps) {
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [editRoomId, setEditRoomId] = useState('');
    const [editStartTime, setEditStartTime] = useState('');
    const [editEndTime, setEditEndTime] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const room = reservation.room_id != null ? (rooms.find((item) => item.id === reservation.room_id) ?? null) : null;
    const roomTitle =
        room != null ? room.name : reservation.room_id != null ? `Salle #${reservation.room_id}` : 'Salle inconnue';
    const location = buildLocation(room, floorById, buildingById);
    const status = getReservationStatus(reservation);

    const hasManageAccess = allowManage && canManageReservation(user, reservation);
    const isEditable = hasManageAccess && canModifyReservation(reservation);
    const isCancelable = hasManageAccess && canCancelReservation(reservation);
    const isCurrentlyRunning =
        new Date(reservation.start_time).getTime() <= Date.now() &&
        Date.now() < new Date(reservation.end_time).getTime();

    const editableRooms = allowRoomChange ? rooms : rooms.filter((candidate) => candidate.id === reservation.room_id);

    const pushFeedback = (type: ReservationFeedbackType, message: string) => {
        onFeedback?.(type, message);
    };

    const startEditing = () => {
        if (!isEditable) {
            pushFeedback('error', 'Seules les reservations a venir peuvent etre modifiees.');
            return;
        }

        pushFeedback('', '');
        setIsEditing(true);
        setEditRoomId(String(reservation.room_id ?? editableRooms[0]?.id ?? ''));
        setEditStartTime(toDateTimeLocalValue(reservation.start_time));
        setEditEndTime(toDateTimeLocalValue(reservation.end_time));
    };

    const resetEditing = () => {
        setIsEditing(false);
        setEditRoomId('');
        setEditStartTime('');
        setEditEndTime('');
        setIsSavingEdit(false);
    };

    const closeEditModal = () => {
        if (isSavingEdit) {
            return;
        }

        resetEditing();
    };

    const handleSaveEdit = async () => {
        if (!isEditable) {
            pushFeedback('error', 'Cette reservation ne peut plus etre modifiee.');
            return;
        }

        const selectedRoomId = allowRoomChange
            ? Number(editRoomId)
            : (reservation.room_id ?? editableRooms[0]?.id ?? null);

        if (!selectedRoomId || Number.isNaN(selectedRoomId)) {
            pushFeedback('error', 'Selectionne une salle valide.');
            return;
        }

        if (!editStartTime || !editEndTime) {
            pushFeedback('error', 'Renseigne une date de debut et une date de fin.');
            return;
        }

        const nextStartDate = new Date(editStartTime);
        const nextEndDate = new Date(editEndTime);

        if (Number.isNaN(nextStartDate.getTime()) || Number.isNaN(nextEndDate.getTime())) {
            pushFeedback('error', 'Les dates saisies sont invalides.');
            return;
        }

        if (nextStartDate >= nextEndDate) {
            pushFeedback('error', 'La fin doit etre apres le debut.');
            return;
        }

        if (nextStartDate.getTime() <= Date.now()) {
            pushFeedback('error', 'Le nouveau debut doit rester dans le futur.');
            return;
        }

        setIsSavingEdit(true);
        pushFeedback('', '');

        try {
            const { data, error } = await api.PUT('/reservations/{id}', {
                params: {
                    path: {
                        id: reservation.id,
                    },
                },
                body: {
                    room_id: selectedRoomId,
                    start_time: nextStartDate.toISOString(),
                    end_time: nextEndDate.toISOString(),
                },
            });

            const errorCode = getErrorCode(error);

            if (errorCode === 'UNAUTHORIZED') {
                navigate('/login', { replace: true });
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', "Tu n'as pas le droit de modifier cette reservation.");
                } else if (errorCode === 'ROOM_NOT_AVAILABLE') {
                    pushFeedback('error', "La salle n'est pas disponible sur ce nouveau creneau.");
                } else if (errorCode === 'ROOM_NOT_FOUND') {
                    pushFeedback('error', "La salle selectionnee n'existe plus.");
                } else if (errorCode === 'RESERVATION_NOT_FOUND') {
                    pushFeedback('error', "Cette reservation n'existe plus.");
                } else if (errorCode === 'INVALID_DATE_RANGE') {
                    pushFeedback('error', 'Le creneau modifie est invalide.');
                } else {
                    pushFeedback('error', 'Impossible de modifier la reservation pour le moment.');
                }

                return;
            }

            if (!data) {
                pushFeedback('error', 'La reponse du serveur est invalide.');
                return;
            }

            onUpdated(data);
            resetEditing();
            pushFeedback('success', 'La reservation a bien ete modifiee.');
        } catch {
            pushFeedback('error', 'La requete de modification a echoue.');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleCancel = async () => {
        if (!isCancelable) {
            pushFeedback('error', 'Seules les reservations a venir peuvent etre annulees.');
            return;
        }

        const confirmed = window.confirm(
            `Annuler la reservation de ${roomTitle} du ${formatDateTime(reservation.start_time)} ?`,
        );

        if (!confirmed) {
            return;
        }

        setIsCancelling(true);
        pushFeedback('', '');

        try {
            const { error } = await api.DELETE('/reservations/{id}', {
                params: {
                    path: {
                        id: reservation.id,
                    },
                },
            });

            const errorCode = getErrorCode(error);

            if (errorCode === 'UNAUTHORIZED') {
                navigate('/login', { replace: true });
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', "Tu n'as pas le droit d'annuler cette reservation.");
                } else if (errorCode === 'RESERVATION_NOT_FOUND') {
                    pushFeedback('error', "Cette reservation n'existe plus.");
                } else {
                    pushFeedback('error', "Impossible d'annuler la reservation pour le moment.");
                }

                return;
            }

            onDeleted(reservation.id);
            pushFeedback('success', 'La reservation a bien ete annulee.');
        } catch {
            pushFeedback('error', "La requete d'annulation a echoue.");
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <article className="bg-surface-container-lowest border-[3px] border-on-surface neo-shadow flex flex-col">
            <div className="p-6 flex flex-col justify-center items-center border-b-[3px] md:border-b-0 md:border-r-[3px] border-on-surface bg-primary-fixed text-on-primary-fixed">
                <span className="font-headline-xl font-black text-[42px] leading-none">
                    {formatTime(reservation.start_time)}
                </span>
                <span className="font-label-bold font-bold uppercase mt-2">
                    {formatDayLabel(reservation.start_time)}
                </span>
            </div>

            <div className="p-6 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <p className="font-label-bold font-bold text-on-surface-variant uppercase mb-1">
                            Reservation #{reservation.id}
                        </p>
                        <h3 className="font-headline-md font-bold text-[24px] text-on-surface">{roomTitle}</h3>
                        {showLocation ? <p className="font-body-md text-on-surface-variant">{location}</p> : null}
                    </div>

                    <span
                        className={`${status.className} font-label-bold font-bold px-3 py-1 border-[3px] border-on-surface text-xs uppercase w-fit`}
                    >
                        {status.label}
                    </span>
                </div>

                <div className="flex flex-col gap-2 text-sm font-medium text-on-surface-variant">
                    <p className="flex items-center gap-2">
                        <Icon name="schedule" className="text-sm" />
                        {formatDateTime(reservation.start_time)} - {formatDateTime(reservation.end_time)}
                    </p>

                    <p className="flex items-center gap-2">
                        <Icon name="groups" className="text-sm" />
                        Capacite : {room?.capacity ?? 'Inconnue'}
                    </p>
                </div>

                {isEditing ? (
                    <Modal
                        open={isEditing}
                        onClose={closeEditModal}
                        title="Modifier la reservation"
                        description="Tu peux ajuster la salle et le creneau tant que la reservation est encore a venir."
                        className="max-w-2xl"
                        footer={
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeEditModal}
                                    disabled={isSavingEdit}
                                >
                                    Annuler
                                </Button>

                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={() => void handleSaveEdit()}
                                    disabled={isSavingEdit}
                                >
                                    <Icon name="edit_calendar" />
                                    {isSavingEdit ? 'Enregistrement...' : 'Enregistrer les modifications'}
                                </Button>
                            </>
                        }
                    >
                        <div className="flex flex-col gap-4">
                            <div className="border-[3px] border-on-surface bg-surface-container-lowest p-4">
                                <p className="font-label-bold font-bold uppercase text-on-surface-variant">
                                    Reservation #{reservation.id}
                                </p>
                                <p className="mt-2 font-headline-md font-bold text-[24px] text-on-surface">
                                    {roomTitle}
                                </p>
                                <p className="mt-1 font-body-md text-on-surface-variant">
                                    {formatDateTime(reservation.start_time)} - {formatDateTime(reservation.end_time)}
                                </p>
                                {showLocation ? (
                                    <p className="mt-1 font-body-md text-on-surface-variant">{location}</p>
                                ) : null}
                            </div>

                            {allowRoomChange ? (
                                <div className="flex flex-col gap-2">
                                    <label className="font-label-bold font-bold text-on-surface-variant">Salle</label>
                                    <select
                                        value={editRoomId}
                                        onChange={(event) => setEditRoomId(event.target.value)}
                                        disabled={isSavingEdit}
                                        className="w-full h-12 bg-white px-3 py-2 text-base neo-border shadow-[4px_4px_0px_0px_#1A1D5C] focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_#1A1D5C] transition-all disabled:cursor-not-allowed disabled:opacity-50 font-body appearance-none cursor-pointer"
                                    >
                                        {editableRooms.map((availableRoom) => (
                                            <option key={availableRoom.id} value={String(availableRoom.id)}>
                                                {availableRoom.name} -{' '}
                                                {buildLocation(availableRoom, floorById, buildingById)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <label className="font-label-bold font-bold text-on-surface-variant">Salle</label>
                                    <div className="bg-surface-container border-[3px] border-on-surface px-3 py-3 font-body">
                                        {roomTitle}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="font-label-bold font-bold text-on-surface-variant">Debut</label>
                                    <Input
                                        type="datetime-local"
                                        value={editStartTime}
                                        onChange={(event) => setEditStartTime(event.target.value)}
                                        disabled={isSavingEdit}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="font-label-bold font-bold text-on-surface-variant">Fin</label>
                                    <Input
                                        type="datetime-local"
                                        value={editEndTime}
                                        onChange={(event) => setEditEndTime(event.target.value)}
                                        min={editStartTime || undefined}
                                        disabled={isSavingEdit}
                                    />
                                </div>
                            </div>
                        </div>
                    </Modal>
                ) : null}

                <div className="flex flex-wrap gap-3 pt-2">
                    {showRoomLink ? (
                        room ? (
                            <Link
                                to={`/room/${room.id}`}
                                className="bg-primary text-on-primary font-label-bold font-bold px-4 py-2 border-[3px] border-on-surface neo-shadow-sm neo-active-sm"
                            >
                                Voir la salle
                            </Link>
                        ) : (
                            <span className="bg-surface-container border-[3px] border-on-surface px-4 py-2 font-label-bold font-bold opacity-70">
                                Salle indisponible
                            </span>
                        )
                    ) : null}

                    {isEditable && !isEditing ? (
                        <button
                            type="button"
                            onClick={startEditing}
                            className="bg-secondary-fixed text-on-secondary-fixed font-label-bold font-bold px-4 py-2 border-[3px] border-on-surface neo-shadow-sm neo-active-sm"
                        >
                            Modifier
                        </button>
                    ) : null}

                    {isCancelable && !isEditing ? (
                        <button
                            type="button"
                            onClick={() => void handleCancel()}
                            disabled={isCancelling}
                            className="bg-error-container text-on-error-container font-label-bold font-bold px-4 py-2 border-[3px] border-on-surface neo-shadow-sm neo-active-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isCancelling ? 'Annulation...' : 'Annuler'}
                        </button>
                    ) : null}

                    {hasManageAccess && isCurrentlyRunning ? (
                        <span className="bg-surface-container border-[3px] border-on-surface px-4 py-2 font-label-bold font-bold opacity-70">
                            Creneau deja demarre
                        </span>
                    ) : null}
                </div>
            </div>
        </article>
    );
}
