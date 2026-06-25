import { useEffect, useState } from 'react';
import { HeroSearch, type HeroSearchFilters } from '../components/room/HeroSearch';
import { RoomCard, type RoomCardProps } from '../components/room/RoomCard';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/ToastProvider';
import { api } from '../api/client';
import type { components } from '../api/schema.d.ts';

type Room = components['schemas']['Room'];
type Floor = components['schemas']['Floor'];
type Building = components['schemas']['Building'];
type RoomResourceAssignment = components['schemas']['RoomResourceAssignment'];

type EquipmentSummary = {
    names: string[];
    additionalCount: number;
};

const DEFAULT_ROOM_IMAGE =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBG9M4Yj0jzyBSvdZAInX6sRjkulw49seRwedrNewKNmTZ9AcbOlTGo_TopuvjKGK6v9yajuovAXwAfagpar0-v0WDEsCSKGAW-EMY_4B86T5S4YvI1pNdsC6TiIQYGdbdOuIhl1puOX8BSF2ZWNFnQBQFgMfFaeEmfTkd4AcJt3Se5l6Ozx7QM4HMFIMCw5nYW6ql-9kB5tMKDUYNTJ_dUxQyLibeW1lFL7vv1I0Ds-pdPp2YwbJYIvPxhwNwIXC5Ad9QWzsKOfvZl';

const INITIAL_FILTERS: HeroSearchFilters = {
    query: '',
    buildingId: 'all',
    floorId: 'all',
    capacity: 'any',
    start: '',
    end: '',
};

function buildLocation(room: Room, floorById: Map<number, Floor>, buildingById: Map<number, Building>) {
    const floor = floorById.get(room.floor_id);

    if (!floor) {
        return 'Étage inconnu';
    }

    const building = buildingById.get(floor.building_id);

    if (!building) {
        return floor.name;
    }

    return `${building.name} - ${floor.name}`;
}

function toEquipmentSummary(resources: RoomResourceAssignment[]): EquipmentSummary {
    const sortedNames = [...resources]
        .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name))
        .map((resource) => resource.name.trim())
        .filter(Boolean);

    const visibleNames = sortedNames.slice(0, 3);

    return {
        names: visibleNames,
        additionalCount: Math.max(sortedNames.length - visibleNames.length, 0),
    };
}

function toRoomCard(
    room: Room,
    floorById: Map<number, Floor>,
    buildingById: Map<number, Building>,
    resources: RoomResourceAssignment[],
    hasAvailabilityFilter: boolean,
): RoomCardProps {
    const equipmentSummary = toEquipmentSummary(resources);

    const baseCard: RoomCardProps = {
        id: room.id,
        title: room.name,
        capacity: room.capacity,
        location: buildLocation(room, floorById, buildingById),
        imageUrl: DEFAULT_ROOM_IMAGE,
        equipmentNames: equipmentSummary.names,
        additionalEquipmentCount: equipmentSummary.additionalCount,
        actionLabel: 'Voir les details',
        actionLink: `/room/${room.id}`,
    };

    if (hasAvailabilityFilter) {
        return {
            ...baseCard,
            status: 'available',
            statusLabel: 'Disponible sur ce créneau',
        };
    }

    return baseCard;
}

function matchesCapacity(room: Room, capacityFilter: HeroSearchFilters['capacity']) {
    switch (capacityFilter) {
        case 'small':
            return room.capacity >= 1 && room.capacity <= 4;
        case 'medium':
            return room.capacity >= 5 && room.capacity <= 10;
        case 'large':
            return room.capacity >= 11;
        default:
            return true;
    }
}

function matchesQuery(room: Room, floorById: Map<number, Floor>, buildingById: Map<number, Building>, query: string) {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
        return true;
    }

    const floor = floorById.get(room.floor_id);
    const building = floor ? buildingById.get(floor.building_id) : undefined;
    const haystack = [room.name, floor?.name ?? '', building?.name ?? ''].join(' ').toLowerCase();

    return haystack.includes(normalizedQuery);
}

function toIsoDateTime(value: string) {
    return new Date(value).toISOString();
}

export default function Home() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [floors, setFloors] = useState<Floor[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [roomResourcesByRoomId, setRoomResourcesByRoomId] = useState<Record<number, RoomResourceAssignment[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [loadErrorMessage, setLoadErrorMessage] = useState('');
    const [draftFilters, setDraftFilters] = useState(INITIAL_FILTERS);
    const [selectedFilters, setSelectedFilters] = useState(INITIAL_FILTERS);

    const { pushToast } = useToast();

    const loadReferenceData = async () => {
        const [floorsResponse, buildingsResponse] = await Promise.all([api.GET('/floors'), api.GET('/buildings')]);

        if (floorsResponse.error || !floorsResponse.data || buildingsResponse.error || !buildingsResponse.data) {
            return { success: false as const };
        }

        return {
            success: true as const,
            floors: floorsResponse.data,
            buildings: buildingsResponse.data,
        };
    };

    const loadRoomResources = async (nextRooms: Room[]) => {
        const resourceResponses = await Promise.all(
            nextRooms.map((room) =>
                api.GET('/rooms/{roomId}/resources', {
                    params: {
                        path: {
                            roomId: room.id,
                        },
                    },
                }),
            ),
        );

        const nextRoomResourcesByRoomId: Record<number, RoomResourceAssignment[]> = {};

        nextRooms.forEach((room, index) => {
            const resourceResponse = resourceResponses[index];

            nextRoomResourcesByRoomId[room.id] =
                resourceResponse.error || !resourceResponse.data ? [] : resourceResponse.data;
        });

        return nextRoomResourcesByRoomId;
    };

    const loadRooms = async (filters: HeroSearchFilters) => {
        setIsLoading(true);
        setLoadErrorMessage('');

        const shouldFilterByAvailability = Boolean(filters.start && filters.end);

        const roomsResponse = shouldFilterByAvailability
            ? await api.GET('/rooms/available', {
                  params: {
                      query: {
                          start: toIsoDateTime(filters.start),
                          end: toIsoDateTime(filters.end),
                      },
                  },
              })
            : await api.GET('/rooms');

        if (roomsResponse.error || !roomsResponse.data) {
            setRooms([]);
            setRoomResourcesByRoomId({});
            setLoadErrorMessage('Impossible de charger les salles pour le moment.');
            setIsLoading(false);
            return;
        }

        const nextRoomResourcesByRoomId = await loadRoomResources(roomsResponse.data);

        setRooms(roomsResponse.data);
        setRoomResourcesByRoomId(nextRoomResourcesByRoomId);
        setIsLoading(false);
    };

    useEffect(() => {
        const initializeHome = async () => {
            setIsLoading(true);
            setLoadErrorMessage('');

            const referenceData = await loadReferenceData();

            if (!referenceData.success) {
                setRooms([]);
                setFloors([]);
                setBuildings([]);
                setRoomResourcesByRoomId({});
                setLoadErrorMessage('Impossible de charger les salles pour le moment.');
                setIsLoading(false);
                return;
            }

            setFloors(referenceData.floors);
            setBuildings(referenceData.buildings);

            await loadRooms(INITIAL_FILTERS);
        };

        void initializeHome();
    }, []);

    const floorById = new Map(floors.map((floor) => [floor.id, floor]));
    const buildingById = new Map(buildings.map((building) => [building.id, building]));
    const selectedBuildingNumber = selectedFilters.buildingId === 'all' ? null : Number(selectedFilters.buildingId);
    const selectedFloorNumber = selectedFilters.floorId === 'all' ? null : Number(selectedFilters.floorId);
    const hasAvailabilityFilter = Boolean(selectedFilters.start && selectedFilters.end);

    const visibleRoomCards = rooms
        .filter((room) => {
            if (selectedBuildingNumber !== null) {
                const floor = floorById.get(room.floor_id);

                if (!floor || floor.building_id !== selectedBuildingNumber) {
                    return false;
                }
            }

            if (selectedFloorNumber !== null && room.floor_id !== selectedFloorNumber) {
                return false;
            }

            if (!matchesCapacity(room, selectedFilters.capacity)) {
                return false;
            }

            return matchesQuery(room, floorById, buildingById, selectedFilters.query);
        })
        .map((room) =>
            toRoomCard(room, floorById, buildingById, roomResourcesByRoomId[room.id] ?? [], hasAvailabilityFilter),
        );

    const handleFilterChange = (name: keyof HeroSearchFilters, value: string) => {
        setDraftFilters((current) => {
            if (name === 'buildingId') {
                return {
                    ...current,
                    buildingId: value,
                    floorId: 'all',
                };
            }

            return {
                ...current,
                [name]: value,
            };
        });
    };

    const handleSearch = async () => {
        const nextFilters = { ...draftFilters };

        if ((nextFilters.start && !nextFilters.end) || (!nextFilters.start && nextFilters.end)) {
            pushToast({
                type: 'error',
                title: 'Filtres invalides',
                message: 'Renseignez une date de début et une date de fin pour filtrer la disponibilité.',
            });
            return;
        }

        if (nextFilters.start && nextFilters.end && new Date(nextFilters.start) >= new Date(nextFilters.end)) {
            pushToast({
                type: 'error',
                title: 'Filtres invalides',
                message: 'Le début du créneau doit être avant la fin.',
            });
            return;
        }

        setSelectedFilters(nextFilters);
        await loadRooms(nextFilters);
    };

    const handleResetFilters = async () => {
        setDraftFilters(INITIAL_FILTERS);
        setSelectedFilters(INITIAL_FILTERS);
        await loadRooms(INITIAL_FILTERS);
    };

    return (
        <>
            <HeroSearch
                buildings={buildings}
                floors={floors}
                filters={draftFilters}
                onFilterChange={handleFilterChange}
                onSearch={() => void handleSearch()}
                onReset={() => void handleResetFilters()}
                isLoading={isLoading}
            />

            <section className="px-margin-mobile md:px-margin-desktop py-12 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h2 className="font-headline-lg font-black text-[32px] leading-[40px]">Toutes les salles</h2>
                    <p className="font-body-md text-on-surface-variant mt-2">
                        {visibleRoomCards.length} salle{visibleRoomCards.length > 1 ? 's' : ''} trouvée
                        {visibleRoomCards.length > 1 ? 's' : ''}
                        {hasAvailabilityFilter ? ' sur ce créneau' : ''}
                    </p>
                </div>

                {loadErrorMessage ? (
                    <div className="mb-8 bg-error-container text-on-error-container neo-border p-4 font-bold">
                        {loadErrorMessage}
                    </div>
                ) : null}

                {isLoading ? (
                    <div className="mb-8 bg-surface-container neo-border p-6 text-center font-bold">
                        Chargement des salles...
                    </div>
                ) : null}

                {!isLoading && !loadErrorMessage && visibleRoomCards.length === 0 ? (
                    <div className="mb-8 bg-surface-container neo-border p-6 text-center font-bold">
                        {rooms.length === 0
                            ? 'Aucune salle disponible pour le moment.'
                            : 'Aucune salle ne correspond aux critères de filtre.'}
                    </div>
                ) : null}

                {!isLoading && !loadErrorMessage && visibleRoomCards.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
                        {visibleRoomCards.map((room) => (
                            <RoomCard key={room.id} {...room} />
                        ))}
                    </div>
                ) : null}

                <div className="mt-12 text-center">
                    <Button
                        variant="outline"
                        className="py-3 px-8 text-[14px] rounded-DEFAULT"
                        onClick={() => void loadRooms(selectedFilters)}
                        disabled={isLoading}
                    >
                        <Icon name="refresh" />
                        Rafraîchir
                    </Button>
                </div>
            </section>
        </>
    );
}
