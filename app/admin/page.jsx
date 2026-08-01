import RouteGuard from '@/src/components/layout/RouteGuard';
import AdminDashboard from '@/src/views/AdminDashboard';

export const metadata = { title: 'Moderation — EDUBUILD' };

export default function Page() {
  return (
    <RouteGuard admin>
      <AdminDashboard />
    </RouteGuard>
  );
}
