import { Navigate, useSearchParams } from 'react-router-dom';
import NewInspectionPage from './NewInspectionPage';

export default function InspectionEntryPage() {
  const [searchParams] = useSearchParams();
  if (searchParams.get('workflow') === 'accreditation') {
    return <Navigate to="/inspections/accreditation/new" replace />;
  }
  return <NewInspectionPage />;
}
