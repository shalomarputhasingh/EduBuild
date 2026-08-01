import RouteGuard from '@/src/components/layout/RouteGuard';
import MaterialScanner from '@/src/views/MaterialScanner';

export const metadata = { title: 'Material scanner — EDUBUILD' };

export default function Page() {
  return (
    <RouteGuard>
      <MaterialScanner />
    </RouteGuard>
  );
}
