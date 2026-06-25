import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ManageableReservationCard } from '../components/reservation/ManageableReservationCard';
import { FavoriteRoomCard } from '../components/dashboard/FavoriteRoomCard';
import { FavoriteRemovalModal } from '../components/favorite/FavoriteRemovalModal';
import { Icon } from '../components/ui/Icon';
import { useToast } from '../components/ui/ToastProvider';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../api/client';
import type { components } from '../api/schema.d.ts';
import {
    formatTime,
    getErrorCode,
    isSameMonth,
    sortReservations,
} from '../lib/reservation-utils';

type Reservation = components['schemas']['Reservation'];
type Room = components['schemas']['Room'];
type Floor = components['schemas']['Floor'];
type Building = components['schemas']['Building'];
type Favorite = components['schemas']['Favorite'];

type FavoriteRoomToRemove = {
    roomId: number;
    title: string;
    location: string;
};

export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { pushToast } = useToast();

    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [floors, setFloors] = useState<Floor[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [favoriteLoadError, setFavoriteLoadError] = useState('');
    const [favoritePendingRoomId, setFavoritePendingRoomId] = useState<number | null>(null);
    const [favoriteRoomToRemove, setFavoriteRoomToRemove] = useState<FavoriteRoomToRemove | null>(null);

    const loadDashboard = async () => {
        if (!user) {
            setErrorMessage('Utilisateur introuvable.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setErrorMessage('');
        setFavoriteLoadError('');

        const [reservationsResponse, roomsResponse, floorsResponse, buildingsResponse, favoritesResponse] =
            await Promise.all([
                api.GET('/users/{userId}/reservations', {
                    params: {
                        path: {
                            userId: user.id,
                        },
                    },
                }),
                api.GET('/rooms'),
                api.GET('/floors'),
                api.GET('/buildings'),
                api.GET('/users/{userId}/favorites', {
                    params: {
                        path: {
                            userId: user.id,
                        },
                    },
                }),
            ]);

        const reservationErrorCode = getErrorCode(reservationsResponse.error);

        if (reservationErrorCode === 'UNAUTHORIZED') {
            navigate('/login', { replace: true });
            return;
        }

        if (
            reservationsResponse.error ||
            !reservationsResponse.data ||
            roomsResponse.error ||
            !roomsResponse.data ||
            floorsResponse.error ||
            !floorsResponse.data ||
            buildingsResponse.error ||
            !buildingsResponse.data
        ) {
            setReservations([]);
            setRooms([]);
            setFloors([]);
            setBuildings([]);
            setFavorites([]);
            setFavoriteLoadError('');
            setErrorMessage('Impossible de charger ton tableau de bord pour le moment.');
            setIsLoading(false);
            return;
        }

        setReservations(sortReservations(reservationsResponse.data));
        setRooms(roomsResponse.data);
        setFloors(floorsResponse.data);
        setBuildings(buildingsResponse.data);

        if (favoritesResponse.error || !favoritesResponse.data) {
            setFavorites([]);
            setFavoriteLoadError('Impossible de charger tes favoris pour le moment.');
        } else {
            setFavorites(favoritesResponse.data);
            setFavoriteLoadError('');
        }

        setIsLoading(false);
    };

    useEffect(() => {
        void loadDashboard();
    }, [user?.id]);

    if (!user) {
        return (
            <div className="flex flex-col gap-8 max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-12 w-full">
                <div className="bg-error-container text-on-error-container border-[3px] border-on-surface p-6 neo-shadow font-bold">
                    Utilisateur introuvable.
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-8 max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-12 w-full">
                <div className="bg-surface border-[3px] border-on-surface p-6 neo-shadow text-center font-bold">
                    Chargement du tableau de bord...
                </div>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="flex flex-col gap-8 max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-12 w-full">
                <div className="bg-error-container text-on-error-container border-[3px] border-on-surface p-6 neo-shadow font-bold">
                    {errorMessage}
                </div>

                <button
                    type="button"
                    onClick={() => void loadDashboard()}
                    className="w-fit bg-primary text-on-primary font-label-bold font-bold px-6 py-3 border-[3px] border-on-surface neo-shadow neo-shadow-active transition-transform flex items-center gap-2"
                >
                    <Icon name="refresh" />
                    Reessayer
                </button>
            </div>
        );
    }

    const floorById = new Map(floors.map((floor) => [floor.id, floor]));
    const buildingById = new Map(buildings.map((building) => [building.id, building]));

    const roomById = new Map(rooms.map((room) => [room.id, room]));

    const favoriteRooms = favorites
        .map((favorite) => {
            const room = roomById.get(favorite.room_id);

            if (!room) {
                return null;
            }

            const floor = floorById.get(room.floor_id);
            const building = floor ? buildingById.get(floor.building_id) : undefined;

            const locationParts = [building?.name, floor?.name].filter((value): value is string => Boolean(value));

            return {
                room,
                location: locationParts.length > 0 ? locationParts.join(' • ') : 'Localisation indisponible',
            };
        })
        .filter((item): item is { room: Room; location: string } => item !== null)
        .sort((a, b) => a.room.name.localeCompare(b.room.name));

    const now = Date.now();
    const referenceDate = new Date();

    const activeOrUpcomingReservations = reservations.filter(
        (reservation) => new Date(reservation.end_time).getTime() > now,
    );

    const recentPastReservations = [
        ...reservations.filter((reservation) => new Date(reservation.end_time).getTime() <= now),
    ].reverse();

    const reservationsThisMonth = reservations.filter((reservation) =>
        isSameMonth(reservation.start_time, referenceDate),
    ).length;

    const nextReservation = activeOrUpcomingReservations[0] ?? null;

    const handleReservationUpdated = (updatedReservation: Reservation) => {
        setReservations((current) =>
            sortReservations(current.map((item) => (item.id === updatedReservation.id ? updatedReservation : item))),
        );
    };

    const handleReservationDeleted = (deletedReservationId: number) => {
        setReservations((current) => current.filter((item) => item.id !== deletedReservationId));
    };

    const handleFeedback = (type: '' | 'success' | 'error', message: string) => {
    if (!type || !message) {
        return;
    }

    pushToast({
        type: type === 'success' ? 'success' : 'error',
        message,
    });
};

    const requestFavoriteRemoval = (roomId: number, title: string, location: string) => {
    setFavoriteRoomToRemove({
        roomId,
        title,
        location,
    });
};

    const handleRemoveFavorite = async () => {
    if (!user || !favoriteRoomToRemove) {
        return;
    }

    const roomId = favoriteRoomToRemove.roomId;
    setFavoritePendingRoomId(roomId);

    try {
        const { error } = await api.DELETE('/users/{userId}/favorites/{roomId}', {
            params: {
                path: {
                    userId: user.id,
                    roomId,
                },
            },
        });

        if (error) {
            const errorCode = getErrorCode(error);

            if (errorCode === 'UNAUTHORIZED') {
                navigate('/login', { replace: true });
                return;
            }

            if (errorCode === 'FAVORITE_NOT_FOUND') {
                setFavorites((current) => current.filter((favorite) => favorite.room_id !== roomId));
                setFavoriteRoomToRemove(null);
                pushToast({ type: 'info', message: "Ce favori n'existe plus." });
                return;
            }

            pushToast({ type: 'error', message: 'Impossible de retirer cette salle des favoris.' });
            return;
        }

        setFavorites((current) => current.filter((favorite) => favorite.room_id !== roomId));
        setFavoriteRoomToRemove(null);
        pushToast({ type: 'success', message: 'Salle retiree des favoris.' });
    } catch {
        pushToast({ type: 'error', message: 'La requete de favoris a echoue.' });
    } finally {
        setFavoritePendingRoomId(null);
    }
};

    return (
        <div className="flex flex-col gap-12 max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-12 w-full">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="font-headline-xl text-[48px] leading-[56px] font-black mb-2 text-on-surface">
                        Bonjour, {user.first_name}
                    </h1>
                    <p className="font-body-lg text-[18px] leading-[28px] font-medium text-on-surface-variant">
                        Voici le suivi de tes reservations et de tes prochains creneaux.
                    </p>
                </div>

                <Link
                    to="/"
                    className="font-label-bold font-bold bg-primary text-on-primary px-6 py-3 border-[3px] border-on-surface neo-shadow neo-shadow-active transition-transform flex items-center gap-2"
                >
                    <Icon name="add" fill />
                    Reserver une salle
                </Link>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                <div className="bg-secondary-container p-6 border-[3px] border-on-surface neo-shadow flex flex-col gap-2">
                    <Icon name="calendar_month" className="text-4xl text-on-secondary-container" />
                    <p className="font-headline-lg font-black text-[32px] text-on-secondary-container">
                        {reservationsThisMonth}
                    </p>
                    <p className="font-label-bold font-bold uppercase tracking-wide text-on-surface-variant">
                        Reservations ce mois-ci
                    </p>
                </div>

                <div className="bg-primary-fixed p-6 border-[3px] border-on-surface neo-shadow flex flex-col gap-2">
                    <Icon name="event_upcoming" className="text-4xl text-on-primary-fixed" />
                    <p className="font-headline-lg font-black text-[32px] text-on-primary-fixed">
                        {activeOrUpcomingReservations.length}
                    </p>
                    <p className="font-label-bold font-bold uppercase tracking-wide text-on-surface-variant">
                        Creneaux actifs ou a venir
                    </p>
                </div>

                <div className="bg-surface-container-highest p-6 border-[3px] border-on-surface neo-shadow flex flex-col gap-2">
                    <Icon name="schedule" className="text-4xl text-on-surface" />
                    <p className="font-headline-md font-black text-[24px] text-on-surface">
                        {nextReservation
                            ? `${formatTime(nextReservation.start_time)} - ${formatTime(nextReservation.end_time)}`
                            : 'Aucun'}
                    </p>
                    <p className="font-label-bold font-bold uppercase tracking-wide text-on-surface-variant">
                        Prochain creneau
                    </p>
                </div>
            </section>

            <section className="flex flex-col gap-6">
                <div className="flex flex-wrap justify-between items-center border-b-[3px] border-on-surface pb-4">
                    <h2 className="font-headline-lg font-black text-[32px] flex items-center gap-3">
                        <Icon name="event_upcoming" className="text-3xl" />
                        Reservations a venir
                    </h2>

                    <button
                        type="button"
                        onClick={() => void loadDashboard()}
                        className="bg-surface border-[3px] border-on-surface px-4 py-2 font-label-bold font-bold neo-shadow-sm neo-active-sm flex items-center gap-2"
                    >
                        <Icon name="refresh" />
                        Rafraichir
                    </button>
                </div>


                {activeOrUpcomingReservations.length === 0 ? (
                    <div className="bg-surface-container border-[3px] border-on-surface p-6 neo-shadow text-center">
                        <p className="font-headline-md font-bold text-[24px] text-on-surface mb-2">
                            Aucune reservation a venir
                        </p>
                        <p className="font-body-md text-on-surface-variant mb-6">
                            Tu peux reserver une salle depuis la page d'accueil ou depuis la fiche d'une salle.
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 bg-primary text-on-primary font-label-bold font-bold px-6 py-3 border-[3px] border-on-surface neo-shadow neo-shadow-active transition-transform"
                        >
                            <Icon name="search" />
                            Trouver une salle
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {activeOrUpcomingReservations.map((reservation) => (
                            <ManageableReservationCard
                                key={reservation.id}
                                reservation={reservation}
                                rooms={rooms}
                                floorById={floorById}
                                buildingById={buildingById}
                                user={user}
                                allowManage
                                allowRoomChange
                                onUpdated={handleReservationUpdated}
                                onDeleted={handleReservationDeleted}
                                onFeedback={handleFeedback}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Affichage des favoris */}
            <section className="flex flex-col gap-6">
                <div className="flex justify-between items-center border-b-[3px] border-on-surface pb-4">
                    <h2 className="font-headline-lg font-black text-[32px] flex items-center gap-3">
                        <Icon name="favorite" fill className="text-3xl" />
                        Salles favorites
                    </h2>

                    <p className="font-label-bold font-bold uppercase tracking-wide text-on-surface-variant">
                        {favoriteRooms.length} salle(s)
                    </p>
                </div>

                {favoriteLoadError ? (
                    <div className="bg-error-container text-on-error-container border-[3px] border-on-surface p-6 neo-shadow flex flex-col gap-4">
                        <p className="font-bold">{favoriteLoadError}</p>

                        <button
                            type="button"
                            onClick={() => void loadDashboard()}
                            className="w-fit bg-surface text-on-surface font-label-bold font-bold px-4 py-2 border-[3px] border-on-surface neo-shadow-sm neo-active-sm flex items-center gap-2"
                        >
                            <Icon name="refresh" />
                            Reessayer
                        </button>
                    </div>
                ) : favoriteRooms.length === 0 ? (
                    <div className="bg-surface-container border-[3px] border-on-surface p-6 neo-shadow text-center">
                        <p className="font-headline-md font-bold text-[24px] text-on-surface mb-2">
                            Aucune salle favorite
                        </p>

                        <p className="font-body-md text-on-surface-variant mb-6">
                            Ajoute des salles en favoris depuis leur fiche pour les retrouver ici rapidement.
                        </p>

                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 bg-primary text-on-primary font-label-bold font-bold px-6 py-3 border-[3px] border-on-surface neo-shadow neo-shadow-active transition-transform"
                        >
                            <Icon name="search" />
                            Explorer les salles
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
                        {favoriteRooms.map(({ room, location }) => (
                            <FavoriteRoomCard
                                key={room.id}
                                id={room.id}
                                title={room.name}
                                location={location}
                                icon="meeting_room"
                                iconBgClass="bg-secondary-container"
                                isRemovingFavorite={favoritePendingRoomId === room.id}
                                onRemoveFavorite={() => requestFavoriteRemoval(room.id, room.name, location)}
                            />
                        ))}
                    </div>
                )}
            </section>

            <section className="flex flex-col gap-6">
                <div className="border-b-[3px] border-on-surface pb-4">
                    <h2 className="font-headline-lg font-black text-[32px] flex items-center gap-3">
                        <Icon name="schedule" className="text-3xl" />
                        Historique recent
                    </h2>
                </div>

                {recentPastReservations.length === 0 ? (
                    <div className="bg-surface-container border-[3px] border-on-surface p-6 neo-shadow text-center font-bold">
                        Aucune reservation passee pour le moment.
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {recentPastReservations.slice(0, 3).map((reservation) => (
                            <ManageableReservationCard
                                key={reservation.id}
                                reservation={reservation}
                                rooms={rooms}
                                floorById={floorById}
                                buildingById={buildingById}
                                user={user}
                                onUpdated={handleReservationUpdated}
                                onDeleted={handleReservationDeleted}
                            />
                        ))}
                    </div>
                )}
            </section>
            <FavoriteRemovalModal
                open={favoriteRoomToRemove !== null}
                roomName={favoriteRoomToRemove?.title ?? ''}
                location={favoriteRoomToRemove?.location}
                isPending={favoriteRoomToRemove !== null && favoritePendingRoomId === favoriteRoomToRemove.roomId}
                onClose={() => setFavoriteRoomToRemove(null)}
                onConfirm={() => void handleRemoveFavorite()}
            />
        </div>
    );
}
