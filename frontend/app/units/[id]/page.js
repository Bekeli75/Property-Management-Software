import ResourceDetailPage from '@/components/ResourceDetailPage';

export default function UnitDetailPage() {
  return <ResourceDetailPage resourceType="unit" roles={['administrator', 'owner', 'manager']} />;
}
