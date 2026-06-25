import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ManageableReservationCard } from '../components/reservation/ManageableReservationCard';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/ToastProvider';
import { FavoriteRemovalModal } from '../components/favorite/FavoriteRemovalModal';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthProvider';
import type { components } from '../api/schema.d.ts';
import {
    formatDateTime,
    formatTime,
    getErrorCode,
    sortReservations,
    type ReservationFeedbackType,
} from '../lib/reservation-utils';

type Room = components['schemas']['Room'];
type Floor = components['schemas']['Floor'];
type Building = components['schemas']['Building'];
type Reservation = components['schemas']['Reservation'];
type RoomResourceAssignment = components['schemas']['RoomResourceAssignment'];
type RoomUnavailability = components['schemas']['RoomUnavailability'];
type Incident = components['schemas']['Incident'];
type Favorite = components['schemas']['Favorite'];

const DEFAULT_ROOM_IMAGE =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBj_Du02t8DnsMWBYEBKf9pCPKNAbd0iYg8_sUOwl0lpV24139q56j9DtewlMSeCZmaZha_00vwrWf6TNPwK99E3yK5w8gMuQTE-DCv7DKu9hCS8bUpyOAfKkTcypQi-dN4mzokvxf_B1FAMUNz3SMSxJLPITAqXaOLeqC9_-4MMfinKsQTXCYYlKZCIoTvOitVo8lDRcWbP9Fi7NTkGnc-_2tmICURnkQT9-8zcKTTfvMsJE5a3kKU7Gz_WOMQ4ZAQ4RNYmq3ndUiH';

const textareaClassName =
    'w-full min-h-28 bg-white px-3 py-2 text-base neo-border shadow-[4px_4px_0px_0px_#1A1D5C] focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_#1A1D5C] transition-all disabled:cursor-not-allowed disabled:opacity-50 font-body resize-y';

function sortUnavailabilities(unavailabilities: RoomUnavailability[]) {
    return [...unavailabilities].sort((a, b) => new Date(a.from_time).getTime() - new Date(b.from_time).getTime());
}

function sortIncidents(incidents: Incident[]) {
    const statusWeight: Record<Incident['status'], number> = {
        OPEN: 0,
        IN_PROGRESS: 1,
        RESOLVED: 2,
    };

    return [...incidents].sort((a, b) => {
        const statusDiff = statusWeight[a.status] - statusWeight[b.status];

        if (statusDiff !== 0) {
            return statusDiff;
        }

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}

function getActiveUnavailability(unavailabilities: RoomUnavailability[]) {
    const now = Date.now();

    return unavailabilities.find((item) => {
        const from = new Date(item.from_time).getTime();
        const to = new Date(item.to_time).getTime();

        return from <= now && now < to;
    });
}

function getRoomStatus(reservations: Reservation[], unavailabilities: RoomUnavailability[]) {
    const activeUnavailability = getActiveUnavailability(unavailabilities);

    if (activeUnavailability) {
        return {
            variant: 'danger' as const,
            label: `Indisponible jusqu'a ${formatTime(activeUnavailability.to_time)}`,
        };
    }

    const now = Date.now();

    const activeReservation = reservations.find((reservation) => {
        const start = new Date(reservation.start_time).getTime();
        const end = new Date(reservation.end_time).getTime();
        return start <= now && now < end;
    });

    if (activeReservation) {
        return {
            variant: 'warning' as const,
            label: `Occupee jusqu'a ${formatTime(activeReservation.end_time)}`,
        };
    }

    return {
        variant: 'success' as const,
        label: 'Disponible maintenant',
    };
}

function getNextReservation(reservations: Reservation[]) {
    const now = Date.now();

    return reservations.find((reservation) => new Date(reservation.end_time).getTime() > now);
}

function getIncidentBadgeVariant(status: Incident['status']) {
    if (status === 'OPEN') {
        return 'danger' as const;
    }

    if (status === 'IN_PROGRESS') {
        return 'warning' as const;
    }

    return 'success' as const;
}

function getIncidentStatusLabel(status: Incident['status']) {
    if (status === 'OPEN') {
        return 'Ouvert';
    }

    if (status === 'IN_PROGRESS') {
        return 'En cours';
    }

    return 'Resolue';
}

export default function RoomDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, status } = useAuth();
    const { pushToast } = useToast();

    const roomId = Number(id);
    const hasValidRoomId = Number.isInteger(roomId) && roomId > 0;

    const [room, setRoom] = useState<Room | null>(null);
    const [floors, setFloors] = useState<Floor[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [resources, setResources] = useState<RoomResourceAssignment[]>([]);
    const [unavailabilities, setUnavailabilities] = useState<RoomUnavailability[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [pageWarningMessage, setPageWarningMessage] = useState('');

    // const [submitMessage, setSubmitMessage] = useState('');
    // const [submitMessageType, setSubmitMessageType] = useState<ReservationFeedbackType>('');
    // const [reservationFeedbackMessage, setReservationFeedbackMessage] = useState('');
    // const [reservationFeedbackType, setReservationFeedbackType] = useState<ReservationFeedbackType>('');
    // const [favoriteMessage, setFavoriteMessage] = useState('');
    // const [favoriteMessageType, setFavoriteMessageType] = useState<ReservationFeedbackType>('');
    // const [incidentMessage, setIncidentMessage] = useState('');
    // const [incidentMessageType, setIncidentMessageType] = useState<ReservationFeedbackType>('');

    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isFavorite, setIsFavorite] = useState(false);
    const [isFavoritePending, setIsFavoritePending] = useState(false);
    const [isFavoriteRemovalModalOpen, setIsFavoriteRemovalModalOpen] = useState(false);

    const [incidentTitle, setIncidentTitle] = useState('');
    const [incidentDescription, setIncidentDescription] = useState('');
    const [isIncidentSubmitting, setIsIncidentSubmitting] = useState(false);

    const loadRoomDetails = async () => {
        if (!hasValidRoomId) {
            setErrorMessage('Identifiant de salle invalide.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setErrorMessage('');
        setPageWarningMessage('');

        const [
            roomResponse,
            reservationsResponse,
            floorsResponse,
            buildingsResponse,
            resourcesResponse,
            unavailabilitiesResponse,
            incidentsResponse,
        ] = await Promise.all([
            api.GET('/rooms/{id}', {
                params: { path: { id: roomId } },
            }),
            api.GET('/rooms/{roomId}/reservations', {
                params: { path: { roomId } },
            }),
            api.GET('/floors'),
            api.GET('/buildings'),
            api.GET('/rooms/{roomId}/resources', {
                params: { path: { roomId } },
            }),
            api.GET('/rooms/{roomId}/unavailabilities', {
                params: { path: { roomId } },
            }),
            api.GET('/rooms/{roomId}/incidents', {
                params: { path: { roomId } },
            }),
        ]);

        if (roomResponse.error || !roomResponse.data) {
            setRoom(null);
            setErrorMessage('Salle introuvable ou impossible a charger.');
            setIsLoading(false);
            return;
        }

        if (
            reservationsResponse.error ||
            !reservationsResponse.data ||
            floorsResponse.error ||
            !floorsResponse.data ||
            buildingsResponse.error ||
            !buildingsResponse.data
        ) {
            setRoom(null);
            setErrorMessage('Impossible de charger les details principaux de la salle.');
            setIsLoading(false);
            return;
        }

        const warnings: string[] = [];

        if (resourcesResponse.error || !resourcesResponse.data) {
            setResources([]);
            warnings.push('ressources');
        } else {
            setResources(resourcesResponse.data);
        }

        if (unavailabilitiesResponse.error || !unavailabilitiesResponse.data) {
            setUnavailabilities([]);
            warnings.push('indisponibilites');
        } else {
            setUnavailabilities(sortUnavailabilities(unavailabilitiesResponse.data));
        }

        if (incidentsResponse.error || !incidentsResponse.data) {
            setIncidents([]);
            warnings.push('incidents');
        } else {
            setIncidents(sortIncidents(incidentsResponse.data));
        }

        if (warnings.length > 0) {
            setPageWarningMessage(
                `Certaines informations secondaires n'ont pas pu etre chargees : ${warnings.join(', ')}.`,
            );
        }

        setRoom(roomResponse.data);
        setReservations(sortReservations(reservationsResponse.data));
        setFloors(floorsResponse.data);
        setBuildings(buildingsResponse.data);
        setIsLoading(false);
    };

    useEffect(() => {
        void loadRoomDetails();
    }, [id, user?.id, status]);

    useEffect(() => {
        let isActive = true;

        const syncFavoriteState = async () => {
            if (!hasValidRoomId) {
                if (isActive) {
                    setIsFavorite(false);
                }
                return;
            }

            if (status !== 'authenticated' || !user) {
                if (isActive) {
                    setIsFavorite(false);
                }
                return;
            }

            const { data, error } = await api.GET('/users/{userId}/favorites', {
                params: {
                    path: {
                        userId: user.id,
                    },
                },
            });

            if (!isActive || error || !data) {
                return;
            }

            const favorites = data as Favorite[];
            setIsFavorite(favorites.some((favorite) => favorite.room_id === roomId));
        };

        void syncFavoriteState();

        return () => {
            isActive = false;
        };
    }, [hasValidRoomId, roomId, status, user?.id]);

    const floor = room ? (floors.find((item) => item.id === room.floor_id) ?? null) : null;
    const building = floor ? (buildings.find((item) => item.id === floor.building_id) ?? null) : null;
    const favoriteLocationLabel = `${building?.name ?? 'Batiment inconnu'}, ${floor?.name ?? 'Etage inconnu'}`;

    const floorById = new Map(floors.map((item) => [item.id, item]));
    const buildingById = new Map(buildings.map((item) => [item.id, item]));
    const roomOptions = room ? [room] : [];

    const statusBadge = getRoomStatus(reservations, unavailabilities);
    const nextReservation = getNextReservation(reservations);
    const currentUnavailability = getActiveUnavailability(unavailabilities);
    const visibleUnavailabilities = unavailabilities.filter((item) => new Date(item.to_time).getTime() > Date.now());
    const activeIncidents = incidents.filter((incident) => incident.status !== 'RESOLVED');
    const visibleIncidents = activeIncidents.length > 0 ? activeIncidents : incidents.slice(0, 3);

    const handleReserve = async () => {
        if (!room) {
            return;
        }

        if (status === 'loading') {
            return;
        }

        if (status !== 'authenticated' || !user) {
            navigate('/login');
            return;
        }

        if (!startTime || !endTime) {
            pushToast({ type: 'error', message: 'Renseigne un debut et une fin pour reserver.' });
            return;
        }

        if (new Date(startTime) >= new Date(endTime)) {
            pushToast({ type: 'error', message: 'La fin doit etre apres le debut.' });
            return;
        }

        setIsSubmitting(true);

        const { data, error } = await api.POST('/reservations', {
            body: {
                room_id: room.id,
                start_time: new Date(startTime).toISOString(),
                end_time: new Date(endTime).toISOString(),
            },
        });

        const errorCode = getErrorCode(error);

        if (errorCode === 'UNAUTHORIZED') {
            pushToast({ type: 'error', message: 'Ta session a expire. Reconnecte-toi.' });
            navigate('/login');
            setIsSubmitting(false);
            return;
        }

        if (error) {
            if (errorCode === 'ROOM_NOT_AVAILABLE') {
                pushToast({ type: 'error', message: "La salle n'est pas disponible sur ce creneau." });
            } else if (errorCode === 'INVALID_DATE_RANGE') {
                pushToast({ type: 'error', message: 'Le creneau est invalide.' });
            } else {
                pushToast({ type: 'error', message: 'Impossible de creer la reservation.' });
            }

            setIsSubmitting(false);
            return;
        }

        if (data) {
            pushToast({ type: 'success', message: 'Reservation creee avec succes.' });
            setStartTime('');
            setEndTime('');
            await loadRoomDetails();
        }

        setIsSubmitting(false);
    };

    const handleFavoriteButtonClick = () => {
        if (status === 'loading') {
            return;
        }

        if (status !== 'authenticated' || !user) {
            navigate('/login');
            return;
        }

        if (isFavorite) {
            setIsFavoriteRemovalModalOpen(true);
            return;
        }

        void handleAddFavorite();
    };

    const handleAddFavorite = async () => {
        if (!room || !user) {
            return;
        }

        setIsFavoritePending(true);

        try {
            const { error } = await api.POST('/favorites', {
                body: {
                    room_id: room.id,
                },
            });

            const errorCode = getErrorCode(error);

            if (errorCode === 'UNAUTHORIZED') {
                navigate('/login');
                return;
            }

            if (error) {
                if (errorCode === 'FAVORITE_ALREADY_EXISTS') {
                    setIsFavorite(true);
                    pushToast({ type: 'info', message: 'Cette salle est deja dans tes favoris.' });
                } else if (errorCode === 'ROOM_NOT_FOUND') {
                    pushToast({ type: 'error', message: "Cette salle n'existe plus." });
                } else {
                    pushToast({ type: 'error', message: "Impossible d'ajouter cette salle aux favoris." });
                }

                return;
            }

            setIsFavorite(true);
            pushToast({ type: 'success', message: 'Salle ajoutee aux favoris.' });
        } catch {
            pushToast({ type: 'error', message: 'La requete de favoris a echoue.' });
        } finally {
            setIsFavoritePending(false);
        }
    };

    const handleRemoveFavorite = async () => {
        if (!room || !user) {
            return;
        }

        setIsFavoritePending(true);

        try {
            const { error } = await api.DELETE('/users/{userId}/favorites/{roomId}', {
                params: {
                    path: {
                        userId: user.id,
                        roomId: room.id,
                    },
                },
            });

            const errorCode = getErrorCode(error);

            if (errorCode === 'UNAUTHORIZED') {
                navigate('/login');
                return;
            }

            if (error) {
                if (errorCode === 'FAVORITE_NOT_FOUND') {
                    setIsFavorite(false);
                    setIsFavoriteRemovalModalOpen(false);
                    pushToast({ type: 'info', message: "Ce favori n'existe plus." });
                } else {
                    pushToast({ type: 'error', message: 'Impossible de retirer cette salle des favoris.' });
                }

                return;
            }

            setIsFavorite(false);
            setIsFavoriteRemovalModalOpen(false);
            pushToast({ type: 'success', message: 'Salle retiree des favoris.' });
        } catch {
            pushToast({ type: 'error', message: 'La requete de favoris a echoue.' });
        } finally {
            setIsFavoritePending(false);
        }
    };

    const handleCreateIncident = async () => {
        if (!room) {
            return;
        }

        if (status === 'loading') {
            return;
        }

        if (status !== 'authenticated' || !user) {
            navigate('/login');
            return;
        }

        const trimmedTitle = incidentTitle.trim();
        const trimmedDescription = incidentDescription.trim();

        if (!trimmedTitle) {
            pushToast({ type: 'error', message: 'Le titre du signalement est obligatoire.' });
            return;
        }

        setIsIncidentSubmitting(true);

        try {
            const { data, error } = await api.POST('/incidents', {
                body: {
                    room_id: room.id,
                    title: trimmedTitle,
                    ...(trimmedDescription ? { description: trimmedDescription } : {}),
                },
            });

            const errorCode = getErrorCode(error);

            if (errorCode === 'UNAUTHORIZED') {
                navigate('/login');
                return;
            }

            if (error) {
                if (errorCode === 'ROOM_NOT_FOUND') {
                    pushToast({ type: 'error', message: "Cette salle n'existe plus." });
                } else {
                    pushToast({ type: 'error', message: 'Impossible de creer le signalement.' });
                }

                return;
            }

            if (!data) {
                pushToast({ type: 'error', message: 'La reponse du serveur est invalide.' });
                return;
            }

            setIncidents((current) => sortIncidents([data, ...current]));
            setIncidentTitle('');
            setIncidentDescription('');
            pushToast({ type: 'success', message: 'Signalement envoye avec succes.' });
        } catch {
            pushToast({ type: 'error', message: 'La requete de signalement a echoue.' });
        } finally {
            setIsIncidentSubmitting(false);
        }
    };

    const handleReservationUpdated = (updatedReservation: Reservation) => {
        setReservations((current) =>
            sortReservations(current.map((item) => (item.id === updatedReservation.id ? updatedReservation : item))),
        );
    };

    const handleReservationDeleted = (deletedReservationId: number) => {
        setReservations((current) => current.filter((item) => item.id !== deletedReservationId));
    };

    const handleReservationFeedback = (type: ReservationFeedbackType, message: string) => {
        if (!type || !message) {
            return;
        }

        pushToast({
            type: type === 'success' ? 'success' : 'error',
            message,
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-12">
                <div className="bg-surface border-[3px] border-on-surface p-6 neo-shadow text-center font-bold">
                    Chargement des details de la salle...
                </div>
            </div>
        );
    }

    if (errorMessage || !room) {
        return (
            <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-12">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 font-label-bold font-bold hover:text-primary transition-colors"
                >
                    <Icon name="arrow_back" />
                    Retour a la recherche
                </Link>

                <div className="bg-error-container text-on-error-container border-[3px] border-on-surface p-6 neo-shadow font-bold">
                    {errorMessage || 'Salle introuvable.'}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-12">
            <Link
                to="/"
                className="inline-flex items-center gap-2 font-label-bold font-bold hover:text-primary transition-colors"
            >
                <Icon name="arrow_back" />
                Retour a la recherche
            </Link>

            {pageWarningMessage ? (
                <div className="bg-secondary-fixed text-on-secondary-fixed border-[3px] border-on-surface p-4 neo-shadow font-bold">
                    {pageWarningMessage}
                </div>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                <div className="lg:col-span-8 flex flex-col gap-8">
                    <div className="bg-surface border-[3px] border-on-surface p-6 neo-shadow">
                        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                            <div>
                                <h1 className="font-headline-xl text-[48px] leading-[56px] font-black text-on-surface uppercase mb-2">
                                    {room.name}
                                </h1>
                                <p className="font-body-lg text-[18px] leading-[28px] font-medium text-on-surface-variant">
                                    {building?.name ?? 'Batiment inconnu'}, {floor?.name ?? 'Etage inconnu'}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4 items-start">
                                <Badge
                                    variant={statusBadge.variant}
                                    className="py-2 px-4 shadow-[4px_4px_0px_0px_#000]"
                                >
                                    <span className="w-3 h-3 bg-current rounded-full border-2 border-on-surface"></span>
                                    {statusBadge.label}
                                </Badge>

                                <button
                                    type="button"
                                    onClick={handleFavoriteButtonClick}
                                    disabled={isFavoritePending || status === 'loading'}
                                    aria-pressed={isFavorite}
                                    className={`min-h-12 inline-flex items-center gap-3 border-[3px] border-on-surface px-4 font-label-bold font-bold ${
                                        isFavorite
                                            ? 'bg-error-container text-on-error-container neo-shadow'
                                            : 'bg-surface text-on-surface neo-shadow-sm'
                                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                                    title={
                                        status === 'authenticated'
                                            ? isFavorite
                                                ? 'Retirer des favoris'
                                                : 'Ajouter aux favoris'
                                            : 'Connecte-toi pour gerer tes favoris'
                                    }
                                >
                                    <Icon name="favorite" fill={isFavorite} />
                                    <span>
                                        {isFavoritePending
                                            ? 'Mise a jour...'
                                            : isFavorite
                                              ? 'Dans vos favoris'
                                              : 'Ajouter aux favoris'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border-[3px] border-on-surface p-4 neo-shadow h-[400px] flex flex-col">
                        <div className="flex-grow border-[3px] border-on-surface bg-surface-container relative overflow-hidden group">
                            <img
                                alt="Meeting Room"
                                className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                                src={DEFAULT_ROOM_IMAGE}
                            />
                            <div className="absolute bottom-4 right-4 bg-primary text-on-primary font-label-bold font-bold px-4 py-2 border-[3px] border-on-surface neo-shadow-sm">
                                Salle #{room.id}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-surface border-[3px] border-on-surface p-6 neo-shadow flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full border-[3px] border-on-surface bg-secondary-fixed flex items-center justify-center mb-4 neo-shadow-sm">
                                <Icon name="groups" className="text-3xl" />
                            </div>
                            <h3 className="font-label-bold font-bold text-on-surface-variant uppercase mb-1">
                                Capacity
                            </h3>
                            <p className="font-headline-md font-bold text-[24px] text-on-surface">
                                {room.capacity} People
                            </p>
                        </div>

                        <div className="bg-surface border-[3px] border-on-surface p-6 neo-shadow flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full border-[3px] border-on-surface bg-primary-fixed flex items-center justify-center mb-4 neo-shadow-sm">
                                <Icon name="domain" className="text-3xl" />
                            </div>
                            <h3 className="font-label-bold font-bold text-on-surface-variant uppercase mb-1">
                                Building
                            </h3>
                            <p className="font-headline-md font-bold text-[24px] text-on-surface">
                                {building?.name ?? 'Inconnu'}
                            </p>
                        </div>

                        <div className="bg-surface border-[3px] border-on-surface p-6 neo-shadow flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full border-[3px] border-on-surface bg-tertiary-fixed flex items-center justify-center mb-4 neo-shadow-sm">
                                <Icon name="inventory_2" className="text-3xl" />
                            </div>
                            <h3 className="font-label-bold font-bold text-on-surface-variant uppercase mb-1">
                                Resources
                            </h3>
                            <p className="font-headline-md font-bold text-[24px] text-on-surface">{resources.length}</p>
                        </div>

                        <div className="bg-surface border-[3px] border-on-surface p-6 neo-shadow flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full border-[3px] border-on-surface bg-error-container flex items-center justify-center mb-4 neo-shadow-sm">
                                <Icon name="schedule" className="text-3xl" />
                            </div>
                            <h3 className="font-label-bold font-bold text-on-surface-variant uppercase mb-1">
                                Next Booking
                            </h3>
                            <p className="font-headline-md font-bold text-[20px] text-on-surface">
                                {nextReservation
                                    ? `${formatTime(nextReservation.start_time)} - ${formatTime(nextReservation.end_time)}`
                                    : 'Aucune'}
                            </p>
                        </div>
                    </div>

                    <section className="bg-surface border-[3px] border-on-surface p-6 neo-shadow flex flex-col gap-6">
                        <div className="border-b-[3px] border-on-surface pb-4">
                            <h2 className="font-headline-lg font-black text-[24px] uppercase flex items-center gap-3">
                                <Icon name="inventory_2" className="text-3xl" />
                                Ressources disponibles
                            </h2>
                        </div>

                        {resources.length === 0 ? (
                            <div className="bg-surface-container border-[3px] border-on-surface p-4 font-bold text-center">
                                Aucune ressource declaree pour cette salle.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {resources.map((resource) => (
                                    <div
                                        key={`${resource.room_id}-${resource.resource_id}`}
                                        className="bg-surface-container-lowest border-[3px] border-on-surface p-4 neo-shadow-sm flex items-center justify-between gap-4"
                                    >
                                        <div>
                                            <h3 className="font-headline-md font-bold text-[24px]">{resource.name}</h3>
                                            <p className="font-body-md text-on-surface-variant">
                                                Ressource configuree pour cette salle
                                            </p>
                                        </div>

                                        <span className="bg-primary text-on-primary font-label-bold font-bold px-4 py-2 border-[3px] border-on-surface">
                                            x{resource.quantity}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="bg-surface border-[3px] border-on-surface p-6 neo-shadow flex flex-col gap-6">
                        <div className="border-b-[3px] border-on-surface pb-4">
                            <h2 className="font-headline-lg font-black text-[24px] uppercase flex items-center gap-3">
                                <Icon name="construction" className="text-3xl" />
                                Indisponibilites
                            </h2>
                        </div>

                        {currentUnavailability ? (
                            <div className="bg-error-container text-on-error-container border-[3px] border-on-surface p-4 neo-shadow font-bold">
                                Indisponibilite active : {currentUnavailability.reason} jusqu'a{' '}
                                {formatDateTime(currentUnavailability.to_time)}.
                            </div>
                        ) : null}

                        {visibleUnavailabilities.length === 0 ? (
                            <div className="bg-surface-container border-[3px] border-on-surface p-4 font-bold text-center">
                                Aucune indisponibilite a venir.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {visibleUnavailabilities.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-surface-container-lowest border-[3px] border-on-surface p-4 neo-shadow-sm flex flex-col gap-2"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                            <div>
                                                <h3 className="font-headline-md font-bold text-[24px]">
                                                    {item.reason}
                                                </h3>
                                                <p className="font-body-md text-on-surface-variant">
                                                    {formatDateTime(item.from_time)} → {formatDateTime(item.to_time)}
                                                </p>
                                            </div>

                                            <Badge variant="warning">Maintenance</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="bg-surface border-[3px] border-on-surface p-6 neo-shadow flex flex-col gap-6">
                        <div className="border-b-[3px] border-on-surface pb-4">
                            <h2 className="font-headline-lg font-black text-[24px] uppercase flex items-center gap-3">
                                <Icon name="report" className="text-3xl" />
                                Incidents
                            </h2>
                        </div>

                        {visibleIncidents.length === 0 ? (
                            <div className="bg-surface-container border-[3px] border-on-surface p-4 font-bold text-center">
                                Aucun incident signale pour cette salle.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {visibleIncidents.map((incident) => (
                                    <div
                                        key={incident.id}
                                        className="bg-surface-container-lowest border-[3px] border-on-surface p-4 neo-shadow-sm flex flex-col gap-3"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                            <div>
                                                <h3 className="font-headline-md font-bold text-[24px]">
                                                    {incident.title}
                                                </h3>
                                                <p className="font-body-md text-on-surface-variant">
                                                    Signale le {formatDateTime(incident.created_at)}
                                                </p>
                                            </div>

                                            <Badge variant={getIncidentBadgeVariant(incident.status)}>
                                                {getIncidentStatusLabel(incident.status)}
                                            </Badge>
                                        </div>

                                        <p className="font-body-md">
                                            {incident.description?.trim() || 'Aucune description fournie.'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-8">
                    <div className="bg-surface border-[3px] border-on-surface p-6 neo-shadow">
                        <h2 className="font-headline-lg font-black text-[24px] text-on-surface mb-6 border-b-[3px] border-on-surface pb-4">
                            Schedule
                        </h2>

                        <div className="flex flex-col gap-4 mb-8 max-h-[480px] overflow-y-auto pr-1">
                            {reservations.length === 0 ? (
                                <div className="bg-tertiary-fixed border-[3px] border-on-surface p-4 neo-shadow-sm font-bold">
                                    Aucune reservation pour cette salle.
                                </div>
                            ) : (
                                reservations.map((reservation) => (
                                    <ManageableReservationCard
                                        key={reservation.id}
                                        reservation={reservation}
                                        rooms={roomOptions}
                                        floorById={floorById}
                                        buildingById={buildingById}
                                        user={user}
                                        allowManage
                                        allowRoomChange={false}
                                        showRoomLink={false}
                                        showLocation={false}
                                        onUpdated={handleReservationUpdated}
                                        onDeleted={handleReservationDeleted}
                                        onFeedback={handleReservationFeedback}
                                    />
                                ))
                            )}
                        </div>

                        <div className="flex flex-col gap-4 mb-6">
                            <div>
                                <label className="font-label-bold font-bold block mb-2 text-on-surface-variant">
                                    Debut
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={startTime}
                                    onChange={(event) => setStartTime(event.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="font-label-bold font-bold block mb-2 text-on-surface-variant">
                                    Fin
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={endTime}
                                    onChange={(event) => setEndTime(event.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            className="w-full text-[24px] py-4"
                            onClick={() => void handleReserve()}
                            disabled={isSubmitting || status === 'loading'}
                        >
                            {status === 'authenticated'
                                ? isSubmitting
                                    ? 'Reservation...'
                                    : 'Reserve Now'
                                : 'Login to Reserve'}
                        </Button>
                    </div>

                    <div className="bg-surface border-[3px] border-on-surface p-6 neo-shadow flex flex-col gap-4">
                        <div className="border-b-[3px] border-on-surface pb-4">
                            <h2 className="font-headline-lg font-black text-[24px] text-on-surface">
                                Signaler un probleme
                            </h2>
                        </div>

                        <p className="font-body-md text-on-surface-variant">
                            Signale un incident sur cette salle pour qu'un administrateur puisse le traiter.
                        </p>

                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold font-bold text-on-surface-variant">Titre</label>
                            <Input
                                value={incidentTitle}
                                onChange={(event) => setIncidentTitle(event.target.value)}
                                placeholder="Projecteur defectueux"
                                disabled={isIncidentSubmitting}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold font-bold text-on-surface-variant">Description</label>
                            <textarea
                                value={incidentDescription}
                                onChange={(event) => setIncidentDescription(event.target.value)}
                                placeholder="Decris le probleme constate..."
                                disabled={isIncidentSubmitting}
                                className={textareaClassName}
                            />
                        </div>

                        <Button
                            variant="danger"
                            className="w-full text-[14px] py-3"
                            onClick={() => void handleCreateIncident()}
                            disabled={isIncidentSubmitting || status === 'loading'}
                        >
                            <Icon name="report" />
                            {status === 'authenticated'
                                ? isIncidentSubmitting
                                    ? 'Signalement...'
                                    : 'Envoyer le signalement'
                                : 'Login to Report'}
                        </Button>
                    </div>
                </div>
            </div>

            <FavoriteRemovalModal
                open={isFavoriteRemovalModalOpen}
                roomName={room.name}
                location={favoriteLocationLabel}
                isPending={isFavoritePending}
                onClose={() => setIsFavoriteRemovalModalOpen(false)}
                onConfirm={() => void handleRemoveFavorite()}
            />
        </div>
    );
}
