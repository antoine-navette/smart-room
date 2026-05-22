import { useParams, Link } from "react-router-dom"
import { Icon } from "../components/ui/Icon"
import { Button } from "../components/ui/Button"
import { Badge } from "../components/ui/Badge"

export default function RoomDetails() {
  const { id } = useParams();

  // Mock data for the specific room
  const room = {
    id,
    name: "Salle 302",
    building: "Bâtiment A",
    floor: "Etage 3",
    capacity: 12,
    area: "35 m²",
    status: "libre",
    equipment: ["tv", "videocam", "edit_note"]
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-12">
      <Link to="/" className="inline-flex items-center gap-2 font-label-bold font-bold hover:text-primary transition-colors">
        <Icon name="arrow_back" /> Retour à la recherche
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left Column: Header, Gallery, Details */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Title Section */}
          <div className="bg-surface border-[3px] border-on-surface p-6 neo-shadow">
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
              <div>
                <h1 className="font-headline-xl text-[48px] leading-[56px] font-black text-on-surface uppercase mb-2">
                  {room.name}
                </h1>
                <p className="font-body-lg text-[18px] leading-[28px] font-medium text-on-surface-variant">
                  {room.building}, {room.floor}
                </p>
              </div>
              <div className="flex gap-4">
                <Badge variant="success" className="py-2 px-4 shadow-[4px_4px_0px_0px_#000]">
                  <span className="w-3 h-3 bg-tertiary rounded-full border-2 border-on-surface"></span>
                  Available
                </Badge>
                <button className="w-12 h-12 flex items-center justify-center bg-surface border-[3px] border-on-surface neo-shadow-sm neo-active-sm hover:bg-secondary-container transition-colors" title="Add to Favorites">
                  <Icon name="favorite" />
                </button>
              </div>
            </div>
          </div>

          {/* Image Gallery Placeholder */}
          <div className="bg-surface border-[3px] border-on-surface p-4 neo-shadow h-[400px] flex flex-col">
            <div className="flex-grow border-[3px] border-on-surface bg-surface-container relative overflow-hidden group">
              <img alt="Meeting Room" className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBj_Du02t8DnsMWBYEBKf9pCPKNAbd0iYg8_sUOwl0lpV24139q56j9DtewlMSeCZmaZha_00vwrWf6TNPwK99E3yK5w8gMuQTE-DCv7DKu9hCS8bUpyOAfKkTcypQi-dN4mzokvxf_B1FAMUNz3SMSxJLPITAqXaOLeqC9_-4MMfinKsQTXCYYlKZCIoTvOitVo8lDRcWbP9Fi7NTkGnc-_2tmICURnkQT9-8zcKTTfvMsJE5a3kKU7Gz_WOMQ4ZAQ4RNYmq3ndUiH"/>
              <div className="absolute bottom-4 right-4 bg-primary text-on-primary font-label-bold font-bold px-4 py-2 border-[3px] border-on-surface neo-shadow-sm cursor-pointer hover:bg-primary-container">
                View Gallery
              </div>
            </div>
          </div>

          {/* Key Features Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Capacity */}
            <div className="bg-surface border-[3px] border-on-surface p-6 neo-shadow flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full border-[3px] border-on-surface bg-secondary-fixed flex items-center justify-center mb-4 neo-shadow-sm">
                <Icon name="groups" className="text-3xl" />
              </div>
              <h3 className="font-label-bold font-bold text-on-surface-variant uppercase mb-1">Capacity</h3>
              <p className="font-headline-md font-bold text-[24px] text-on-surface">{room.capacity} People</p>
            </div>
            
            {/* Area */}
            <div className="bg-surface border-[3px] border-on-surface p-6 neo-shadow flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full border-[3px] border-on-surface bg-primary-fixed flex items-center justify-center mb-4 neo-shadow-sm">
                <Icon name="aspect_ratio" className="text-3xl" />
              </div>
              <h3 className="font-label-bold font-bold text-on-surface-variant uppercase mb-1">Area</h3>
              <p className="font-headline-md font-bold text-[24px] text-on-surface">{room.area}</p>
            </div>
            
            {/* Equipment */}
            <div className="bg-surface border-[3px] border-on-surface p-6 neo-shadow flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full border-[3px] border-on-surface bg-error-container flex items-center justify-center mb-4 neo-shadow-sm">
                <Icon name="tv" className="text-3xl" />
              </div>
              <h3 className="font-label-bold font-bold text-on-surface-variant uppercase mb-1">Equipment</h3>
              <div className="flex gap-2 mt-2">
                {room.equipment.map(eq => (
                  <Icon key={eq} name={eq} />
                ))}
              </div>
            </div>
          </div>
          
        </div>

        {/* Right Column: Timeline & Actions */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {/* Reservation Action Card */}
          <div className="bg-surface border-[3px] border-on-surface p-6 neo-shadow sticky top-[120px]">
            <h2 className="font-headline-lg font-black text-[32px] text-on-surface mb-6 border-b-[3px] border-on-surface pb-4">
              Schedule
            </h2>
            
            {/* Timeline/Availability */}
            <div className="flex flex-col gap-3 mb-8">
              <div className="flex items-center gap-4">
                <span className="font-label-bold font-bold w-16 text-right">09:00</span>
                <div className="flex-grow h-12 bg-secondary-fixed border-[3px] border-on-surface neo-shadow-sm flex items-center px-3 font-label-bold font-bold relative overflow-hidden group cursor-pointer hover:bg-secondary-container">
                  <span className="relative z-10">Reserved - Marketing</span>
                  <div className="absolute inset-0 bg-on-surface opacity-0 group-hover:opacity-10 transition-opacity"></div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-label-bold font-bold w-16 text-right">10:00</span>
                <div className="flex-grow h-12 bg-tertiary-fixed border-[3px] border-on-surface neo-shadow-sm flex items-center px-3 font-label-bold font-bold cursor-pointer hover:bg-tertiary-fixed-dim neo-active-sm transition-transform">
                    Available - Click to book
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-label-bold font-bold w-16 text-right">11:00</span>
                <div className="flex-grow h-12 bg-tertiary-fixed border-[3px] border-on-surface neo-shadow-sm flex items-center px-3 font-label-bold font-bold cursor-pointer hover:bg-tertiary-fixed-dim neo-active-sm transition-transform">
                    Available - Click to book
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-label-bold font-bold w-16 text-right">12:00</span>
                <div className="flex-grow h-12 bg-secondary-fixed border-[3px] border-on-surface neo-shadow-sm flex items-center px-3 font-label-bold font-bold">
                    Reserved - Design Sync
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-label-bold font-bold w-16 text-right">13:00</span>
                <div className="flex-grow h-12 bg-surface-container border-[3px] border-on-surface neo-shadow-sm flex items-center justify-center font-label-bold font-bold text-on-surface-variant cursor-not-allowed">
                    Maintenance
                </div>
              </div>
            </div>
            
            {/* Primary Action */}
            <Button variant="primary" className="w-full text-[24px] py-4 mb-4">
                Reserve Now
            </Button>
            
            {/* Secondary Action */}
            <Button variant="danger" className="w-full text-[14px] py-3">
                <Icon name="report" />
                Signaler un problème
            </Button>
            
          </div>
        </div>
      </div>
    </div>
  )
}
