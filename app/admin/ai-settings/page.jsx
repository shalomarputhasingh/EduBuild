import RouteGuard from '@/src/components/layout/RouteGuard';
import AiSettings from '@/src/views/AiSettings';

export const metadata = { title: 'AI settings — EDUBUILD' };

export default function Page() {
  return (
    <RouteGuard admin>
      <AiSettings />
    </RouteGuard>
  );
}
