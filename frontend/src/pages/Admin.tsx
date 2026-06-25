import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../api/client';
import type { components } from '../api/schema.d.ts';
import { AdminStatCard } from '../components/admin/AdminStatCard';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/ToastProvider';

type Building = components['schemas']['Building'];
type Floor = components['schemas']['Floor'];
type Room = components['schemas']['Room'];
type RoomResource = components['schemas']['RoomResource'];
type RoomResourceAssignment = components['schemas']['RoomResourceAssignment'];
type RoomUnavailability = components['schemas']['RoomUnavailability'];
type Incident = components['schemas']['Incident'];
type User = components['schemas']['User'];

type FeedbackType = '' | 'success' | 'error';
type IncidentStatus = Incident['status'];

const selectClassName =
    'w-full h-12 bg-white px-3 py-2 text-base neo-border shadow-[4px_4px_0px_0px_#1A1D5C] focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_#1A1D5C] transition-all disabled:cursor-not-allowed disabled:opacity-50 font-body appearance-none cursor-pointer';

function sortByName<T extends { name: string }>(items: T[]) {
    return [...items].sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
}

function sortAssignments(items: RoomResourceAssignment[]) {
    return [...items].sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
}

function sortUnavailabilities(items: RoomUnavailability[]) {
    return [...items].sort((a, b) => new Date(a.from_time).getTime() - new Date(b.from_time).getTime());
}

function sortIncidents(items: Incident[]) {
    return [...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function getErrorCode(error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error) {
        return String(error.code);
    }

    return '';
}

function parsePositiveInteger(value: string) {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        return null;
    }

    return parsed;
}

function toDateTimeLocalValue(value: string) {
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

function toIsoString(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString();
}

function formatDateTime(value: string) {
    return new Date(value).toLocaleString('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

function buildRoomLocation(room: Room, floorById: Map<number, Floor>, buildingById: Map<number, Building>) {
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

function getIncidentStatusOptions(status: IncidentStatus): IncidentStatus[] {
    if (status === 'RESOLVED') {
        return ['RESOLVED'];
    }

    if (status === 'IN_PROGRESS') {
        return ['IN_PROGRESS', 'RESOLVED'];
    }

    return ['OPEN', 'IN_PROGRESS', 'RESOLVED'];
}

function getIncidentStatusLabel(status: IncidentStatus) {
    if (status === 'OPEN') {
        return 'Ouvert';
    }

    if (status === 'IN_PROGRESS') {
        return 'En cours';
    }

    return 'Résolu';
}

function getIncidentStatusClass(status: IncidentStatus) {
    if (status === 'OPEN') {
        return 'bg-error-container text-on-error-container';
    }

    if (status === 'IN_PROGRESS') {
        return 'bg-secondary-fixed text-on-secondary-fixed';
    }

    return 'bg-tertiary-fixed text-on-tertiary-fixed';
}

export default function Admin() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { pushToast } = useToast();

    const [buildings, setBuildings] = useState<Building[]>([]);
    const [floors, setFloors] = useState<Floor[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [roomResources, setRoomResources] = useState<RoomResource[]>([]);
    const [roomAssignments, setRoomAssignments] = useState<RoomResourceAssignment[]>([]);
    const [unavailabilities, setUnavailabilities] = useState<RoomUnavailability[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const [savingKey, setSavingKey] = useState('');
    const [deletingKey, setDeletingKey] = useState('');

    const [newBuildingName, setNewBuildingName] = useState('');
    const [editingBuildingId, setEditingBuildingId] = useState<number | null>(null);
    const [editingBuildingName, setEditingBuildingName] = useState('');

    const [newFloorName, setNewFloorName] = useState('');
    const [newFloorBuildingId, setNewFloorBuildingId] = useState('');
    const [editingFloorId, setEditingFloorId] = useState<number | null>(null);
    const [editingFloorName, setEditingFloorName] = useState('');
    const [editingFloorBuildingId, setEditingFloorBuildingId] = useState('');

    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomCapacity, setNewRoomCapacity] = useState('');
    const [newRoomFloorId, setNewRoomFloorId] = useState('');
    const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
    const [editingRoomName, setEditingRoomName] = useState('');
    const [editingRoomCapacity, setEditingRoomCapacity] = useState('');
    const [editingRoomFloorId, setEditingRoomFloorId] = useState('');

    const [newResourceName, setNewResourceName] = useState('');
    const [editingResourceId, setEditingResourceId] = useState<number | null>(null);
    const [editingResourceName, setEditingResourceName] = useState('');

    const [selectedAssignmentRoomId, setSelectedAssignmentRoomId] = useState('');
    const [selectedResourceId, setSelectedResourceId] = useState('');
    const [newAssignmentQuantity, setNewAssignmentQuantity] = useState('1');
    const [assignmentQuantityDrafts, setAssignmentQuantityDrafts] = useState<Record<number, string>>({});
    const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);
    const [assignmentErrorMessage, setAssignmentErrorMessage] = useState('');

    const [newUnavailabilityRoomId, setNewUnavailabilityRoomId] = useState('');
    const [newUnavailabilityFrom, setNewUnavailabilityFrom] = useState('');
    const [newUnavailabilityTo, setNewUnavailabilityTo] = useState('');
    const [newUnavailabilityReason, setNewUnavailabilityReason] = useState('');
    const [editingUnavailabilityId, setEditingUnavailabilityId] = useState<number | null>(null);
    const [editingUnavailabilityRoomId, setEditingUnavailabilityRoomId] = useState('');
    const [editingUnavailabilityFrom, setEditingUnavailabilityFrom] = useState('');
    const [editingUnavailabilityTo, setEditingUnavailabilityTo] = useState('');
    const [editingUnavailabilityReason, setEditingUnavailabilityReason] = useState('');

    const [incidentStatusDrafts, setIncidentStatusDrafts] = useState<Record<number, IncidentStatus>>({});

    const [newUserFirstName, setNewUserFirstName] = useState('');
    const [newUserLastName, setNewUserLastName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [lastCreatedUser, setLastCreatedUser] = useState<User | null>(null);

    const pushFeedback = (type: FeedbackType, message: string) => {
        if (!type || !message) {
            return;
        }

        pushToast({
            type: type === 'success' ? 'success' : 'error',
            message,
        });
    };

    const handleUnauthorized = (errorCode: string) => {
        if (errorCode === 'UNAUTHORIZED') {
            navigate('/login', { replace: true });
            return true;
        }

        return false;
    };

    const loadAdminData = async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const [
                buildingsResponse,
                floorsResponse,
                roomsResponse,
                resourcesResponse,
                unavailabilitiesResponse,
                incidentsResponse,
            ] = await Promise.all([
                api.GET('/buildings'),
                api.GET('/floors'),
                api.GET('/rooms'),
                api.GET('/room-resources'),
                api.GET('/room-unavailabilities'),
                api.GET('/incidents'),
            ]);

            if (
                buildingsResponse.error ||
                !buildingsResponse.data ||
                floorsResponse.error ||
                !floorsResponse.data ||
                roomsResponse.error ||
                !roomsResponse.data ||
                resourcesResponse.error ||
                !resourcesResponse.data ||
                unavailabilitiesResponse.error ||
                !unavailabilitiesResponse.data ||
                incidentsResponse.error ||
                !incidentsResponse.data
            ) {
                setErrorMessage("Impossible de charger le centre d'administration.");
                return;
            }

            setBuildings(sortByName(buildingsResponse.data));
            setFloors(sortByName(floorsResponse.data));
            setRooms(sortByName(roomsResponse.data));
            setRoomResources(sortByName(resourcesResponse.data));
            setUnavailabilities(sortUnavailabilities(unavailabilitiesResponse.data));
            setIncidents(sortIncidents(incidentsResponse.data));
        } catch {
            setErrorMessage("La requête de chargement de l'admin a échoué.");
        } finally {
            setIsLoading(false);
        }
    };

    const loadRoomAssignments = async (roomId: number) => {
        setIsAssignmentsLoading(true);
        setAssignmentErrorMessage('');

        try {
            const { data, error } = await api.GET('/rooms/{roomId}/resources', {
                params: {
                    path: {
                        roomId,
                    },
                },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error || !data) {
                if (errorCode === 'ROOM_NOT_FOUND') {
                    setAssignmentErrorMessage("La salle selectionnée n'existe plus.");
                } else {
                    setAssignmentErrorMessage('Impossible de charger les ressources de cette salle.');
                }

                setRoomAssignments([]);
                setAssignmentQuantityDrafts({});
                return;
            }

            setRoomAssignments(sortAssignments(data));
            setAssignmentQuantityDrafts(
                Object.fromEntries(data.map((assignment) => [assignment.resource_id, String(assignment.quantity)])),
            );
        } catch {
            setAssignmentErrorMessage('La requête de chargement des ressources affectées a échoué.');
            setRoomAssignments([]);
            setAssignmentQuantityDrafts({});
        } finally {
            setIsAssignmentsLoading(false);
        }
    };

    useEffect(() => {
        void loadAdminData();
    }, []);

    useEffect(() => {
        setNewFloorBuildingId((current) =>
            buildings.some((building) => String(building.id) === current)
                ? current
                : buildings[0]
                  ? String(buildings[0].id)
                  : '',
        );
    }, [buildings]);

    useEffect(() => {
        setNewRoomFloorId((current) =>
            floors.some((floor) => String(floor.id) === current) ? current : floors[0] ? String(floors[0].id) : '',
        );
    }, [floors]);

    useEffect(() => {
        setSelectedAssignmentRoomId((current) =>
            rooms.some((room) => String(room.id) === current) ? current : rooms[0] ? String(rooms[0].id) : '',
        );
    }, [rooms]);

    useEffect(() => {
        setSelectedResourceId((current) =>
            roomResources.some((resource) => String(resource.id) === current)
                ? current
                : roomResources[0]
                  ? String(roomResources[0].id)
                  : '',
        );
    }, [roomResources]);

    useEffect(() => {
        setNewUnavailabilityRoomId((current) =>
            rooms.some((room) => String(room.id) === current) ? current : rooms[0] ? String(rooms[0].id) : '',
        );
    }, [rooms]);

    useEffect(() => {
        if (!selectedAssignmentRoomId) {
            setRoomAssignments([]);
            setAssignmentQuantityDrafts({});
            return;
        }

        void loadRoomAssignments(Number(selectedAssignmentRoomId));
    }, [selectedAssignmentRoomId]);

    useEffect(() => {
        setIncidentStatusDrafts(Object.fromEntries(incidents.map((incident) => [incident.id, incident.status])));
    }, [incidents]);

    const floorById = new Map(floors.map((floor) => [floor.id, floor]));
    const buildingById = new Map(buildings.map((building) => [building.id, building]));
    const roomById = new Map(rooms.map((room) => [room.id, room]));

    const selectedBuildingIdForFloorSection = parsePositiveInteger(newFloorBuildingId);
    const selectedFloorIdForRoomSection = parsePositiveInteger(newRoomFloorId);

    const selectedBuildingForFloorSection =
        selectedBuildingIdForFloorSection != null
            ? (buildingById.get(selectedBuildingIdForFloorSection) ?? null)
            : null;

    const selectedFloorForRoomSection =
        selectedFloorIdForRoomSection != null ? (floorById.get(selectedFloorIdForRoomSection) ?? null) : null;

    const filteredFloorsForSelectedBuilding =
        selectedBuildingIdForFloorSection != null
            ? floors.filter((floor) => floor.building_id === selectedBuildingIdForFloorSection)
            : floors;

    const filteredRoomsForSelectedFloor =
        selectedFloorIdForRoomSection != null
            ? rooms.filter((room) => room.floor_id === selectedFloorIdForRoomSection)
            : rooms;

    const selectedRoomSectionBuilding =
        selectedFloorForRoomSection != null
            ? (buildingById.get(selectedFloorForRoomSection.building_id) ?? null)
            : null;

    const handleCreateBuilding = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const name = newBuildingName.trim();

        if (!name) {
            pushFeedback('error', 'Renseigner un nom de bâtiment.');
            return;
        }

        setSavingKey('building:new');
        pushFeedback('', '');

        try {
            const { data, error } = await api.POST('/buildings', {
                body: { name },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', 'Seul un admin peut créer un bâtiment.');
                } else if (errorCode === 'BUILDING_NAME_EXISTS') {
                    pushFeedback('error', 'Un bâtiment porte déjà ce nom.');
                } else {
                    pushFeedback('error', 'Impossible de créer le bâtiment.');
                }

                return;
            }

            if (!data) {
                pushFeedback('error', 'La réponse du serveur est invalide.');
                return;
            }

            setBuildings((current) => sortByName([...current, data]));
            setNewBuildingName('');
            pushFeedback('success', 'Bâtiment créé avec succès.');
        } catch {
            pushFeedback('error', 'La requête de création du bâtiment a échoué.');
        } finally {
            setSavingKey('');
        }
    };

    const startBuildingEdit = (building: Building) => {
        setEditingBuildingId(building.id);
        setEditingBuildingName(building.name);
        pushFeedback('', '');
    };

    const saveBuildingEdit = async (buildingId: number) => {
        const name = editingBuildingName.trim();

        if (!name) {
            pushFeedback('error', 'Le nom du bâtiment est obligatoire.');
            return;
        }

        setSavingKey(`building:${buildingId}`);
        pushFeedback('', '');

        try {
            const { data, error } = await api.PUT('/buildings/{id}', {
                params: {
                    path: { id: buildingId },
                },
                body: { name },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', 'Seul un admin peut modifier un bâtiment.');
                } else if (errorCode === 'BUILDING_NAME_EXISTS') {
                    pushFeedback('error', 'Un bâtiment porte déjà ce nom.');
                } else if (errorCode === 'BUILDING_NOT_FOUND') {
                    pushFeedback('error', "Ce bâtiment n'existe plus.");
                } else {
                    pushFeedback('error', 'Impossible de modifier le bâtiment.');
                }

                return;
            }

            if (!data) {
                pushFeedback('error', 'La réponse du serveur est invalide.');
                return;
            }

            setBuildings((current) => sortByName(current.map((item) => (item.id === buildingId ? data : item))));
            setEditingBuildingId(null);
            setEditingBuildingName('');
            pushFeedback('success', 'Bâtiment modifié avec succès.');
        } catch {
            pushFeedback('error', 'La requête de modification du bâtiment a échoué.');
        } finally {
            setSavingKey('');
        }
    };

    const deleteBuilding = async (building: Building) => {
        const confirmed = window.confirm(`Supprimer le bâtiment "${building.name}" ?`);

        if (!confirmed) {
            return;
        }

        setDeletingKey(`building:${building.id}`);
        pushFeedback('', '');

        try {
            const { error } = await api.DELETE('/buildings/{id}', {
                params: {
                    path: { id: building.id },
                },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', 'Seul un admin peut supprimer un bâtiment.');
                } else if (errorCode === 'BUILDING_HAS_FLOORS') {
                    pushFeedback('error', 'Veuillez supprimer les étages de ce bâtiment.');
                } else if (errorCode === 'BUILDING_NOT_FOUND') {
                    pushFeedback('error', "Ce bâtiment n'existe plus.");
                } else {
                    pushFeedback('error', 'Impossible de supprimer le bâtiment.');
                }

                return;
            }

            setBuildings((current) => current.filter((item) => item.id !== building.id));
            if (editingBuildingId === building.id) {
                setEditingBuildingId(null);
                setEditingBuildingName('');
            }
            pushFeedback('success', 'Bâtiment supprimé avec succès.');
        } catch {
            pushFeedback('error', 'La requête de suppression du bâtiment a échoué.');
        } finally {
            setDeletingKey('');
        }
    };

    const handleCreateFloor = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const name = newFloorName.trim();
        const buildingId = parsePositiveInteger(newFloorBuildingId);

        if (!name) {
            pushFeedback('error', "Renseigner un nom d'étage.");
            return;
        }

        if (!buildingId) {
            pushFeedback('error', 'Sélectionner un bâtiment.');
            return;
        }

        setSavingKey('floor:new');
        pushFeedback('', '');

        try {
            const { data, error } = await api.POST('/floors', {
                body: {
                    name,
                    building_id: buildingId,
                },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', 'Seul un admin peut créer un étage.');
                } else if (errorCode === 'FLOOR_NAME_EXISTS') {
                    pushFeedback('error', 'Un étage porte déjà ce nom.');
                } else if (errorCode === 'BUILDING_NOT_FOUND') {
                    pushFeedback('error', "Le bâtiment sélectionné n'existe plus.");
                } else {
                    pushFeedback('error', "Impossible de créer l'étage.");
                }

                return;
            }

            if (!data) {
                pushFeedback('error', 'La réponse du serveur est invalide.');
                return;
            }

            setFloors((current) => sortByName([...current, data]));
            setNewFloorName('');
            pushFeedback('success', 'Etage créé avec succès.');
        } catch {
            pushFeedback('error', "La requête de création de l'étage a échoué.");
        } finally {
            setSavingKey('');
        }
    };

    const startFloorEdit = (floor: Floor) => {
        setEditingFloorId(floor.id);
        setEditingFloorName(floor.name);
        setEditingFloorBuildingId(String(floor.building_id));
        pushFeedback('', '');
    };

    const saveFloorEdit = async (floorId: number) => {
        const name = editingFloorName.trim();
        const buildingId = parsePositiveInteger(editingFloorBuildingId);

        if (!name) {
            pushFeedback('error', "Le nom de l'étage est obligatoire.");
            return;
        }

        if (!buildingId) {
            pushFeedback('error', 'Sélectionner un bâtiment valide.');
            return;
        }

        setSavingKey(`floor:${floorId}`);
        pushFeedback('', '');

        try {
            const { data, error } = await api.PUT('/floors/{id}', {
                params: {
                    path: { id: floorId },
                },
                body: {
                    name,
                    building_id: buildingId,
                },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', 'Seul un admin peut modifier un étage.');
                } else if (errorCode === 'FLOOR_NAME_EXISTS') {
                    pushFeedback('error', 'Un étage porte déjà ce nom.');
                } else if (errorCode === 'BUILDING_NOT_FOUND') {
                    pushFeedback('error', "Le bâtiment sélectionné n'existe plus.");
                } else if (errorCode === 'FLOOR_NOT_FOUND') {
                    pushFeedback('error', "Cet étage n'existe plus.");
                } else {
                    pushFeedback('error', "Impossible de modifier l'étage.");
                }

                return;
            }

            if (!data) {
                pushFeedback('error', 'La réponse du serveur est invalide.');
                return;
            }

            setFloors((current) => sortByName(current.map((item) => (item.id === floorId ? data : item))));
            setEditingFloorId(null);
            setEditingFloorName('');
            setEditingFloorBuildingId('');
            pushFeedback('success', 'Etage modifié avec succès.');
        } catch {
            pushFeedback('error', "La requête de modification de l'étage a échoué.");
        } finally {
            setSavingKey('');
        }
    };

    const deleteFloor = async (floor: Floor) => {
        const confirmed = window.confirm(`Supprimer l'étage "${floor.name}" ?`);

        if (!confirmed) {
            return;
        }

        setDeletingKey(`floor:${floor.id}`);
        pushFeedback('', '');

        try {
            const { error } = await api.DELETE('/floors/{id}', {
                params: {
                    path: { id: floor.id },
                },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', 'Seul un admin peut supprimer un étage.');
                } else if (errorCode === 'FLOOR_HAS_ROOMS') {
                    pushFeedback('error', 'Veuillez supprimer les salles de cet étage.');
                } else if (errorCode === 'FLOOR_NOT_FOUND') {
                    pushFeedback('error', "Cet étage n'existe plus.");
                } else {
                    pushFeedback('error', "Impossible de supprimer l'étage.");
                }

                return;
            }

            setFloors((current) => current.filter((item) => item.id !== floor.id));
            if (editingFloorId === floor.id) {
                setEditingFloorId(null);
                setEditingFloorName('');
                setEditingFloorBuildingId('');
            }
            pushFeedback('success', 'Etage supprimé avec succès.');
        } catch {
            pushFeedback('error', "La requête de suppression de l'étage a échoué.");
        } finally {
            setDeletingKey('');
        }
    };

    const handleCreateRoom = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const name = newRoomName.trim();
        const floorId = parsePositiveInteger(newRoomFloorId);
        const capacity = parsePositiveInteger(newRoomCapacity);

        if (!name) {
            pushFeedback('error', 'Renseigner un nom de salle.');
            return;
        }

        if (!floorId) {
            pushFeedback('error', 'Sélectionner un étage.');
            return;
        }

        if (!capacity) {
            pushFeedback('error', 'La capacité doit être un entier positif.');
            return;
        }

        setSavingKey('room:new');
        pushFeedback('', '');

        try {
            const { data, error } = await api.POST('/rooms', {
                body: {
                    name,
                    floor_id: floorId,
                    capacity,
                },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', 'Seul un admin peut créer une salle.');
                } else if (errorCode === 'ROOM_NAME_EXISTS') {
                    pushFeedback('error', 'Une salle porte déjà ce nom.');
                } else if (errorCode === 'FLOOR_NOT_FOUND') {
                    pushFeedback('error', "L'étage sélectionné n'existe plus.");
                } else {
                    pushFeedback('error', 'Impossible de créer la salle.');
                }

                return;
            }

            if (!data) {
                pushFeedback('error', 'La réponse du serveur est invalide.');
                return;
            }

            setRooms((current) => sortByName([...current, data]));
            setNewRoomName('');
            setNewRoomCapacity('');
            pushFeedback('success', 'Salle créée avec succès.');
        } catch {
            pushFeedback('error', 'La requête de création de la salle a échoué.');
        } finally {
            setSavingKey('');
        }
    };

    const startRoomEdit = (room: Room) => {
        setEditingRoomId(room.id);
        setEditingRoomName(room.name);
        setEditingRoomCapacity(String(room.capacity));
        setEditingRoomFloorId(String(room.floor_id));
        pushFeedback('', '');
    };

    const saveRoomEdit = async (roomId: number) => {
        const name = editingRoomName.trim();
        const floorId = parsePositiveInteger(editingRoomFloorId);
        const capacity = parsePositiveInteger(editingRoomCapacity);

        if (!name) {
            pushFeedback('error', 'Le nom de la salle est obligatoire.');
            return;
        }

        if (!floorId) {
            pushFeedback('error', 'Sélectionner un étage valide.');
            return;
        }

        if (!capacity) {
            pushFeedback('error', 'La capacité doit être un entier positif.');
            return;
        }

        setSavingKey(`room:${roomId}`);
        pushFeedback('', '');

        try {
            const { data, error } = await api.PUT('/rooms/{id}', {
                params: {
                    path: { id: roomId },
                },
                body: {
                    name,
                    floor_id: floorId,
                    capacity,
                },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', 'Seul un admin peut modifier une salle.');
                } else if (errorCode === 'ROOM_NAME_EXISTS') {
                    pushFeedback('error', 'Une salle porte déjà ce nom.');
                } else if (errorCode === 'FLOOR_NOT_FOUND') {
                    pushFeedback('error', "L'étage sélectionné n'existe plus.");
                } else if (errorCode === 'ROOM_NOT_FOUND') {
                    pushFeedback('error', "Cette salle n'existe plus.");
                } else {
                    pushFeedback('error', 'Impossible de modifier la salle.');
                }

                return;
            }

            if (!data) {
                pushFeedback('error', 'La réponse du serveur est invalide.');
                return;
            }

            setRooms((current) => sortByName(current.map((item) => (item.id === roomId ? data : item))));
            setEditingRoomId(null);
            setEditingRoomName('');
            setEditingRoomCapacity('');
            setEditingRoomFloorId('');
            pushFeedback('success', 'Salle modifiée avec succès.');
        } catch {
            pushFeedback('error', 'La requête de modification de la salle a échoué.');
        } finally {
            setSavingKey('');
        }
    };

    const deleteRoom = async (room: Room) => {
        const confirmed = window.confirm(`Supprimer la salle "${room.name}" ?`);

        if (!confirmed) {
            return;
        }

        setDeletingKey(`room:${room.id}`);
        pushFeedback('', '');

        try {
            const { error } = await api.DELETE('/rooms/{id}', {
                params: {
                    path: { id: room.id },
                },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', 'Seul un admin peut supprimer une salle.');
                } else if (errorCode === 'ROOM_NOT_FOUND') {
                    pushFeedback('error', "Cette salle n'existe plus.");
                } else {
                    pushFeedback('error', 'Impossible de supprimer la salle.');
                }

                return;
            }

            setRooms((current) => current.filter((item) => item.id !== room.id));
            setUnavailabilities((current) => current.filter((item) => item.room_id !== room.id));

            if (editingRoomId === room.id) {
                setEditingRoomId(null);
                setEditingRoomName('');
                setEditingRoomCapacity('');
                setEditingRoomFloorId('');
            }

            pushFeedback('success', 'Salle supprimée avec succès.');
        } catch {
            pushFeedback('error', 'La requête de suppression de la salle a échoué.');
        } finally {
            setDeletingKey('');
        }
    };

    const handleCreateResource = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const name = newResourceName.trim();

        if (!name) {
            pushFeedback('error', 'Renseigner un nom de ressource.');
            return;
        }

        setSavingKey('resource:new');
        pushFeedback('', '');

        try {
            const { data, error } = await api.POST('/room-resources', {
                body: { name },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', 'Seul un admin peut créer une ressource.');
                } else if (errorCode === 'ROOM_RESOURCE_NAME_EXISTS') {
                    pushFeedback('error', 'Une ressource porte déjà ce nom.');
                } else {
                    pushFeedback('error', 'Impossible de créer la ressource.');
                }

                return;
            }

            if (!data) {
                pushFeedback('error', 'La réponse du serveur est invalide.');
                return;
            }

            setRoomResources((current) => sortByName([...current, data]));
            setNewResourceName('');
            pushFeedback('success', 'Ressource créée avec succès.');
        } catch {
            pushFeedback('error', 'La requête de création de la ressource a échoué.');
        } finally {
            setSavingKey('');
        }
    };

    const startResourceEdit = (resource: RoomResource) => {
        setEditingResourceId(resource.id);
        setEditingResourceName(resource.name);
        pushFeedback('', '');
    };

    const saveResourceEdit = async (resourceId: number) => {
        const name = editingResourceName.trim();

        if (!name) {
            pushFeedback('error', 'Le nom de la ressource est obligatoire.');
            return;
        }

        setSavingKey(`resource:${resourceId}`);
        pushFeedback('', '');

        try {
            const { data, error } = await api.PUT('/room-resources/{id}', {
                params: {
                    path: { id: resourceId },
                },
                body: { name },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', 'Seul un admin peut modifier une ressource.');
                } else if (errorCode === 'ROOM_RESOURCE_NAME_EXISTS') {
                    pushFeedback('error', 'Une ressource porte déjà ce nom.');
                } else if (errorCode === 'ROOM_RESOURCE_NOT_FOUND') {
                    pushFeedback('error', "Cette ressource n'existe plus.");
                } else {
                    pushFeedback('error', 'Impossible de modifier la ressource.');
                }

                return;
            }

            if (!data) {
                pushFeedback('error', 'La réponse du serveur est invalide.');
                return;
            }

            setRoomResources((current) => sortByName(current.map((item) => (item.id === resourceId ? data : item))));
            setRoomAssignments((current) =>
                sortAssignments(
                    current.map((item) => (item.resource_id === resourceId ? { ...item, name: data.name } : item)),
                ),
            );
            setEditingResourceId(null);
            setEditingResourceName('');
            pushFeedback('success', 'Ressource modifiée avec succès.');
        } catch {
            pushFeedback('error', 'La requête de modification de la ressource a échoué.');
        } finally {
            setSavingKey('');
        }
    };

    const deleteResource = async (resource: RoomResource) => {
        const confirmed = window.confirm(`Supprimer la ressource "${resource.name}" ?`);

        if (!confirmed) {
            return;
        }

        setDeletingKey(`resource:${resource.id}`);
        pushFeedback('', '');

        try {
            const { error } = await api.DELETE('/room-resources/{id}', {
                params: {
                    path: { id: resource.id },
                },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', 'Seul un admin peut supprimer une ressource.');
                } else if (errorCode === 'ROOM_RESOURCE_NOT_FOUND') {
                    pushFeedback('error', "Cette ressource n'existe plus.");
                } else {
                    pushFeedback('error', 'Impossible de supprimer la ressource.');
                }

                return;
            }

            setRoomResources((current) => current.filter((item) => item.id !== resource.id));
            setRoomAssignments((current) => current.filter((item) => item.resource_id !== resource.id));

            if (editingResourceId === resource.id) {
                setEditingResourceId(null);
                setEditingResourceName('');
            }

            pushFeedback('success', 'Ressource supprimée avec succès.');
        } catch {
            pushFeedback('error', 'La requête de suppression de la ressource a échoué.');
        } finally {
            setDeletingKey('');
        }
    };

    const handleSetAssignment = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const roomId = parsePositiveInteger(selectedAssignmentRoomId);
        const resourceId = parsePositiveInteger(selectedResourceId);
        const quantity = parsePositiveInteger(newAssignmentQuantity);

        if (!roomId) {
            pushFeedback('error', 'Sélectionner une salle.');
            return;
        }

        if (!resourceId) {
            pushFeedback('error', 'Sélectionner une ressource.');
            return;
        }

        if (!quantity) {
            pushFeedback('error', 'La quantité doit être un entier positif.');
            return;
        }

        setSavingKey(`assignment:new:${roomId}`);
        pushFeedback('', '');

        try {
            const { data, error } = await api.PUT('/rooms/{roomId}/resources/{resourceId}', {
                params: {
                    path: {
                        roomId,
                        resourceId,
                    },
                },
                body: {
                    quantity,
                },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', 'Seul un admin peut affecter une ressource.');
                } else if (errorCode === 'ROOM_NOT_FOUND') {
                    pushFeedback('error', "La salle selectionnée n'existe plus.");
                } else if (errorCode === 'ROOM_RESOURCE_NOT_FOUND') {
                    pushFeedback('error', "La ressource selectionnée n'existe plus.");
                } else {
                    pushFeedback('error', "Impossible d'affecter cette ressource.");
                }

                return;
            }

            if (!data) {
                pushFeedback('error', 'La réponse du serveur est invalide.');
                return;
            }

            setRoomAssignments((current) =>
                sortAssignments([...current.filter((item) => item.resource_id !== data.resource_id), data]),
            );
            setAssignmentQuantityDrafts((current) => ({
                ...current,
                [data.resource_id]: String(data.quantity),
            }));
            setNewAssignmentQuantity('1');
            pushFeedback('success', 'Ressource affectée à la salle.');
        } catch {
            pushFeedback('error', "La requête d'affectation de la ressource a échoué.");
        } finally {
            setSavingKey('');
        }
    };

    const saveAssignmentQuantity = async (resourceId: number) => {
        const roomId = parsePositiveInteger(selectedAssignmentRoomId);
        const quantity = parsePositiveInteger(assignmentQuantityDrafts[resourceId] ?? '');

        if (!roomId) {
            pushFeedback('error', 'Sélectionner une salle.');
            return;
        }

        if (!quantity) {
            pushFeedback('error', 'La quantité doit être un entier positif.');
            return;
        }

        setSavingKey(`assignment:${roomId}:${resourceId}`);
        pushFeedback('', '');

        try {
            const { data, error } = await api.PUT('/rooms/{roomId}/resources/{resourceId}', {
                params: {
                    path: {
                        roomId,
                        resourceId,
                    },
                },
                body: {
                    quantity,
                },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', 'Seul un admin peut modifier une affectation.');
                } else if (errorCode === 'ROOM_NOT_FOUND') {
                    pushFeedback('error', "La salle selectionnée n'existe plus.");
                } else if (errorCode === 'ROOM_RESOURCE_NOT_FOUND') {
                    pushFeedback('error', "La ressource selectionnée n'existe plus.");
                } else {
                    pushFeedback('error', 'Impossible de modifier cette affectation.');
                }

                return;
            }

            if (!data) {
                pushFeedback('error', 'La réponse du serveur est invalide.');
                return;
            }

            setRoomAssignments((current) =>
                sortAssignments([...current.filter((item) => item.resource_id !== data.resource_id), data]),
            );
            setAssignmentQuantityDrafts((current) => ({
                ...current,
                [data.resource_id]: String(data.quantity),
            }));
            pushFeedback('success', 'Quantité mise à jour.');
        } catch {
            pushFeedback('error', "La requête de mise à jour de l'affectation a échoué.");
        } finally {
            setSavingKey('');
        }
    };

    const deleteAssignment = async (assignment: RoomResourceAssignment) => {
        const roomId = parsePositiveInteger(selectedAssignmentRoomId);

        if (!roomId) {
            pushFeedback('error', 'Sélectionner une salle.');
            return;
        }

        const confirmed = window.confirm(`Retirer "${assignment.name}" de cette salle ?`);

        if (!confirmed) {
            return;
        }

        setDeletingKey(`assignment:${roomId}:${assignment.resource_id}`);
        pushFeedback('', '');

        try {
            const { error } = await api.DELETE('/rooms/{roomId}/resources/{resourceId}', {
                params: {
                    path: {
                        roomId,
                        resourceId: assignment.resource_id,
                    },
                },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', 'Seul un admin peut supprimer une affectation.');
                } else if (errorCode === 'ROOM_RESOURCE_ASSIGNMENT_NOT_FOUND') {
                    pushFeedback('error', "Cette affectation n'existe plus.");
                } else {
                    pushFeedback('error', 'Impossible de supprimer cette affectation.');
                }

                return;
            }

            setRoomAssignments((current) => current.filter((item) => item.resource_id !== assignment.resource_id));
            setAssignmentQuantityDrafts((current) => {
                const next = { ...current };
                delete next[assignment.resource_id];
                return next;
            });
            pushFeedback('success', 'Affectation supprimée.');
        } catch {
            pushFeedback('error', "La requête de suppression de l'affectation a échoué.");
        } finally {
            setDeletingKey('');
        }
    };

    const handleCreateUnavailability = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const roomId = parsePositiveInteger(newUnavailabilityRoomId);
        const fromTime = toIsoString(newUnavailabilityFrom);
        const toTime = toIsoString(newUnavailabilityTo);
        const reason = newUnavailabilityReason.trim();

        if (!roomId) {
            pushFeedback('error', 'Sélectionner une salle.');
            return;
        }

        if (!fromTime || !toTime) {
            pushFeedback('error', 'Renseigner un début et une fin.');
            return;
        }

        if (new Date(fromTime) >= new Date(toTime)) {
            pushFeedback('error', 'La fin doit être après le début.');
            return;
        }

        if (!reason) {
            pushFeedback('error', "Renseigner une raison d'indisponibilité.");
            return;
        }

        setSavingKey('unavailability:new');
        pushFeedback('', '');

        try {
            const { data, error } = await api.POST('/room-unavailabilities', {
                body: {
                    room_id: roomId,
                    from_time: fromTime,
                    to_time: toTime,
                    reason,
                },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', 'Seul un admin peut créer une indisponibilité.');
                } else if (errorCode === 'ROOM_NOT_FOUND') {
                    pushFeedback('error', "La salle selectionnée n'existe plus.");
                } else if (errorCode === 'ROOM_UNAVAILABILITY_CONFLICT' || errorCode === 'INVALID_DATE_RANGE') {
                    pushFeedback('error', "Le créneau d'indisponibilité est invalide ou entre en conflit.");
                } else {
                    pushFeedback('error', "Impossible de créer l'indisponibilité.");
                }

                return;
            }

            if (!data) {
                pushFeedback('error', 'La réponse du serveur est invalide.');
                return;
            }

            setUnavailabilities((current) => sortUnavailabilities([...current, data]));
            setNewUnavailabilityFrom('');
            setNewUnavailabilityTo('');
            setNewUnavailabilityReason('');
            pushFeedback('success', 'Indisponibilité créée. Les réservations en conflit ont pu être annulées.');
        } catch {
            pushFeedback('error', "La requête de création de l'indisponibilité a échoué.");
        } finally {
            setSavingKey('');
        }
    };

    const startUnavailabilityEdit = (item: RoomUnavailability) => {
        setEditingUnavailabilityId(item.id);
        setEditingUnavailabilityRoomId(String(item.room_id));
        setEditingUnavailabilityFrom(toDateTimeLocalValue(item.from_time));
        setEditingUnavailabilityTo(toDateTimeLocalValue(item.to_time));
        setEditingUnavailabilityReason(item.reason);
        pushFeedback('', '');
    };

    const saveUnavailabilityEdit = async (unavailabilityId: number) => {
        const roomId = parsePositiveInteger(editingUnavailabilityRoomId);
        const fromTime = toIsoString(editingUnavailabilityFrom);
        const toTime = toIsoString(editingUnavailabilityTo);
        const reason = editingUnavailabilityReason.trim();

        if (!roomId) {
            pushFeedback('error', 'Sélectionner une salle valide.');
            return;
        }

        if (!fromTime || !toTime) {
            pushFeedback('error', 'Renseigner un début et une fin.');
            return;
        }

        if (new Date(fromTime) >= new Date(toTime)) {
            pushFeedback('error', 'La fin doit être après le début.');
            return;
        }

        if (!reason) {
            pushFeedback('error', 'La raison est obligatoire.');
            return;
        }

        setSavingKey(`unavailability:${unavailabilityId}`);
        pushFeedback('', '');

        try {
            const { data, error } = await api.PUT('/room-unavailabilities/{id}', {
                params: {
                    path: { id: unavailabilityId },
                },
                body: {
                    room_id: roomId,
                    from_time: fromTime,
                    to_time: toTime,
                    reason,
                },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', 'Seul un admin peut modifier une indisponibilité.');
                } else if (errorCode === 'ROOM_UNAVAILABILITY_CONFLICT' || errorCode === 'INVALID_DATE_RANGE') {
                    pushFeedback('error', "Le nouveau créneau d'indisponibilité entre en conflit ou est invalide.");
                } else if (errorCode === 'ROOM_UNAVAILABILITY_NOT_FOUND') {
                    pushFeedback('error', "Cette indisponibilité n'existe plus.");
                } else if (errorCode === 'ROOM_NOT_FOUND') {
                    pushFeedback('error', "La salle selectionnée n'existe plus.");
                } else {
                    pushFeedback('error', "Impossible de modifier l'indisponibilité.");
                }

                return;
            }

            if (!data) {
                pushFeedback('error', 'La réponse du serveur est invalide.');
                return;
            }

            setUnavailabilities((current) =>
                sortUnavailabilities(current.map((item) => (item.id === unavailabilityId ? data : item))),
            );
            setEditingUnavailabilityId(null);
            setEditingUnavailabilityRoomId('');
            setEditingUnavailabilityFrom('');
            setEditingUnavailabilityTo('');
            setEditingUnavailabilityReason('');
            pushFeedback('success', 'Indisponibilité modifiée. Les réservations en conflit ont pu être recalculées.');
        } catch {
            pushFeedback('error', "La requête de modification de l'indisponibilité a échoué.");
        } finally {
            setSavingKey('');
        }
    };

    const deleteUnavailability = async (item: RoomUnavailability) => {
        const confirmed = window.confirm(`Supprimer l'indisponibilité "${item.reason}" ?`);

        if (!confirmed) {
            return;
        }

        setDeletingKey(`unavailability:${item.id}`);
        pushFeedback('', '');

        try {
            const { error } = await api.DELETE('/room-unavailabilities/{id}', {
                params: {
                    path: { id: item.id },
                },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', 'Seul un admin peut supprimer une indisponibilité.');
                } else if (errorCode === 'ROOM_UNAVAILABILITY_NOT_FOUND') {
                    pushFeedback('error', "Cette indisponibilité n'existe plus.");
                } else {
                    pushFeedback('error', "Impossible de supprimer l'indisponibilité.");
                }

                return;
            }

            setUnavailabilities((current) => current.filter((entry) => entry.id !== item.id));

            if (editingUnavailabilityId === item.id) {
                setEditingUnavailabilityId(null);
                setEditingUnavailabilityRoomId('');
                setEditingUnavailabilityFrom('');
                setEditingUnavailabilityTo('');
                setEditingUnavailabilityReason('');
            }

            pushFeedback('success', 'Indisponibilité supprimée.');
        } catch {
            pushFeedback('error', "La requête de suppression de l'indisponibilité a échoué.");
        } finally {
            setDeletingKey('');
        }
    };

    const saveIncidentStatus = async (incident: Incident) => {
        const nextStatus = incidentStatusDrafts[incident.id] ?? incident.status;

        if (nextStatus === incident.status) {
            return;
        }

        setSavingKey(`incident:${incident.id}`);
        pushFeedback('', '');

        try {
            const { data, error } = await api.PUT('/incidents/{id}', {
                params: {
                    path: { id: incident.id },
                },
                body: {
                    status: nextStatus,
                },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', 'Seul un admin peut modérer un incident.');
                } else if (errorCode === 'INCIDENT_ALREADY_RESOLVED' || errorCode === 'INCIDENT_INVALID_TRANSITION') {
                    pushFeedback('error', 'La transition de statut est invalide pour cet incident.');
                } else if (errorCode === 'INCIDENT_NOT_FOUND') {
                    pushFeedback('error', "Cet incident n'existe plus.");
                } else {
                    pushFeedback('error', "Impossible de mettre à jour l'incident.");
                }

                return;
            }

            if (!data) {
                pushFeedback('error', 'La réponse du serveur est invalide.');
                return;
            }

            setIncidents((current) => sortIncidents(current.map((item) => (item.id === incident.id ? data : item))));
            pushFeedback('success', "Statut de l'incident mis à jour.");
        } catch {
            pushFeedback('error', "La requête de mise à jour de l'incident a échoué.");
        } finally {
            setSavingKey('');
        }
    };

    const deleteIncident = async (incident: Incident) => {
        const confirmed = window.confirm(`Supprimer l'incident "${incident.title}" ?`);

        if (!confirmed) {
            return;
        }

        setDeletingKey(`incident:${incident.id}`);
        pushFeedback('', '');

        try {
            const { error } = await api.DELETE('/incidents/{id}', {
                params: {
                    path: { id: incident.id },
                },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', 'Seul un admin peut supprimer un incident.');
                } else if (errorCode === 'INCIDENT_NOT_FOUND') {
                    pushFeedback('error', "Cet incident n'existe plus.");
                } else {
                    pushFeedback('error', "Impossible de supprimer l'incident.");
                }

                return;
            }

            setIncidents((current) => current.filter((item) => item.id !== incident.id));
            pushFeedback('success', 'Incident supprimé.');
        } catch {
            pushFeedback('error', "La requête de suppression de l'incident a échoué.");
        } finally {
            setDeletingKey('');
        }
    };

    const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const first_name = newUserFirstName.trim();
        const last_name = newUserLastName.trim();
        const email = newUserEmail.trim().toLowerCase();
        const password = newUserPassword.trim();

        if (!first_name || !last_name || !email || !password) {
            pushFeedback('error', 'Tous les champs utilisateur sont obligatoires.');
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            pushFeedback('error', 'Renseigner une adresse email valide.');
            return;
        }

        if (password.length < 8) {
            pushFeedback('error', 'Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }

        setSavingKey('user:new');
        pushFeedback('', '');

        try {
            const { data, error } = await api.POST('/users', {
                body: {
                    first_name,
                    last_name,
                    email,
                    password,
                },
            });

            const errorCode = getErrorCode(error);

            if (handleUnauthorized(errorCode)) {
                return;
            }

            if (error) {
                if (errorCode === 'FORBIDDEN') {
                    pushFeedback('error', 'Seul un admin peut créer un compte.');
                } else if (errorCode === 'EMAIL_ALREADY_EXISTS') {
                    pushFeedback('error', 'Cette adresse email existe déjà.');
                } else if (errorCode === 'INVALID_BODY') {
                    pushFeedback(
                        'error',
                        "Les données du formulaire sont invalides. Vérifiez l'email et le mot de passe (min 8 caractères).",
                    );
                } else {
                    pushFeedback('error', 'Impossible de créer le compte utilisateur.');
                }

                return;
            }

            if (!data) {
                pushFeedback('error', 'La réponse du serveur est invalide.');
                return;
            }

            setLastCreatedUser(data);
            setNewUserFirstName('');
            setNewUserLastName('');
            setNewUserEmail('');
            setNewUserPassword('');
            pushFeedback('success', 'Compte utilisateur créé avec succès.');
        } catch {
            pushFeedback('error', 'La requête de création du compte a échoué.');
        } finally {
            setSavingKey('');
        }
    };

    if (isLoading) {
        return (
            <div className="flex-grow px-margin-mobile md:px-margin-desktop py-gutter flex flex-col gap-gutter max-w-7xl mx-auto w-full">
                <div className="bg-surface border-[3px] border-on-surface p-6 neo-shadow text-center font-bold">
                    Chargement du centre d'administration...
                </div>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="flex-grow px-margin-mobile md:px-margin-desktop py-gutter flex flex-col gap-gutter max-w-7xl mx-auto w-full">
                <div className="bg-error-container text-on-error-container border-[3px] border-on-surface p-6 neo-shadow font-bold">
                    {errorMessage}
                </div>

                <Button variant="primary" className="w-fit" onClick={() => void loadAdminData()}>
                    <Icon name="refresh" />
                    Réessayer
                </Button>
            </div>
        );
    }

    const activeIncidentCount = incidents.filter((incident) => incident.status !== 'RESOLVED').length;

    return (
        <div className="flex-grow px-margin-mobile md:px-margin-desktop py-gutter flex flex-col gap-10 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="font-headline-xl text-[48px] leading-[56px] font-black text-on-surface uppercase border-b-[6px] border-primary inline-block pb-2">
                        Centre de commandes
                    </h1>
                    <p className="font-body-lg text-[18px] leading-[28px] mt-2 font-medium text-on-surface-variant max-w-3xl">
                        Administration des bâtiments, salles, ressources, indisponibilités et incidents.
                        {user ? ` Connecté en tant que ${user.first_name} ${user.last_name}.` : ''}
                    </p>
                </div>

                <Button variant="outline" onClick={() => void loadAdminData()}>
                    <Icon name="refresh" />
                    Rafraîchir
                </Button>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter">
                <AdminStatCard
                    title="Bâtiments"
                    value={buildings.length}
                    subtitle="Bâtiments"
                    icon="domain"
                    bgClass="bg-primary-fixed"
                />
                <AdminStatCard
                    title="Étages"
                    value={floors.length}
                    subtitle="Étages"
                    icon="layers"
                    bgClass="bg-secondary-container"
                />
                <AdminStatCard
                    title="Salles"
                    value={rooms.length}
                    subtitle="Salles"
                    icon="meeting_room"
                    bgClass="bg-tertiary-fixed"
                />
                <AdminStatCard
                    title="Alertes"
                    value={activeIncidentCount}
                    subtitle="Incidents actifs"
                    icon="warning"
                    bgClass="bg-error-container"
                    valueColorClass="text-on-error-container"
                />
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-gutter">
                <div className="bg-surface-container-highest border-[3px] border-on-surface neo-shadow p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b-[3px] border-on-surface pb-3">
                        <h2 className="font-headline-md font-bold text-[24px] uppercase">Bâtiments</h2>
                        <span className="font-label-bold font-bold bg-surface border-[3px] border-on-surface px-3 py-1">
                            {buildings.length}
                        </span>
                    </div>

                    <form onSubmit={handleCreateBuilding} className="flex flex-col gap-3">
                        <Input
                            value={newBuildingName}
                            onChange={(event) => setNewBuildingName(event.target.value)}
                            placeholder="Batiment A"
                            disabled={savingKey === 'building:new'}
                        />
                        <Button type="submit" variant="primary" disabled={savingKey === 'building:new'}>
                            <Icon name="add_box" />
                            {savingKey === 'building:new' ? 'Création...' : 'Ajouter le bâtiment'}
                        </Button>
                    </form>

                    {buildings.length === 0 ? (
                        <div className="bg-surface border-[3px] border-on-surface p-4 text-center font-bold">
                            Aucun bâtiment pour le moment.
                        </div>
                    ) : (
                        buildings.map((building) => {
                            const isEditing = editingBuildingId === building.id;
                            const isSaving = savingKey === `building:${building.id}`;
                            const isDeleting = deletingKey === `building:${building.id}`;
                            const floorsCount = floors.filter((floor) => floor.building_id === building.id).length;

                            return (
                                <div
                                    key={building.id}
                                    className="bg-surface-container-lowest border-[3px] border-on-surface p-4 flex flex-col gap-3"
                                >
                                    {isEditing ? (
                                        <>
                                            <Input
                                                value={editingBuildingName}
                                                onChange={(event) => setEditingBuildingName(event.target.value)}
                                                disabled={isSaving}
                                            />
                                            <div className="flex flex-wrap gap-3">
                                                <Button
                                                    type="button"
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => void saveBuildingEdit(building.id)}
                                                    disabled={isSaving}
                                                >
                                                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setEditingBuildingId(null)}
                                                    disabled={isSaving}
                                                >
                                                    Annuler
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <h3 className="font-headline-md font-bold text-[24px]">
                                                    {building.name}
                                                </h3>
                                                <p className="font-body-md text-on-surface-variant">
                                                    {floorsCount} étage(s)
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => startBuildingEdit(building)}
                                                >
                                                    Modifier
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => void deleteBuilding(building)}
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? 'Suppression...' : 'Supprimer'}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="bg-surface-container-highest border-[3px] border-on-surface neo-shadow p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b-[3px] border-on-surface pb-3">
                        <div className="flex flex-col gap-1">
                            <h2 className="font-headline-md font-bold text-[24px] uppercase">Étages</h2>
                            <p className="font-body-md text-on-surface-variant">
                                {selectedBuildingForFloorSection
                                    ? `Affichage limité au bâtiment ${selectedBuildingForFloorSection.name}.`
                                    : 'Affichage de tous les étages.'}
                            </p>
                        </div>

                        <span className="font-label-bold font-bold bg-surface border-[3px] border-on-surface px-3 py-1">
                            {filteredFloorsForSelectedBuilding.length}
                        </span>
                    </div>

                    <form onSubmit={handleCreateFloor} className="flex flex-col gap-3">
                        <select
                            value={newFloorBuildingId}
                            onChange={(event) => setNewFloorBuildingId(event.target.value)}
                            className={selectClassName}
                            disabled={buildings.length === 0 || savingKey === 'floor:new'}
                        >
                            {buildings.length === 0 ? (
                                <option value="">Aucun bâtiment</option>
                            ) : (
                                buildings.map((building) => (
                                    <option key={building.id} value={String(building.id)}>
                                        {building.name}
                                    </option>
                                ))
                            )}
                        </select>

                        <Input
                            value={newFloorName}
                            onChange={(event) => setNewFloorName(event.target.value)}
                            placeholder="Étage 1"
                            disabled={buildings.length === 0 || savingKey === 'floor:new'}
                        />

                        <Button
                            type="submit"
                            variant="secondary"
                            disabled={buildings.length === 0 || savingKey === 'floor:new'}
                        >
                            <Icon name="add_box" />
                            {savingKey === 'floor:new' ? 'Création...' : "Ajouter l'étage"}
                        </Button>
                    </form>

                    {filteredFloorsForSelectedBuilding.length === 0 ? (
                        <div className="bg-surface border-[3px] border-on-surface p-4 text-center font-bold">
                            {selectedBuildingForFloorSection
                                ? "Aucun étage n'est encore rattaché à ce bâtiment."
                                : 'Aucun étage pour le moment.'}
                        </div>
                    ) : (
                        filteredFloorsForSelectedBuilding.map((floor) => {
                            const isEditing = editingFloorId === floor.id;
                            const isSaving = savingKey === `floor:${floor.id}`;
                            const isDeleting = deletingKey === `floor:${floor.id}`;
                            const roomsCount = rooms.filter((room) => room.floor_id === floor.id).length;

                            return (
                                <div
                                    key={floor.id}
                                    className="bg-surface-container-lowest border-[3px] border-on-surface p-4 flex flex-col gap-3"
                                >
                                    {isEditing ? (
                                        <>
                                            <Input
                                                value={editingFloorName}
                                                onChange={(event) => setEditingFloorName(event.target.value)}
                                                disabled={isSaving}
                                            />
                                            <select
                                                value={editingFloorBuildingId}
                                                onChange={(event) => setEditingFloorBuildingId(event.target.value)}
                                                className={selectClassName}
                                                disabled={isSaving}
                                            >
                                                {buildings.map((building) => (
                                                    <option key={building.id} value={String(building.id)}>
                                                        {building.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="flex flex-wrap gap-3">
                                                <Button
                                                    type="button"
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => void saveFloorEdit(floor.id)}
                                                    disabled={isSaving}
                                                >
                                                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setEditingFloorId(null)}
                                                    disabled={isSaving}
                                                >
                                                    Annuler
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <h3 className="font-headline-md font-bold text-[24px]">{floor.name}</h3>
                                                <p className="font-body-md text-on-surface-variant">
                                                    {buildingById.get(floor.building_id)?.name ?? 'Bâtiment inconnu'} •{' '}
                                                    {roomsCount} salle(s)
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => startFloorEdit(floor)}
                                                >
                                                    Modifier
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => void deleteFloor(floor)}
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? 'Suppression...' : 'Supprimer'}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="bg-surface-container-highest border-[3px] border-on-surface neo-shadow p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b-[3px] border-on-surface pb-3">
                        <div className="flex flex-col gap-1">
                            <h2 className="font-headline-md font-bold text-[24px] uppercase">Salles</h2>
                            <p className="font-body-md text-on-surface-variant">
                                {selectedFloorForRoomSection
                                    ? `Affichage limité à l'étage ${selectedFloorForRoomSection.name}${
                                          selectedRoomSectionBuilding ? ` (${selectedRoomSectionBuilding.name})` : ''
                                      }.`
                                    : 'Affichage de toutes les salles.'}
                            </p>
                        </div>

                        <span className="font-label-bold font-bold bg-surface border-[3px] border-on-surface px-3 py-1">
                            {filteredRoomsForSelectedFloor.length}
                        </span>
                    </div>

                    <form onSubmit={handleCreateRoom} className="flex flex-col gap-3">
                        <select
                            value={newRoomFloorId}
                            onChange={(event) => setNewRoomFloorId(event.target.value)}
                            className={selectClassName}
                            disabled={floors.length === 0 || savingKey === 'room:new'}
                        >
                            {floors.length === 0 ? (
                                <option value="">Aucun étage</option>
                            ) : (
                                floors.map((floor) => (
                                    <option key={floor.id} value={String(floor.id)}>
                                        {floor.name} - {buildingById.get(floor.building_id)?.name ?? 'Bâtiment inconnu'}
                                    </option>
                                ))
                            )}
                        </select>

                        <Input
                            value={newRoomName}
                            onChange={(event) => setNewRoomName(event.target.value)}
                            placeholder="Salle 101"
                            disabled={floors.length === 0 || savingKey === 'room:new'}
                        />

                        <Input
                            type="number"
                            min={1}
                            value={newRoomCapacity}
                            onChange={(event) => setNewRoomCapacity(event.target.value)}
                            placeholder="Capacité"
                            disabled={floors.length === 0 || savingKey === 'room:new'}
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={floors.length === 0 || savingKey === 'room:new'}
                        >
                            <Icon name="add_box" />
                            {savingKey === 'room:new' ? 'Création...' : 'Ajouter la salle'}
                        </Button>
                    </form>

                    {filteredRoomsForSelectedFloor.length === 0 ? (
                        <div className="bg-surface border-[3px] border-on-surface p-4 text-center font-bold">
                            {selectedFloorForRoomSection
                                ? "Aucune salle n'est encore rattachée à cet étage."
                                : 'Aucune salle pour le moment.'}
                        </div>
                    ) : (
                        filteredRoomsForSelectedFloor.map((room) => {
                            const isEditing = editingRoomId === room.id;
                            const isSaving = savingKey === `room:${room.id}`;
                            const isDeleting = deletingKey === `room:${room.id}`;

                            return (
                                <div
                                    key={room.id}
                                    className="bg-surface-container-lowest border-[3px] border-on-surface p-4 flex flex-col gap-3"
                                >
                                    {isEditing ? (
                                        <>
                                            <Input
                                                value={editingRoomName}
                                                onChange={(event) => setEditingRoomName(event.target.value)}
                                                disabled={isSaving}
                                            />
                                            <select
                                                value={editingRoomFloorId}
                                                onChange={(event) => setEditingRoomFloorId(event.target.value)}
                                                className={selectClassName}
                                                disabled={isSaving}
                                            >
                                                {floors.map((floor) => (
                                                    <option key={floor.id} value={String(floor.id)}>
                                                        {floor.name} -{' '}
                                                        {buildingById.get(floor.building_id)?.name ??
                                                            'Bâtiment inconnu'}
                                                    </option>
                                                ))}
                                            </select>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={editingRoomCapacity}
                                                onChange={(event) => setEditingRoomCapacity(event.target.value)}
                                                disabled={isSaving}
                                            />
                                            <div className="flex flex-wrap gap-3">
                                                <Button
                                                    type="button"
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => void saveRoomEdit(room.id)}
                                                    disabled={isSaving}
                                                >
                                                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setEditingRoomId(null)}
                                                    disabled={isSaving}
                                                >
                                                    Annuler
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <h3 className="font-headline-md font-bold text-[24px]">{room.name}</h3>
                                                <p className="font-body-md text-on-surface-variant">
                                                    Capacité : {room.capacity} •{' '}
                                                    {buildRoomLocation(room, floorById, buildingById)}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => startRoomEdit(room)}
                                                >
                                                    Modifier
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => void deleteRoom(room)}
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? 'Suppression...' : 'Supprimer'}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-gutter">
                <div className="bg-surface-container-highest border-[3px] border-on-surface neo-shadow p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b-[3px] border-on-surface pb-3">
                        <h2 className="font-headline-md font-bold text-[24px] uppercase">Catalogue de ressources</h2>
                        <span className="font-label-bold font-bold bg-surface border-[3px] border-on-surface px-3 py-1">
                            {roomResources.length}
                        </span>
                    </div>

                    <form onSubmit={handleCreateResource} className="flex flex-col gap-3">
                        <Input
                            value={newResourceName}
                            onChange={(event) => setNewResourceName(event.target.value)}
                            placeholder="Projecteur"
                            disabled={savingKey === 'resource:new'}
                        />
                        <Button type="submit" variant="secondary" disabled={savingKey === 'resource:new'}>
                            <Icon name="add_box" />
                            {savingKey === 'resource:new' ? 'Création...' : 'Ajouter la ressource'}
                        </Button>
                    </form>

                    {roomResources.length === 0 ? (
                        <div className="bg-surface border-[3px] border-on-surface p-4 text-center font-bold">
                            Aucune ressource cataloguée.
                        </div>
                    ) : (
                        roomResources.map((resource) => {
                            const isEditing = editingResourceId === resource.id;
                            const isSaving = savingKey === `resource:${resource.id}`;
                            const isDeleting = deletingKey === `resource:${resource.id}`;

                            return (
                                <div
                                    key={resource.id}
                                    className="bg-surface-container-lowest border-[3px] border-on-surface p-4 flex flex-col gap-3"
                                >
                                    {isEditing ? (
                                        <>
                                            <Input
                                                value={editingResourceName}
                                                onChange={(event) => setEditingResourceName(event.target.value)}
                                                disabled={isSaving}
                                            />
                                            <div className="flex flex-wrap gap-3">
                                                <Button
                                                    type="button"
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => void saveResourceEdit(resource.id)}
                                                    disabled={isSaving}
                                                >
                                                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setEditingResourceId(null)}
                                                    disabled={isSaving}
                                                >
                                                    Annuler
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <h3 className="font-headline-md font-bold text-[24px]">
                                                    {resource.name}
                                                </h3>
                                                <p className="font-body-md text-on-surface-variant">
                                                    Ressource réutilisable dans les affectations par salle.
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => startResourceEdit(resource)}
                                                >
                                                    Modifier
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => void deleteResource(resource)}
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? 'Suppression...' : 'Supprimer'}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="bg-surface-container-highest border-[3px] border-on-surface neo-shadow p-6 flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between border-b-[3px] border-on-surface pb-3">
                        <h2 className="font-headline-md font-bold text-[24px] uppercase">
                            Affectations salle → ressources
                        </h2>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                if (selectedAssignmentRoomId) {
                                    void loadRoomAssignments(Number(selectedAssignmentRoomId));
                                }
                            }}
                        >
                            <Icon name="refresh" />
                            Recharger
                        </Button>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-label-bold font-bold text-on-surface-variant">Salle active</label>
                        <select
                            value={selectedAssignmentRoomId}
                            onChange={(event) => setSelectedAssignmentRoomId(event.target.value)}
                            className={selectClassName}
                            disabled={rooms.length === 0}
                        >
                            {rooms.length === 0 ? (
                                <option value="">Aucune salle</option>
                            ) : (
                                rooms.map((room) => (
                                    <option key={room.id} value={String(room.id)}>
                                        {room.name} - {buildRoomLocation(room, floorById, buildingById)}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <form
                        onSubmit={handleSetAssignment}
                        className="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-3 items-end"
                    >
                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold font-bold text-on-surface-variant">Ressource</label>
                            <select
                                value={selectedResourceId}
                                onChange={(event) => setSelectedResourceId(event.target.value)}
                                className={selectClassName}
                                disabled={roomResources.length === 0 || rooms.length === 0}
                            >
                                {roomResources.length === 0 ? (
                                    <option value="">Aucune ressource</option>
                                ) : (
                                    roomResources.map((resource) => (
                                        <option key={resource.id} value={String(resource.id)}>
                                            {resource.name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-label-bold font-bold text-on-surface-variant">Quantité</label>
                            <Input
                                type="number"
                                min={1}
                                value={newAssignmentQuantity}
                                onChange={(event) => setNewAssignmentQuantity(event.target.value)}
                                disabled={roomResources.length === 0 || rooms.length === 0}
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={
                                roomResources.length === 0 ||
                                rooms.length === 0 ||
                                savingKey === `assignment:new:${selectedAssignmentRoomId}`
                            }
                        >
                            <Icon name="add_box" />
                            Affecter
                        </Button>
                    </form>

                    {assignmentErrorMessage ? (
                        <div className="bg-error-container text-on-error-container border-[3px] border-on-surface p-4 font-bold">
                            {assignmentErrorMessage}
                        </div>
                    ) : null}

                    {isAssignmentsLoading ? (
                        <div className="bg-surface border-[3px] border-on-surface p-4 text-center font-bold">
                            Chargement des affectations...
                        </div>
                    ) : roomAssignments.length === 0 ? (
                        <div className="bg-surface border-[3px] border-on-surface p-4 text-center font-bold">
                            Aucune ressource affectée à cette salle.
                        </div>
                    ) : (
                        roomAssignments.map((assignment) => {
                            const isSaving =
                                savingKey === `assignment:${selectedAssignmentRoomId}:${assignment.resource_id}`;
                            const isDeleting =
                                deletingKey === `assignment:${selectedAssignmentRoomId}:${assignment.resource_id}`;

                            return (
                                <div
                                    key={`${assignment.room_id}-${assignment.resource_id}`}
                                    className="bg-surface-container-lowest border-[3px] border-on-surface p-4 flex flex-col gap-3"
                                >
                                    <div>
                                        <h3 className="font-headline-md font-bold text-[24px]">{assignment.name}</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-[120px_auto_auto] gap-3 items-end">
                                        <div className="flex flex-col gap-2">
                                            <label className="font-label-bold font-bold text-on-surface-variant">
                                                Quantité
                                            </label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={assignmentQuantityDrafts[assignment.resource_id] ?? ''}
                                                onChange={(event) =>
                                                    setAssignmentQuantityDrafts((current) => ({
                                                        ...current,
                                                        [assignment.resource_id]: event.target.value,
                                                    }))
                                                }
                                                disabled={isSaving || isDeleting}
                                            />
                                        </div>

                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => void saveAssignmentQuantity(assignment.resource_id)}
                                            disabled={isSaving || isDeleting}
                                        >
                                            {isSaving ? 'Maj...' : 'Mettre à jour'}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            onClick={() => void deleteAssignment(assignment)}
                                            disabled={isSaving || isDeleting}
                                        >
                                            {isDeleting ? 'Suppression...' : 'Retirer'}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            <section className="bg-surface-container-highest border-[3px] border-on-surface neo-shadow p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-2 border-b-[3px] border-on-surface pb-4">
                    <h2 className="font-headline-lg font-black text-[24px] uppercase">Indisponibilités</h2>
                    <p className="font-body-md text-on-surface-variant">
                        La création ou la modification d'une indisponibilité peut annuler automatiquement des
                        réservations en conflit.
                    </p>
                </div>

                <form
                    onSubmit={handleCreateUnavailability}
                    className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start"
                >
                    <div className="flex flex-col gap-2">
                        <label className="font-label-bold font-bold text-on-surface-variant">Salle</label>
                        <select
                            value={newUnavailabilityRoomId}
                            onChange={(event) => setNewUnavailabilityRoomId(event.target.value)}
                            className={selectClassName}
                            disabled={rooms.length === 0 || savingKey === 'unavailability:new'}
                        >
                            {rooms.length === 0 ? (
                                <option value="">Aucune salle</option>
                            ) : (
                                rooms.map((room) => (
                                    <option key={room.id} value={String(room.id)}>
                                        {room.name} - {buildRoomLocation(room, floorById, buildingById)}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-label-bold font-bold text-on-surface-variant">Debut</label>
                        <Input
                            type="datetime-local"
                            value={newUnavailabilityFrom}
                            onChange={(event) => setNewUnavailabilityFrom(event.target.value)}
                            disabled={savingKey === 'unavailability:new'}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-label-bold font-bold text-on-surface-variant">Fin</label>
                        <Input
                            type="datetime-local"
                            value={newUnavailabilityTo}
                            onChange={(event) => setNewUnavailabilityTo(event.target.value)}
                            disabled={savingKey === 'unavailability:new'}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="font-label-bold font-bold text-on-surface-variant">Raison</label>
                        <Input
                            value={newUnavailabilityReason}
                            onChange={(event) => setNewUnavailabilityReason(event.target.value)}
                            placeholder="Maintenance, travaux..."
                            disabled={savingKey === 'unavailability:new'}
                        />
                    </div>

                    <div className="lg:col-span-4">
                        <Button type="submit" variant="primary" disabled={savingKey === 'unavailability:new'}>
                            <Icon name="build" />
                            {savingKey === 'unavailability:new' ? 'Création...' : 'Ajouter une indisponibilité'}
                        </Button>
                    </div>
                </form>

                {unavailabilities.length === 0 ? (
                    <div className="bg-surface border-[3px] border-on-surface p-4 text-center font-bold">
                        Aucune indisponibilité enregistrée.
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {unavailabilities.map((item) => {
                            const room = roomById.get(item.room_id) ?? null;
                            const isEditing = editingUnavailabilityId === item.id;
                            const isSaving = savingKey === `unavailability:${item.id}`;
                            const isDeleting = deletingKey === `unavailability:${item.id}`;

                            return (
                                <div
                                    key={item.id}
                                    className="bg-surface-container-lowest border-[3px] border-on-surface p-4 flex flex-col gap-4"
                                >
                                    {isEditing ? (
                                        <>
                                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                                <select
                                                    value={editingUnavailabilityRoomId}
                                                    onChange={(event) =>
                                                        setEditingUnavailabilityRoomId(event.target.value)
                                                    }
                                                    className={selectClassName}
                                                    disabled={isSaving}
                                                >
                                                    {rooms.map((availableRoom) => (
                                                        <option key={availableRoom.id} value={String(availableRoom.id)}>
                                                            {availableRoom.name} -{' '}
                                                            {buildRoomLocation(availableRoom, floorById, buildingById)}
                                                        </option>
                                                    ))}
                                                </select>

                                                <Input
                                                    type="datetime-local"
                                                    value={editingUnavailabilityFrom}
                                                    onChange={(event) =>
                                                        setEditingUnavailabilityFrom(event.target.value)
                                                    }
                                                    disabled={isSaving}
                                                />

                                                <Input
                                                    type="datetime-local"
                                                    value={editingUnavailabilityTo}
                                                    onChange={(event) => setEditingUnavailabilityTo(event.target.value)}
                                                    disabled={isSaving}
                                                />

                                                <Input
                                                    value={editingUnavailabilityReason}
                                                    onChange={(event) =>
                                                        setEditingUnavailabilityReason(event.target.value)
                                                    }
                                                    disabled={isSaving}
                                                />
                                            </div>

                                            <div className="flex flex-wrap gap-3">
                                                <Button
                                                    type="button"
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => void saveUnavailabilityEdit(item.id)}
                                                    disabled={isSaving}
                                                >
                                                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setEditingUnavailabilityId(null)}
                                                    disabled={isSaving}
                                                >
                                                    Annuler
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                                <div>
                                                    <h3 className="font-headline-md font-bold text-[24px]">
                                                        {room?.name ?? `Salle #${item.room_id}`}
                                                    </h3>
                                                    <p className="font-body-md text-on-surface-variant">
                                                        {room
                                                            ? buildRoomLocation(room, floorById, buildingById)
                                                            : 'Salle inconnue'}
                                                    </p>
                                                    <p className="font-body-md text-on-surface-variant mt-2">
                                                        {formatDateTime(item.from_time)} →{' '}
                                                        {formatDateTime(item.to_time)}
                                                    </p>
                                                </div>

                                                <span className="bg-secondary-fixed text-on-secondary-fixed font-label-bold font-bold px-3 py-1 border-[3px] border-on-surface uppercase text-xs w-fit">
                                                    Maintenance
                                                </span>
                                            </div>

                                            <p className="font-body-md">{item.reason}</p>

                                            <div className="flex flex-wrap gap-3">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => startUnavailabilityEdit(item)}
                                                >
                                                    Modifier
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => void deleteUnavailability(item)}
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? 'Suppression...' : 'Supprimer'}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="bg-surface-container-highest border-[3px] border-on-surface neo-shadow p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-2 border-b-[3px] border-on-surface pb-4">
                    <h2 className="font-headline-lg font-black text-[24px] uppercase">Incidents</h2>
                    <p className="font-body-md text-on-surface-variant">
                        Un incident "en cours" ne peut pas repasser à l'état "ouvert", et un incident "résolu" devient
                        verrouillé.
                    </p>
                </div>

                {incidents.length === 0 ? (
                    <div className="bg-surface border-[3px] border-on-surface p-4 text-center font-bold">
                        Aucun incident à modérer.
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {incidents.map((incident) => {
                            const room = incident.room_id != null ? (roomById.get(incident.room_id) ?? null) : null;
                            const draftStatus = incidentStatusDrafts[incident.id] ?? incident.status;
                            const canSave = draftStatus !== incident.status;
                            const isSaving = savingKey === `incident:${incident.id}`;
                            const isDeleting = deletingKey === `incident:${incident.id}`;

                            return (
                                <div
                                    key={incident.id}
                                    className="bg-surface-container-lowest border-[3px] border-on-surface p-4 flex flex-col gap-4"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                        <div>
                                            <p className="font-label-bold font-bold text-on-surface-variant uppercase mb-1">
                                                Incident #{incident.id}
                                            </p>
                                            <h3 className="font-headline-md font-bold text-[24px]">{incident.title}</h3>
                                            <p className="font-body-md text-on-surface-variant">
                                                {room?.name ??
                                                    (incident.room_id != null
                                                        ? `Salle #${incident.room_id}`
                                                        : 'Sans salle')}
                                                {' • '}
                                                {incident.user_id != null
                                                    ? `Utilisateur #${incident.user_id}`
                                                    : 'Utilisateur inconnu'}
                                            </p>
                                        </div>

                                        <span
                                            className={`${getIncidentStatusClass(
                                                incident.status,
                                            )} font-label-bold font-bold px-3 py-1 border-[3px] border-on-surface uppercase text-xs w-fit`}
                                        >
                                            {getIncidentStatusLabel(incident.status)}
                                        </span>
                                    </div>

                                    <p className="font-body-md">
                                        {incident.description?.trim() || 'Aucune description fournie.'}
                                    </p>

                                    <div className="flex flex-col gap-2 text-sm font-medium text-on-surface-variant">
                                        <p>Signale le {formatDateTime(incident.created_at)}</p>
                                        {incident.resolved_at ? (
                                            <p>Résolu le {formatDateTime(incident.resolved_at)}</p>
                                        ) : null}
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-[220px_auto_auto] gap-3 items-end">
                                        <div className="flex flex-col gap-2">
                                            <label className="font-label-bold font-bold text-on-surface-variant">
                                                Statut
                                            </label>
                                            <select
                                                value={draftStatus}
                                                onChange={(event) =>
                                                    setIncidentStatusDrafts((current) => ({
                                                        ...current,
                                                        [incident.id]: event.target.value as IncidentStatus,
                                                    }))
                                                }
                                                className={selectClassName}
                                                disabled={isSaving || isDeleting || incident.status === 'RESOLVED'}
                                            >
                                                {getIncidentStatusOptions(incident.status).map((status) => (
                                                    <option key={status} value={status}>
                                                        {getIncidentStatusLabel(status)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => void saveIncidentStatus(incident)}
                                            disabled={!canSave || isSaving || isDeleting}
                                        >
                                            {isSaving ? 'Mise à jour...' : 'Mettre à jour'}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            onClick={() => void deleteIncident(incident)}
                                            disabled={isSaving || isDeleting}
                                        >
                                            {isDeleting ? 'Suppression...' : 'Supprimer'}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="bg-surface-container-highest border-[3px] border-on-surface neo-shadow p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-2 border-b-[3px] border-on-surface pb-4">
                    <h2 className="font-headline-lg font-black text-[24px] uppercase">Ajouter des utilisateurs</h2>
                    <p className="font-body-md text-on-surface-variant">
                        Le compte créé via ce formulaire aura le rôle USER.
                    </p>
                </div>

                <form onSubmit={handleCreateUser} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Input
                        value={newUserFirstName}
                        onChange={(event) => setNewUserFirstName(event.target.value)}
                        placeholder="Prénom"
                        autoComplete="given-name"
                        required
                        disabled={savingKey === 'user:new'}
                    />
                    <Input
                        value={newUserLastName}
                        onChange={(event) => setNewUserLastName(event.target.value)}
                        placeholder="Nom"
                        autoComplete="family-name"
                        required
                        disabled={savingKey === 'user:new'}
                    />
                    <Input
                        type="email"
                        value={newUserEmail}
                        onChange={(event) => setNewUserEmail(event.target.value)}
                        placeholder="email@entreprise.com"
                        autoComplete="email"
                        required
                        disabled={savingKey === 'user:new'}
                    />
                    <Input
                        type="password"
                        value={newUserPassword}
                        onChange={(event) => setNewUserPassword(event.target.value)}
                        placeholder="Mot de passe (8 caractères min.)"
                        autoComplete="new-password"
                        minLength={8}
                        required
                        disabled={savingKey === 'user:new'}
                    />

                    <div className="lg:col-span-2 flex flex-wrap gap-3 items-center">
                        <Button type="submit" variant="primary" disabled={savingKey === 'user:new'}>
                            <Icon name="person_add" />
                            {savingKey === 'user:new' ? 'Création...' : 'Créer le compte'}
                        </Button>

                        {lastCreatedUser ? (
                            <span className="font-body-md text-on-surface-variant">
                                Dernier compte créé : {lastCreatedUser.first_name} {lastCreatedUser.last_name} -{' '}
                                {lastCreatedUser.email}
                            </span>
                        ) : null}
                    </div>
                </form>
            </section>
        </div>
    );
}
