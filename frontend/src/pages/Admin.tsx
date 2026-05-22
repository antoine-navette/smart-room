import { Icon } from "../components/ui/Icon"
import { AdminStatCard } from "../components/admin/AdminStatCard"
import { AdminRoomRow } from "../components/admin/AdminRoomRow"
import { AdminAlertRow } from "../components/admin/AdminAlertRow"

export default function Admin() {
  return (
    <div className="flex-grow px-margin-mobile md:px-margin-desktop py-gutter flex flex-col gap-gutter max-w-7xl mx-auto w-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
        <div>
          <h1 className="font-headline-xl text-[48px] leading-[56px] font-black text-on-surface uppercase border-b-[6px] border-primary inline-block pb-2">Command Center</h1>
          <p className="font-body-lg text-[18px] leading-[28px] mt-2 font-medium text-on-surface-variant max-w-2xl">Overview of spatial asset utilization and infrastructural health.</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-secondary-fixed text-on-secondary-fixed border-[3px] border-on-surface neo-shadow font-label-bold font-bold px-6 py-3 flex items-center gap-2 neo-shadow-hover neo-shadow-active transition-all">
            <Icon name="category" />
            Manage Resources
          </button>
          <button className="bg-primary text-on-primary border-[3px] border-on-surface neo-shadow font-label-bold font-bold px-6 py-3 flex items-center gap-2 neo-shadow-hover neo-shadow-active transition-all">
            <Icon name="add_box" />
            Create Room
          </button>
        </div>
      </div>

      {/* Bento Grid Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <AdminStatCard 
          title="Occupancy"
          value="75"
          unit="%"
          subtitle="Current Global Rate"
          icon="pie_chart"
          bgClass="bg-tertiary-fixed"
        />
        <AdminStatCard 
          title="Bookings"
          value="142"
          subtitle="Total Today"
          icon="calendar_today"
          bgClass="bg-primary-fixed"
        />
        <AdminStatCard 
          title="Alerts"
          value="3"
          subtitle="Active Issues Requires Attention"
          icon="warning"
          bgClass="bg-error-container"
          valueColorClass="text-on-error-container"
        />
      </section>

      {/* Main Workspace Area */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mt-8">
        {/* Left Column: Room Management */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b-[3px] border-on-surface pb-2">
            <h2 className="font-headline-lg font-black text-[32px] text-on-surface uppercase">Room Assets</h2>
            <span className="font-label-bold font-bold bg-surface-container-high border-[3px] border-on-surface px-3 py-1">42 Total</span>
          </div>
          
          <div className="flex flex-col gap-4">
            <AdminRoomRow 
              title="Salle Alpha"
              capacity={12}
              equipment="Projector, Whiteboard"
              status="available"
            />
            <AdminRoomRow 
              title="Salle Beta"
              capacity={4}
              equipment="Video Conference"
              status="unavailable"
            />
          </div>
        </div>

        {/* Right Column: Alerts & Reports */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b-[3px] border-on-surface pb-2">
            <h2 className="font-headline-lg font-black text-[32px] text-on-surface uppercase">Reports</h2>
          </div>
          <div className="bg-surface-container-highest border-[3px] border-on-surface neo-shadow p-gutter flex flex-col gap-4">
            <AdminAlertRow 
              title="Projector Fault"
              status="Pending"
              location="Salle Gamma"
              details="Reported 2h ago"
              actionLabel="Assign Technician"
              isUrgent
            />
            <AdminAlertRow 
              title="AC Unit Leak"
              status="In Progress"
              location="Salle Delta"
              details="Team dispatched"
              actionLabel="Update Status"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
