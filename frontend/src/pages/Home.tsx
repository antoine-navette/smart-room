import { useEffect, useState } from "react"
import {
  HeroSearch,
  type HeroSearchFilters,
} from "../components/room/HeroSearch"
import { RoomCard, type RoomCardProps } from "../components/room/RoomCard"
import { Icon } from "../components/ui/Icon"
import { Button } from "../components/ui/Button"
import { api } from "../api/client"
import type { components } from "../api/schema.d.ts"

type Room = components["schemas"]["Room"]
type Floor = components["schemas"]["Floor"]
type Building = components["schemas"]["Building"]

const DEFAULT_ROOM_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBG9M4Yj0jzyBSvdZAInX6sRjkulw49seRwedrNewKNmTZ9AcbOlTGo_TopuvjKGK6v9yajuovAXwAfagpar0-v0WDEsCSKGAW-EMY_4B86T5S4YvI1pNdsC6TiIQYGdbdOuIhl1puOX8BSF2ZWNFnQBQFgMfFaeEmfTkd4AcJt3Se5l6Ozx7QM4HMFIMCw5nYW6ql-9kB5tMKDUYNTJ_dUxQyLibeW1lFL7vv1I0Ds-pdPp2YwbJYIvPxhwNwIXC5Ad9QWzsKOfvZl"

const DEFAULT_AMENITIES: RoomCardProps["amenities"] = [
  { icon: "wifi", bgClass: "bg-secondary-fixed", rotateClass: "-rotate-3" },
  { icon: "videocam", bgClass: "bg-primary-fixed", rotateClass: "rotate-3" },
  { icon: "devices", bgClass: "bg-surface-container", rotateClass: "-rotate-1" },
]

const INITIAL_FILTERS: HeroSearchFilters = {
  query: "",
  buildingId: "all",
  floorId: "all",
  capacity: "any",
  start: "",
  end: "",
}

function buildLocation(
  room: Room,
  floorById: Map<number, Floor>,
  buildingById: Map<number, Building>
) {
  const floor = floorById.get(room.floor_id)

  if (!floor) {
    return "Etage inconnu"
  }

  const building = buildingById.get(floor.building_id)

  if (!building) {
    return floor.name
  }

  return `${building.name} - ${floor.name}`
}

function toRoomCard(
  room: Room,
  floorById: Map<number, Floor>,
  buildingById: Map<number, Building>,
  hasAvailabilityFilter: boolean
): RoomCardProps {
  return {
    id: room.id,
    title: room.name,
    capacity: room.capacity,
    location: buildLocation(room, floorById, buildingById),
    status: "available",
    statusLabel: hasAvailabilityFilter ? "Available on selected slot" : "Available Now",
    imageUrl: DEFAULT_ROOM_IMAGE,
    amenities: DEFAULT_AMENITIES,
    actionLabel: "View Details",
    actionLink: `/room/${room.id}`,
  }
}

function matchesCapacity(room: Room, capacityFilter: HeroSearchFilters["capacity"]) {
  switch (capacityFilter) {
    case "small":
      return room.capacity >= 1 && room.capacity <= 4
    case "medium":
      return room.capacity >= 5 && room.capacity <= 10
    case "large":
      return room.capacity >= 11
    default:
      return true
  }
}

function matchesQuery(
  room: Room,
  floorById: Map<number, Floor>,
  buildingById: Map<number, Building>,
  query: string
) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  const floor = floorById.get(room.floor_id)
  const building = floor ? buildingById.get(floor.building_id) : undefined
  const haystack = [
    room.name,
    floor?.name ?? "",
    building?.name ?? "",
  ]
    .join(" ")
    .toLowerCase()

  return haystack.includes(normalizedQuery)
}

function toIsoDateTime(value: string) {
  return new Date(value).toISOString()
}

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [floors, setFloors] = useState<Floor[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [draftFilters, setDraftFilters] = useState(INITIAL_FILTERS)
  const [selectedFilters, setSelectedFilters] = useState(INITIAL_FILTERS)

  const loadRooms = async (filters: HeroSearchFilters) => {
    setIsLoading(true)
    setErrorMessage("")

    const shouldFilterByAvailability = Boolean(filters.start && filters.end)

    const roomsRequest = shouldFilterByAvailability
      ? api.GET("/rooms/available", {
          params: {
            query: {
              start: toIsoDateTime(filters.start),
              end: toIsoDateTime(filters.end),
            },
          },
        })
      : api.GET("/rooms")

    const [roomsResponse, floorsResponse, buildingsResponse] = await Promise.all([
      roomsRequest,
      api.GET("/floors"),
      api.GET("/buildings"),
    ])

    if (
      roomsResponse.error ||
      !roomsResponse.data ||
      floorsResponse.error ||
      !floorsResponse.data ||
      buildingsResponse.error ||
      !buildingsResponse.data
    ) {
      setRooms([])
      setFloors([])
      setBuildings([])
      setErrorMessage("Impossible de charger les salles pour le moment.")
      setIsLoading(false)
      return
    }

    setRooms(roomsResponse.data)
    setFloors(floorsResponse.data)
    setBuildings(buildingsResponse.data)
    setIsLoading(false)
  }

  useEffect(() => {
    void loadRooms(INITIAL_FILTERS)
  }, [])

  const floorById = new Map(floors.map((floor) => [floor.id, floor]))
  const buildingById = new Map(buildings.map((building) => [building.id, building]))
  const selectedBuildingNumber =
    selectedFilters.buildingId === "all" ? null : Number(selectedFilters.buildingId)
  const selectedFloorNumber =
    selectedFilters.floorId === "all" ? null : Number(selectedFilters.floorId)
  const hasAvailabilityFilter = Boolean(selectedFilters.start && selectedFilters.end)

  const visibleRoomCards = rooms
    .filter((room) => {
      if (selectedBuildingNumber !== null) {
        const floor = floorById.get(room.floor_id)

        if (!floor || floor.building_id !== selectedBuildingNumber) {
          return false
        }
      }

      if (selectedFloorNumber !== null && room.floor_id !== selectedFloorNumber) {
        return false
      }

      if (!matchesCapacity(room, selectedFilters.capacity)) {
        return false
      }

      return matchesQuery(room, floorById, buildingById, selectedFilters.query)
    })
    .map((room) =>
      toRoomCard(room, floorById, buildingById, hasAvailabilityFilter)
    )

  const handleFilterChange = (
    name: keyof HeroSearchFilters,
    value: string
  ) => {
    setDraftFilters((current) => {
      if (name === "buildingId") {
        return {
          ...current,
          buildingId: value,
          floorId: "all",
        }
      }

      return {
        ...current,
        [name]: value,
      }
    })
  }

  const handleSearch = async () => {
    const nextFilters = { ...draftFilters }

    if ((nextFilters.start && !nextFilters.end) || (!nextFilters.start && nextFilters.end)) {
      setErrorMessage("Renseigne une date de debut et une date de fin pour filtrer la disponibilite.")
      return
    }

    if (
      nextFilters.start &&
      nextFilters.end &&
      new Date(nextFilters.start) >= new Date(nextFilters.end)
    ) {
      setErrorMessage("Le debut du creneau doit etre avant la fin.")
      return
    }

    setSelectedFilters(nextFilters)
    await loadRooms(nextFilters)
  }

  const handleResetFilters = async () => {
    setDraftFilters(INITIAL_FILTERS)
    setSelectedFilters(INITIAL_FILTERS)
    await loadRooms(INITIAL_FILTERS)
  }

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="font-headline-lg font-black text-[32px] leading-[40px]">
              All Spaces
            </h2>
            <p className="font-body-md text-on-surface-variant mt-2">
              {visibleRoomCards.length} room{visibleRoomCards.length > 1 ? "s" : ""} found
              {hasAvailabilityFilter ? " on this timeslot" : ""}
            </p>
          </div>

          <div className="flex gap-2">
            <button className="p-2 bg-secondary-container neo-border neo-shadow-sm rounded-DEFAULT">
              <Icon name="grid_view" />
            </button>
            <button className="p-2 bg-surface neo-border opacity-50 hover:opacity-100 rounded-DEFAULT">
              <Icon name="list" />
            </button>
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-8 bg-error-container text-on-error-container neo-border p-4 font-bold">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="mb-8 bg-surface-container neo-border p-6 text-center font-bold">
            Chargement des salles...
          </div>
        ) : null}

        {!isLoading && !errorMessage && visibleRoomCards.length === 0 ? (
          <div className="mb-8 bg-surface-container neo-border p-6 text-center font-bold">
            {rooms.length === 0
              ? "Aucune salle disponible pour le moment."
              : "Aucune salle ne correspond aux filtres."}
          </div>
        ) : null}

        {!isLoading && !errorMessage && visibleRoomCards.length > 0 ? (
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
            Rafraichir
          </Button>
        </div>
      </section>
    </>
  )
}
