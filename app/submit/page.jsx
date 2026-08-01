import RouteGuard from '@/src/components/layout/RouteGuard';
import SubmitProject from '@/src/views/SubmitProject';

export const metadata = { title: 'Publish a guide — EDUBUILD' };

export default function Page() {
  return (
    <RouteGuard>
      <SubmitProject />
    </RouteGuard>
  );
}
