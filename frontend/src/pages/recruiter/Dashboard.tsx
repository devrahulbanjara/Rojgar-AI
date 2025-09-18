import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { USER_TYPES } from '../../config/constants';

export default function RecruiterDashboard() {
  return (
    <DashboardLayout userType={USER_TYPES.RECRUITER as 'recruiter'} />
  );
}
