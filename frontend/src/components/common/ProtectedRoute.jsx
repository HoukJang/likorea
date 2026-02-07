import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loading from './Loading';

const ProtectedRoute = ({ children, requiredAuth = true, requiredAuthority }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (requiredAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredAuthority && (!user || user.authority < requiredAuthority)) {
    return <Navigate to="/dashboard/profile" replace />;
  }

  return children;
};

export default ProtectedRoute;
