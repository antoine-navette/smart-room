import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ManageableReservationCard } from '../components/reservation/ManageableReservationCard';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthProvider';
import type { components } from '../api/schema.d.ts';
import {
  formatTime,
  sortReservations,
  type ReservationFeedbackType,
} from '../lib/reservation-utils';

type Room = components['schemas']['Room'];
type Floor = components['schemas']['Floor'];
type Building = components['schemas']['Building'];
type Reservation = components['schemas']['Reservation'];

const DEFAULT_ROOM_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBj_Du02t8DnsMWBYEBKf9pCPKNAbd0iYg8_sUOwl0lpV24139q56j9DtewlMSeCZmaZha_00vwrWf6TNPwK99E3yK5w8gMuQTE-DCv7DKu9hCS8bUpyOAfKkTcypQi-dN4mzokvxf_B1FAMUNz3SMSxJLPITAqXaOLeqC9_-4MMfinKsQTXCYYlKZCIoTvOitVo8lDRcWbP9Fi7NTkGnc-_2tmICURnkQT9-8zcKTTfvMsJE5a3kKU7Gz_WOMQ4ZAQ4RNYmq3ndUiH';

function getRoomStatus(reservations: Reservation[]) {
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

export default function RoomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, status } = useAuth();

  const roomId = Number(id);
  const hasValidRoomId = Number.isInteger(roomId) && roomId > 0;

  const [room, setRoom] = useState<Room | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitMessageType, setSubmitMessageType] = useState<ReservationFeedbackType>('');
  const [reservationFeedbackMessage, setReservationFeedbackMessage] = useState('');
  const [reservationFeedbackType, setReservationFeedbackType] = useState<ReservationFeedbackType>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRoomDetails = async () => {
    if (!hasValidRoomId) {
      setErrorMessage('Identifiant de salle invalide.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const [roomResponse, reservationsResponse, floorsResponse, buildingsResponse] = await Promise.all([
      api.GET('/rooms/{id}', {
        params: { path: { id: roomId } },
      }),
      api.GET('/rooms/{roomId}/reservations', {
        params: { path: { roomId } },
      }),
      api.GET('/floors'),
      api.GET('/buildings'),
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
      setErrorMessage('Impossible de charger les details de la salle.');
      setIsLoading(false);
      return;
    }

    setRoom(roomResponse.data);
    setReservations(sortReservations(reservationsResponse.data));
    setFloors(floorsResponse.data);
    setBuildings(buildingsResponse.data);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadRoomDetails();
  }, [id]);

  const floor = room ? floors.find((item) => item.id === room.floor_id) ?? null : null;
  const building = floor ? buildings.find((item) => item.id === floor.building_id) ?? null : null;

  const floorById = new Map(floors.map((item) => [item.id, item]));
  const buildingById = new Map(buildings.map((item) => [item.id, item]));
  const roomOptions = room ? [room] : [];

  const statusBadge = getRoomStatus(reservations);
  const nextReservation = getNextReservation(reservations);

  const handleReserve = async () => {
    if (!room) {
      return;
    }

    setSubmitMessage('');
    setSubmitMessageType('');

    if (status === 'loading') {
      return;
    }

    if (status !== 'authenticated' || !user) {
      navigate('/login');
      return;
    }

    if (!startTime || !endTime) {
      setSubmitMessageType('error');
      setSubmitMessage('Renseigne un debut et une fin pour reserver.');
      return;
    }

    if (new Date(startTime) >= new Date(endTime)) {
      setSubmitMessageType('error');
      setSubmitMessage('La fin doit etre apres le debut.');
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

    if (error) {
      const errorCode =
        typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';

      if (errorCode === 'ROOM_NOT_AVAILABLE') {
        setSubmitMessageType('error');
        setSubmitMessage("La salle n'est pas disponible sur ce creneau.");
      } else if (errorCode === 'INVALID_DATE_RANGE') {
        setSubmitMessageType('error');
        setSubmitMessage('Le creneau est invalide.');
      } else if (errorCode === 'UNAUTHORIZED') {
        setSubmitMessageType('error');
        setSubmitMessage('Ta session a expire. Reconnecte-toi.');
        navigate('/login');
      } else {
        setSubmitMessageType('error');
        setSubmitMessage('Impossible de creer la reservation.');
      }

      setIsSubmitting(false);
      return;
    }

    if (data) {
      setSubmitMessageType('success');
      setSubmitMessage('Reservation creee avec succes.');
      setStartTime('');
      setEndTime('');
      await loadRoomDetails();
    }

    setIsSubmitting(false);
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
    setReservationFeedbackType(type);
    setReservationFeedbackMessage(message);
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

              <div className="flex gap-4 items-start">
                <Badge
                  variant={statusBadge.variant}
                  className="py-2 px-4 shadow-[4px_4px_0px_0px_#000]"
                >
                  <span className="w-3 h-3 bg-current rounded-full border-2 border-on-surface"></span>
                  {statusBadge.label}
                </Badge>

                <button
                  disabled
                  className="w-12 h-12 flex items-center justify-center bg-surface border-[3px] border-on-surface neo-shadow-sm opacity-60 cursor-not-allowed"
                  title="Fonction favoris non disponible"
                >
                  <Icon name="favorite" />
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface border-[3px] border-on-surface p-6 neo-shadow flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full border-[3px] border-on-surface bg-secondary-fixed flex items-center justify-center mb-4 neo-shadow-sm">
                <Icon name="groups" className="text-3xl" />
              </div>
              <h3 className="font-label-bold font-bold text-on-surface-variant uppercase mb-1">Capacity</h3>
              <p className="font-headline-md font-bold text-[24px] text-on-surface">{room.capacity} People</p>
            </div>

            <div className="bg-surface border-[3px] border-on-surface p-6 neo-shadow flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full border-[3px] border-on-surface bg-primary-fixed flex items-center justify-center mb-4 neo-shadow-sm">
                <Icon name="domain" className="text-3xl" />
              </div>
              <h3 className="font-label-bold font-bold text-on-surface-variant uppercase mb-1">Building</h3>
              <p className="font-headline-md font-bold text-[24px] text-on-surface">
                {building?.name ?? 'Inconnu'}
              </p>
            </div>

            <div className="bg-surface border-[3px] border-on-surface p-6 neo-shadow flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full border-[3px] border-on-surface bg-error-container flex items-center justify-center mb-4 neo-shadow-sm">
                <Icon name="schedule" className="text-3xl" />
              </div>
              <h3 className="font-label-bold font-bold text-on-surface-variant uppercase mb-1">Next Booking</h3>
              <p className="font-headline-md font-bold text-[20px] text-on-surface">
                {nextReservation
                  ? `${formatTime(nextReservation.start_time)} - ${formatTime(nextReservation.end_time)}`
                  : 'Aucune'}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-surface border-[3px] border-on-surface p-6 neo-shadow sticky top-[120px]">
            <h2 className="font-headline-lg font-black text-[32px] text-on-surface mb-6 border-b-[3px] border-on-surface pb-4">
              Schedule
            </h2>

            {reservationFeedbackMessage ? (
              <div
                className={`mb-4 border-[3px] border-on-surface p-4 neo-shadow font-bold ${
                  reservationFeedbackType === 'success'
                    ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                    : 'bg-error-container text-on-error-container'
                }`}
              >
                {reservationFeedbackMessage}
              </div>
            ) : null}

            <div className="flex flex-col gap-4 mb-8">
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
                <label className="font-label-bold font-bold block mb-2 text-on-surface-variant">Debut</label>
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="font-label-bold font-bold block mb-2 text-on-surface-variant">Fin</label>
                <Input
                  type="datetime-local"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {submitMessage ? (
              <div
                className={`mb-4 border-[3px] border-on-surface p-4 font-bold ${
                  submitMessageType === 'success'
                    ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                    : 'bg-surface-container text-on-surface'
                }`}
              >
                {submitMessage}
              </div>
            ) : null}

            <Button
              variant="primary"
              className="w-full text-[24px] py-4 mb-4"
              onClick={() => void handleReserve()}
              disabled={isSubmitting || status === 'loading'}
            >
              {status === 'authenticated' ? (isSubmitting ? 'Reservation...' : 'Reserve Now') : 'Login to Reserve'}
            </Button>

            <Button variant="danger" className="w-full text-[14px] py-3" disabled>
              <Icon name="report" />
              Signaler un probleme
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}