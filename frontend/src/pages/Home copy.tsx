import { HeroSearch, type HeroSearchFilters } from "../components/room/HeroSearch"
import { RoomCard } from "../components/room/RoomCard"
import { Button } from "../components/ui/Button"
import { Icon } from "../components/ui/Icon"

const MOCK_ROOMS = [
  {
    id: 1,
    title: "Salle Berlin",
    capacity: 12,
    location: "HQ Paris - Etage 3",
    status: "available" as const,
    statusLabel: "Disponible",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBG9M4Yj0jzyBSvdZAInX6sRjkulw49seRwedrNewKNmTZ9AcbOlTGo_TopuvjKGK6v9yajuovAXwAfagpar0-v0WDEsCSKGAW-EMY_4B86T5S4YvI1pNdsC6TiIQYGdbdOuIhl1puOX8BSF2ZWNFnQBQFgMfFaeEmfTkd4AcJt3Se5l6Ozx7QM4HMFIMCw5nYW6ql-9kB5tMKDUYNTJ_dUxQyLibeW1lFL7vv1I0Ds-pdPp2YwbJYIvPxhwNwIXC5Ad9QWzsKOfvZl",
    equipmentNames: ["Wifi", "Visioconference", "Climatisation"],
    additionalEquipmentCount: 0,
    actionLabel: "Voir les details",
    actionLink: "/room/1",
  },
  {
    id: 2,
    title: "Focus Pod A",
    capacity: 2,
    location: "Tech Hub Lyon - Etage 1",
    status: "occupied" as const,
    statusLabel: "Occupee jusqu'a 14:00",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC34jJbk5nUSRoMVUCwYNrI5IHzJXbkXGzgeBdAxl5l7F1ply6wZdk05vrQS5qjNk-iGin_5xuRKJOHC6F2cdscnlC-7BqxK_OlgMOjp_wQAhYXMJQ-qFGmMdOUEYfqGEJDo0JbQ8EL9ZRAeHfqWnpiT_By2QkYpgCFO7eyFfrg4B5VFfUh6cAm655kbzBuwhh2QMeUZEMiOT4XialAzlv8CVTg_gDyratCt0Sz8JdjxNJx2EOFrpJZ29tmPXbAKi293cy8jsSgX3wo",
    equipmentNames: ["Wifi"],
    additionalEquipmentCount: 0,
    actionLabel: "Voir les details",
    actionLink: "/room/2",
    imageOpacity: "opacity-80",
  },
  {
    id: 3,
    title: "Boardroom Alpha",
    capacity: 20,
    location: "HQ Paris - Penthouse",
    status: "available" as const,
    statusLabel: "Disponible",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuACauaR7HNyoBLbVnk54u9YaySfMGG3EHHhwj7npclHW4xCEohevbWL-Jn1mKiyZUkzN3lBUUJ5DvPOP6FYkgj-Aec8nyJPJiNwis0B7qUcMNYoS1XYOhrvHcpOo2fbGvhLUTIeeeZrkdtH26oeiuEY5OJTS-IprbzrT5PUvoIfJXF1ShTirf5798QBcrbpG_sfESyWCgmYvzKNG2wq9EpBv8kTUj0-Ukr-czoqobVQJQpOfh9QrPSVWahokreDB0akvKsnEwsmv6d-",
    equipmentNames: ["Wifi", "Projecteur", "Machine a cafe"],
    additionalEquipmentCount: 2,
    actionLabel: "Voir les details",
    actionLink: "/room/3",
  },
]

const DEMO_FILTERS: HeroSearchFilters = {
  query: "",
  buildingId: "all",
  floorId: "all",
  capacity: "any",
  start: "",
  end: "",
}

export default function Home() {
  return (
    <>
      <HeroSearch
        buildings={[]}
        floors={[]}
        filters={DEMO_FILTERS}
        onFilterChange={() => undefined}
        onSearch={() => undefined}
        onReset={() => undefined}
      />

      <section className="px-margin-mobile md:px-margin-desktop py-12 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="font-headline-lg font-black text-[32px] leading-[40px]">
            Salles de demonstration
          </h2>
          <p className="font-body-md text-on-surface-variant mt-2">
            {MOCK_ROOMS.length} salles exemples
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {MOCK_ROOMS.map((room) => (
            <RoomCard key={room.id} {...room} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button variant="outline" className="py-3 px-8 text-[14px] rounded-DEFAULT">
            <Icon name="refresh" />
            Rafraichir la demo
          </Button>
        </div>
      </section>
    </>
  )
}