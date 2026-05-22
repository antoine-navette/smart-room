import {
  HeroSearch,
  type HeroSearchFilters,
} from "../components/room/HeroSearch"
import { RoomCard } from "../components/room/RoomCard"
import { Icon } from "../components/ui/Icon"
import { Button } from "../components/ui/Button"

const MOCK_ROOMS = [
  {
    id: 1,
    title: "Salle Berlin",
    capacity: 12,
    location: "HQ Paris • Floor 3",
    status: "available" as const,
    statusLabel: "Available Now",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBG9M4Yj0jzyBSvdZAInX6sRjkulw49seRwedrNewKNmTZ9AcbOlTGo_TopuvjKGK6v9yajuovAXwAfagpar0-v0WDEsCSKGAW-EMY_4B86T5S4YvI1pNdsC6TiIQYGdbdOuIhl1puOX8BSF2ZWNFnQBQFgMfFaeEmfTkd4AcJt3Se5l6Ozx7QM4HMFIMCw5nYW6ql-9kB5tMKDUYNTJ_dUxQyLibeW1lFL7vv1I0Ds-pdPp2YwbJYIvPxhwNwIXC5Ad9QWzsKOfvZl",
    amenities: [
      { icon: "wifi", bgClass: "bg-secondary-fixed", rotateClass: "-rotate-3" },
      { icon: "videocam", bgClass: "bg-primary-fixed", rotateClass: "rotate-3" },
      { icon: "ac_unit", bgClass: "bg-surface-container", rotateClass: "-rotate-1" }
    ],
    actionLabel: "View Details",
    actionLink: "/room/1"
  },
  {
    id: 2,
    title: "Focus Pod A",
    capacity: 2,
    location: "Tech Hub Lyon • Floor 1",
    status: "occupied" as const,
    statusLabel: "Occupied (until 14:00)",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC34jJbk5nUSRoMVUCwYNrI5IHzJXbkXGzgeBdAxl5l7F1ply6wZdk05vrQS5qjNk-iGin_5xuRKJOHC6F2cdscnlC-7BqxK_OlgMOjp_wQAhYXMJQ-qFGmMdOUEYfqGEJDo0JbQ8EL9ZRAeHfqWnpiT_By2QkYpgCFO7eyFfrg4B5VFfUh6cAm655kbzBuwhh2QMeUZEMiOT4XialAzlv8CVTg_gDyratCt0Sz8JdjxNJx2EOFrpJZ29tmPXbAKi293cy8jsSgX3wo",
    amenities: [
      { icon: "wifi", bgClass: "bg-secondary-fixed", rotateClass: "rotate-2" }
    ],
    actionLabel: "Notify when free",
    actionClass: "bg-surface-container text-on-surface hover:bg-surface-variant",
    imageOpacity: "opacity-80"
  },
  {
    id: 3,
    title: "Boardroom Alpha",
    capacity: 20,
    location: "HQ Paris • Penthouse",
    status: "available" as const,
    statusLabel: "Available Now",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuACauaR7HNyoBLbVnk54u9YaySfMGG3EHHhwj7npclHW4xCEohevbWL-Jn1mKiyZUkzN3lBUUJ5DvPOP6FYkgj-Aec8nyJPJiNwis0B7qUcMNYoS1XYOhrvHcpOo2fbGvhLUTIeeeZrkdtH26oeiuEY5OJTS-IprbzrT5PUvoIfJXF1ShTirf5798QBcrbpG_sfESyWCgmYvzKNG2wq9EpBv8kTUj0-Ukr-czoqobVQJQpOfh9QrPSVWahokreDB0akvKsnEwsmv6d-",
    amenities: [
      { icon: "wifi", bgClass: "bg-secondary-fixed", rotateClass: "-rotate-2" },
      { icon: "present_to_all", bgClass: "bg-primary-fixed", rotateClass: "rotate-4" },
      { icon: "coffee_maker", bgClass: "bg-tertiary-fixed", rotateClass: "-rotate-1" }
    ],
    actionLabel: "View Details",
    actionLink: "/room/3"
  }
];

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

      {/* Results Section */}
      <section className="px-margin-mobile md:px-margin-desktop py-12 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-headline-lg font-black text-[32px] leading-[40px]">Available Spaces</h2>
          <div className="flex gap-2">
            <button className="p-2 bg-secondary-container neo-border neo-shadow-sm rounded-DEFAULT"><Icon name="grid_view" /></button>
            <button className="p-2 bg-surface neo-border opacity-50 hover:opacity-100 rounded-DEFAULT"><Icon name="list" /></button>
          </div>
        </div>

        {/* Bento Grid / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {MOCK_ROOMS.map(room => (
            <RoomCard key={room.id} {...room} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button variant="outline" className="py-3 px-8 text-[14px] rounded-DEFAULT">
            <Icon name="refresh" /> Load More Rooms
          </Button>
        </div>
      </section>
    </>
  )
}
