import { Navigate, Outlet } from 'react-router';
import { useAppState } from '@/AppState';

export function RequireAuth() {
    const { isLoggedIn } = useAppState();

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
