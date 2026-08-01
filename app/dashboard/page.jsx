import RouteGuard from '@/src/components/layout/RouteGuard';
import Dashboard from '@/src/views/Dashboard';

export const metadata = { title: 'My submissions — EDUBUILD' };

export default function Page() {
  return (
    <RouteGuard>
      <Dashboard />
    </RouteGuard>
  );
}
