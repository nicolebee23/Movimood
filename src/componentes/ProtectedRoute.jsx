import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children }) {
  const { currentUser, isInitializing } = useAuth();
  const location = useLocation();

  // While auth is initializing (checking session / hydrating from backend),
  // avoid redirecting to login to prevent flicker. Show nothing (preserve route).
  if (isInitializing) {
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default ProtectedRoute;
