/**
 * Application Routes Configuration
 * Centralized routing configuration for better maintainability
 */

import type { RouteObject } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import RoleSelection from '../pages/RoleSelection';
import RecruiterDashboard from '../pages/recruiter/Dashboard';
import CandidateDashboard from '../pages/candidate/Dashboard';
import { ROUTES } from '../config/constants';

// Define route configuration
export const routes: RouteObject[] = [
  {
    path: ROUTES.HOME,
    element: <LandingPage />,
  },
  {
    path: ROUTES.LOGIN,
    element: <Login />,
  },
  {
    path: ROUTES.SIGNUP,
    element: <Signup />,
  },
  {
    path: ROUTES.SELECT_ROLE,
    element: <RoleSelection />,
  },
  {
    path: ROUTES.RECRUITER.DASHBOARD,
    element: <RecruiterDashboard />,
    // TODO: Add authentication guard when implementing auth
    // loader: requireAuth(['recruiter']),
  },
  {
    path: ROUTES.CANDIDATE.DASHBOARD,
    element: <CandidateDashboard />,
    // TODO: Add authentication guard when implementing auth
    // loader: requireAuth(['candidate']),
  },
  // TODO: Add more routes as needed
  // {
  //   path: ROUTES.RECRUITER.JOBS,
  //   element: <JobsPage />,
  //   loader: requireAuth(['recruiter']),
  // },
  // {
  //   path: ROUTES.CANDIDATE.APPLICATIONS,
  //   element: <ApplicationsPage />,
  //   loader: requireAuth(['candidate']),
  // },
  // {
  //   path: '*',
  //   element: <NotFoundPage />,
  // },
];

// TODO: Implement authentication guard
// export const requireAuth = (allowedUserTypes?: UserType[]) => {
//   return async () => {
//     const user = await authService.getCurrentUser();
//     
//     if (!user) {
//       throw redirect(ROUTES.LOGIN);
//     }
//     
//     if (allowedUserTypes && !allowedUserTypes.includes(user.userType)) {
//       throw redirect(ROUTES.HOME);
//     }
//     
//     return user;
//   };
// };
