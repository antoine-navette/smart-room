import { Link } from "react-router-dom"
import { Icon } from "../ui/Icon"

export interface FavoriteRoomCardProps {
  id: string | number;
  title: string;
  location: string;
  icon: string;
  iconBgClass: string;
}

export function FavoriteRoomCard({ id, title, location, icon, iconBgClass }: FavoriteRoomCardProps) {
  return (
    <div className="bg-surface-container-lowest border-[3px] border-on-surface neo-shadow p-5 flex flex-col group hover:-translate-y-1 transition-transform">
      <div className="flex justify-between items-start mb-4">
        <div className={`${iconBgClass} p-3 border-[3px] border-on-surface`}>
          <Icon name={icon} />
        </div>
        <button className="text-error hover:scale-110 transition-transform">
          <Icon name="favorite" fill />
        </button>
      </div>
      <h3 className="font-headline-md font-bold text-[24px] mb-1">{title}</h3>
      <p className="font-body-md text-on-surface-variant mb-4">{location}</p>
      <Link to={`/room/${id}`} className="block text-center mt-auto bg-primary text-on-primary font-label-bold font-bold py-2 px-4 border-[3px] border-on-surface neo-shadow-sm neo-active-sm w-full">
        Quick Book
      </Link>
    </div>
  )
}
