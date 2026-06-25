import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';

type ProtectedRouteProps = {
    requireAdmin?: boolean;
};

export default function ProtectedRoute({ requireAdmin = false }: ProtectedRouteProps) {
    const { user, status } = useAuth();

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface font-body-md">
                Chargement...
            </div>
        );
    }

    if (status === 'anonymous' || !user) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && user.role !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
