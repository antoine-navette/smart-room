import { Link, useNavigate } from "react-router-dom"
import { Icon } from "../ui/Icon"
import { useAuth } from "../../auth/AuthProvider"
import { useState } from "react"

export default function Navbar() {
  const navigate = useNavigate()
  const { user, status, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const isAuthenticated = status === "authenticated" && !!user
  const isAdmin = isAuthenticated && user.role === "ADMIN"

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await logout()
      navigate("/login", { replace: true })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <nav className="bg-surface dark:bg-background full-width top-0 z-50 sticky border-b-[3px] border-on-surface dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center px-margin-mobile md:px-margin-desktop py-gutter max-w-full">
      <div className="flex items-center gap-4">
        <Link to="/">
          <img
            alt="SmartRoom Logo"
            className="h-8 object-contain"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0FdTkItJ87ihimpKDhkcKbOC1wUvPjz1jqt4H_ST0P2daWJMio5C4qVNuTpqaq3mYRayKnDd37n1amEUOMUXUJlcCeiHI7xg5rHsV9KCeMRVv1mBrlQJtLrh09b4mhRmnC1h0ygebqTscnYQVvRA0XTOvwre_M-3CvqY69smzZaeBx5OuOGs08uF76wt_GDAgwfjbo0tvVW7_w4XqqNjIP3OM8fhncDYTTH27mdcfOeHCeb1Z_12mjy2aAab8DccumpGE24y_IGqb"
          />
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <Link
          to="/"
          className="text-primary dark:text-primary-fixed-dim border-b-[3px] border-primary dark:border-primary-fixed-dim pb-1 font-label-bold text-[14px] leading-[20px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          Salles
        </Link>

        {isAuthenticated ? (
          <Link
            to="/dashboard"
            className="text-on-surface-variant dark:text-on-surface font-label-bold text-[14px] leading-[20px] hover:text-primary transition-colors hover:bg-secondary-container dark:hover:bg-secondary hover:text-on-secondary-container p-2 rounded-DEFAULT active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            Mes reservations
          </Link>
        ) : null}
      </div>

      <div className="flex items-center gap-4">
        {isAdmin ? (
          <Link
            to="/admin"
            className="hidden md:block neo-border bg-primary text-on-primary font-label-bold text-[14px] leading-[20px] px-4 py-2 neo-shadow neo-shadow-hover neo-shadow-active transition-all"
          >
            Admin
          </Link>
        ) : null}

        {isAuthenticated ? (
          <>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="hidden md:block neo-border bg-secondary-fixed text-on-secondary-fixed font-label-bold text-[14px] leading-[20px] px-4 py-2 neo-shadow neo-shadow-hover neo-shadow-active transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? "Deconnexion..." : "Se deconnecter"}
            </button>

            <Link
              to={isAdmin ? "/admin" : "/dashboard"}
              className="w-10 h-10 rounded-full neo-border overflow-hidden neo-shadow-sm cursor-pointer block"
            >
              <div className="w-full h-full flex items-center justify-center bg-primary text-on-primary font-bold">
                {user.first_name[0]}
                {user.last_name[0]}
              </div>
            </Link>
          </>
        ) : (
          <Link
            to="/login"
            className="neo-border bg-primary text-on-primary font-label-bold text-[14px] leading-[20px] px-4 py-2 neo-shadow neo-shadow-hover neo-shadow-active transition-all"
          >
            Se connecter
          </Link>
        )}

        <button className="md:hidden text-on-surface p-2">
          <Icon name="menu" />
        </button>
      </div>
    </nav>
  )
}