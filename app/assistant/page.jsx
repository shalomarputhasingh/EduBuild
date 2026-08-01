import RouteGuard from '@/src/components/layout/RouteGuard';
import Assistant from '@/src/views/Assistant';

export const metadata = { title: 'AI assistant — EDUBUILD' };

export default function Page() {
  return (
    <RouteGuard>
      <Assistant />
    </RouteGuard>
  );
}
