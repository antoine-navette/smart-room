import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/Icon';

function getDesktopLinkClass(isActive: boolean) {
  return cn(
    'inline-flex items-center border-b-[3px] pb-1 font-label-bold text-[14px] leading-[20px] transition-colors active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    isActive
      ? 'border-primary text-primary'
      : 'border-transparent text-on-surface-variant hover:text-primary',
  );
}

function getMobileLinkClass(isActive: boolean) {
  return cn(
    'flex items-center justify-between border-[3px] border-on-surface px-4 py-3 font-label-bold font-bold transition-colors',
    isActive
      ? 'bg-primary-fixed text-on-primary-fixed neo-shadow-sm'
      : 'bg-surface-container-lowest text-on-surface',
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, status, logout } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAuthenticated = status === 'authenticated' && !!user;
  const isAdmin = isAuthenticated && user.role === 'ADMIN';

  const pathname = location.pathname;
  const isRoomsActive = pathname === '/' || pathname.startsWith('/room/');
  const isDashboardActive = pathname.startsWith('/dashboard');
  const isAdminActive = pathname.startsWith('/admin');

  const userInitials = isAuthenticated
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`
    : '';

  const accountTarget = isAdmin ? '/admin' : '/dashboard';

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
      setIsMobileMenuOpen(false);
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b-[3px] border-on-surface bg-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="relative mx-auto flex w-full max-w-full items-center justify-between px-margin-mobile py-gutter md:px-margin-desktop">
        <div className="flex items-center gap-4">
          <Link to="/" aria-label="Retour a l'accueil SmartRoom">
            <img
              alt="SmartRoom Logo"
              className="h-8 object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0FdTkItJ87ihimpKDhkcKbOC1wUvPjz1jqt4H_ST0P2daWJMio5C4qVNuTpqaq3mYRayKnDd37n1amEUOMUXUJlcCeiHI7xg5rHsV9KCeMRVv1mBrlQJtLrh09b4mhRmnC1h0ygebqTscnYQVvRA0XTOvwre_M-3CvqY69smzZaeBx5OuOGs08uF76wt_GDAgwfjbo0tvVW7_w4XqqNjIP3OM8fhncDYTTH27mdcfOeHCeb1Z_12mjy2aAab8DccumpGE24y_IGqb"
            />
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className={getDesktopLinkClass(isRoomsActive)}>
            Salles
          </Link>

          {isAuthenticated ? (
            <NavLink
              to="/dashboard"
              className={getDesktopLinkClass(isDashboardActive)}
            >
              Mes reservations
            </NavLink>
          ) : null}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {isAdmin ? (
            <NavLink
              to="/admin"
              className={cn(
                'neo-border px-4 py-2 font-label-bold text-[14px] leading-[20px] transition-all',
                isAdminActive
                  ? 'bg-primary-fixed text-on-primary-fixed neo-shadow-sm'
                  : 'bg-primary text-on-primary neo-shadow neo-shadow-hover neo-shadow-active',
              )}
            >
              Admin
            </NavLink>
          ) : null}

          {isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="neo-border bg-secondary-fixed text-on-secondary-fixed font-label-bold text-[14px] leading-[20px] px-4 py-2 neo-shadow neo-shadow-hover neo-shadow-active transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? 'Deconnexion...' : 'Se deconnecter'}
              </button>

              <Link
                to={accountTarget}
                className="hidden h-10 w-10 overflow-hidden rounded-full neo-border neo-shadow-sm md:block"
                aria-label="Acceder a mon espace"
              >
                <div className="flex h-full w-full items-center justify-center bg-primary text-on-primary font-bold">
                  {userInitials}
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
        </div>

        <button
          type="button"
          className="md:hidden border-[3px] border-on-surface bg-surface p-2 neo-shadow-sm burger-menu"
          aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
        >
          <Icon name={isMobileMenuOpen ? 'close' : 'menu'} />
        </button>

        {isMobileMenuOpen ? (
          <div
            id="mobile-navigation"
            className="absolute left-0 right-0 top-full border-b-[3px] border-on-surface bg-surface px-margin-mobile pb-6 pt-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:hidden"
          >
            <div className="flex flex-col gap-3">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className={getMobileLinkClass(isRoomsActive)}
              >
                <span>Salles</span>
                <Icon name="chevron_right" />
              </Link>

              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  onClick={closeMobileMenu}
                  className={getMobileLinkClass(isDashboardActive)}
                >
                  <span>Mes reservations</span>
                  <Icon name="chevron_right" />
                </Link>
              ) : null}

              {isAdmin ? (
                <Link
                  to="/admin"
                  onClick={closeMobileMenu}
                  className={getMobileLinkClass(isAdminActive)}
                >
                  <span>Admin</span>
                  <Icon name="chevron_right" />
                </Link>
              ) : null}
            </div>

            {isAuthenticated ? (
              <div className="mt-4 border-[3px] border-on-surface bg-surface-container-lowest p-4 neo-shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-on-surface bg-primary font-bold text-on-primary">
                    {userInitials}
                  </div>

                  <div>
                    <p className="font-label-bold font-bold text-on-surface">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="font-body-md text-on-surface-variant">
                      {isAdmin ? 'Administrateur' : 'Utilisateur connecte'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <Link
                    to={accountTarget}
                    onClick={closeMobileMenu}
                    className="neo-border bg-primary text-on-primary font-label-bold font-bold px-4 py-3 text-center neo-shadow-sm neo-active-sm"
                  >
                    Ouvrir mon espace
                  </Link>

                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    disabled={isLoggingOut}
                    className="neo-border bg-secondary-fixed text-on-secondary-fixed font-label-bold font-bold px-4 py-3 neo-shadow-sm neo-active-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoggingOut ? 'Deconnexion...' : 'Se deconnecter'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="block neo-border bg-primary text-on-primary font-label-bold font-bold px-4 py-3 text-center neo-shadow-sm neo-active-sm"
                >
                  Se connecter
                </Link>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </nav>
  );
}