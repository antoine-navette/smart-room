import { Outlet } from "react-router-dom"
import Navbar from "./Navbar"
import Footer from "./Footer"

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface font-body-md selection:bg-secondary-container selection:text-on-secondary-container">
      <Navbar />
      <main className="flex-1 w-full min-h-screen">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
