import { ProtectedRoute } from '@/components/frontend-auth/ProtectedRoute';
import { UserDashboard } from '@/components/dashboard/UserDashboard';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <UserDashboard />
    </ProtectedRoute>
  );
}
