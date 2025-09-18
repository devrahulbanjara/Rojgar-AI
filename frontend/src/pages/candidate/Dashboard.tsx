import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { USER_TYPES } from '../../config/constants';

export default function CandidateDashboard() {
  return (
    <DashboardLayout userType={USER_TYPES.CANDIDATE as 'candidate'} />
  );
}
