import { type FormEvent } from "react"
import { Icon } from "../ui/Icon"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"

export type HeroSearchFilters = {
  query: string
  buildingId: string
  floorId: string
  capacity: string
  start: string
  end: string
}

type HeroSearchProps = {
  buildings: Array<{ id: number; name: string }>
  floors: Array<{ id: number; name: string; building_id: number }>
  filters: HeroSearchFilters
  onFilterChange: (name: keyof HeroSearchFilters, value: string) => void
  onSearch: () => void
  onReset: () => void
  isLoading?: boolean
}

export function HeroSearch({
  buildings,
  floors,
  filters,
  onFilterChange,
  onSearch,
  onReset,
  isLoading = false,
}: HeroSearchProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSearch()
  }

  const visibleFloors =
    filters.buildingId === "all"
      ? floors
      : floors.filter((floor) => floor.building_id === Number(filters.buildingId))

  return (
    <section className="px-margin-mobile md:px-margin-desktop py-12 md:py-20 relative overflow-hidden bg-primary-fixed">
      <div className="absolute -top-10 -right-10 w-64 h-64 bg-secondary-fixed rounded-full neo-border neo-shadow opacity-50 pointer-events-none mix-blend-multiply"></div>
      <div className="absolute bottom-10 -left-10 w-48 h-48 bg-tertiary-fixed rounded-DEFAULT neo-border neo-shadow opacity-50 pointer-events-none rotate-12 mix-blend-multiply"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <h1 className="font-headline-xl text-[32px] md:text-[64px] leading-tight md:leading-[72px] mb-6 max-w-2xl font-black">
          Find the perfect room, <br />
          <span className="text-primary bg-secondary-container px-2 neo-border inline-block rotate-[-2deg]">
            instantly.
          </span>
        </h1>

        <div className="bg-surface-container-lowest neo-border neo-shadow p-gutter rounded-lg max-w-6xl mt-8">
          <form
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 items-end"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="flex flex-col gap-2 xl:col-span-3">
              <label className="font-label-bold text-[14px] leading-[20px] font-bold text-on-surface-variant">
                Search
              </label>
              <div className="relative">
                <Icon
                  name="search"
                  className="absolute left-3 top-3 text-on-surface-variant pointer-events-none z-10"
                />
                <Input
                  type="text"
                  value={filters.query}
                  onChange={(event) => onFilterChange("query", event.target.value)}
                  placeholder="Room, building, floor..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 xl:col-span-2">
              <label className="font-label-bold text-[14px] leading-[20px] font-bold text-on-surface-variant">
                Building
              </label>
              <div className="relative">
                <Icon
                  name="domain"
                  className="absolute left-3 top-3 text-on-surface-variant pointer-events-none"
                />
                <select
                  value={filters.buildingId}
                  onChange={(event) => onFilterChange("buildingId", event.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container neo-border rounded-DEFAULT focus:outline-none focus:border-primary focus:shadow-[4px_4px_0px_0px_#fddc00] transition-all appearance-none cursor-pointer"
                >
                  <option value="all">All Buildings</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={String(building.id)}>
                      {building.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2 xl:col-span-2">
              <label className="font-label-bold text-[14px] leading-[20px] font-bold text-on-surface-variant">
                Floor
              </label>
              <div className="relative">
                <Icon
                  name="layers"
                  className="absolute left-3 top-3 text-on-surface-variant pointer-events-none"
                />
                <select
                  value={filters.floorId}
                  onChange={(event) => onFilterChange("floorId", event.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container neo-border rounded-DEFAULT focus:outline-none focus:border-primary focus:shadow-[4px_4px_0px_0px_#fddc00] transition-all appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={visibleFloors.length === 0}
                >
                  <option value="all">All Floors</option>
                  {visibleFloors.map((floor) => (
                    <option key={floor.id} value={String(floor.id)}>
                      {floor.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2 xl:col-span-2">
              <label className="font-label-bold text-[14px] leading-[20px] font-bold text-on-surface-variant">
                Capacity
              </label>
              <div className="relative">
                <Icon
                  name="group"
                  className="absolute left-3 top-3 text-on-surface-variant pointer-events-none"
                />
                <select
                  value={filters.capacity}
                  onChange={(event) => onFilterChange("capacity", event.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container neo-border rounded-DEFAULT focus:outline-none focus:border-primary focus:shadow-[4px_4px_0px_0px_#fddc00] transition-all appearance-none cursor-pointer"
                >
                  <option value="any">Any Size</option>
                  <option value="small">1-4 pers.</option>
                  <option value="medium">5-10 pers.</option>
                  <option value="large">11+ pers.</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2 xl:col-span-2">
              <label className="font-label-bold text-[14px] leading-[20px] font-bold text-on-surface-variant">
                Start
              </label>
              <div className="relative">
                <Icon
                  name="calendar_today"
                  className="absolute left-3 top-3 text-on-surface-variant pointer-events-none z-10"
                />
                <Input
                  type="datetime-local"
                  value={filters.start}
                  onChange={(event) => onFilterChange("start", event.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 xl:col-span-2">
              <label className="font-label-bold text-[14px] leading-[20px] font-bold text-on-surface-variant">
                End
              </label>
              <div className="relative">
                <Icon
                  name="event_available"
                  className="absolute left-3 top-3 text-on-surface-variant pointer-events-none z-10"
                />
                <Input
                  type="datetime-local"
                  value={filters.end}
                  onChange={(event) => onFilterChange("end", event.target.value)}
                  min={filters.start || undefined}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-3 xl:col-span-12">
              <Button
                type="submit"
                variant="primary"
                className="py-3 px-6 min-h-[52px] text-[20px] leading-[28px] rounded-DEFAULT"
                disabled={isLoading}
              >
                <Icon name="search" />
                Find
              </Button>
              <Button
                type="button"
                variant="outline"
                className="py-3 px-6 min-h-[52px] rounded-DEFAULT"
                onClick={onReset}
                disabled={isLoading}
              >
                <Icon name="restart_alt" />
                Reset Filters
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
