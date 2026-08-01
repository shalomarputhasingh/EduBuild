import RouteGuard from '@/src/components/layout/RouteGuard';
import EditProject from '@/src/views/EditProject';

export const metadata = { title: 'Edit guide — EDUBUILD' };

export default function Page() {
  return (
    <RouteGuard>
      <EditProject />
    </RouteGuard>
  );
}
