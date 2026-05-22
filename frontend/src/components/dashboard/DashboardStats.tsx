import { Icon } from "../ui/Icon"

export function DashboardStats() {
  return (
    <div className="md:col-span-4 flex flex-col gap-gutter">
      <div className="bg-secondary-container p-6 border-[3px] border-on-surface neo-shadow flex flex-col items-center justify-center text-center">
        <Icon name="calendar_month" className="text-4xl mb-2 text-on-secondary-container" />
        <h3 className="font-headline-lg font-black text-[32px] text-on-secondary-container">12</h3>
        <p className="font-label-bold font-bold text-on-surface-variant uppercase tracking-wide">Rooms Booked This Month</p>
      </div>
      
      {/* Notifications */}
      <div className="bg-surface-container-lowest border-[3px] border-on-surface neo-shadow flex-grow flex flex-col">
        <div className="p-4 border-b-[3px] border-on-surface flex items-center gap-2 bg-surface-container">
          <Icon name="notifications" />
          <h2 className="font-headline-md font-bold text-[24px]">Alerts</h2>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-tertiary-fixed-dim text-on-tertiary-fixed-variant p-2 border-[3px] border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Icon name="check_circle" className="text-sm" />
            </div>
            <div>
              <p className="font-label-bold font-bold">Reservation Confirmed</p>
              <p className="font-body-md text-on-surface-variant text-sm">Boardroom Alpha at 10:00 AM</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-error-container text-on-error-container p-2 border-[3px] border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Icon name="warning" className="text-sm" />
            </div>
            <div>
              <p className="font-label-bold font-bold">Schedule Conflict</p>
              <p className="font-body-md text-on-surface-variant text-sm">Meeting Room C requires your attention.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
