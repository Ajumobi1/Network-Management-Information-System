import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import AcceptInvitationPage from '../pages/auth/AcceptInvitationPage';
import OrganizationSetupPage from '../pages/auth/OrganizationSetupPage';
import InviteProviderPage from '../pages/auth/InviteProviderPage';
import ManageUsersPage from '../pages/auth/ManageUsersPage';
import DashboardPage from '../pages/dashboard/ExecutiveDashboardPage';
import ProviderPage from '../pages/ProviderPage';
import ProviderProfilePage from '../pages/ProviderProfilePage';
import ProviderRegistrationPage from '../pages/ProviderRegistrationPage';
import InspectionsPage from '../pages/InspectionsPage';
import ContractsPage from '../pages/ContractsPage';
import ReportsPage from '../pages/ReportsPage';
import CredentialingPage from '../pages/CredentialingPage';
import CapitationPage from '../pages/CapitationPage';
import PerformancePage from '../pages/PerformancePage';
import FinancialRegisterPage from '../pages/financial/FinancialRegisterPage';
import DataUploadCentrePage from '../pages/financial/DataUploadCentrePage';
import ImportHistoryPage from '../pages/financial/ImportHistoryPage';
import EnrolmentUploadPage from '../pages/enrolment/EnrolmentUploadPage';
import NewEnrolleePage from '../pages/enrolment/NewEnrolleePage';
import EnrolmentRegisterPage from '../pages/enrolment/EnrolmentRegisterPage';
import CommunicationPage from '../pages/CommunicationPage';
import ComplaintsPage from '../pages/ComplaintsPage';
import SettingsPage from '../pages/SettingsPage';
import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/setup" element={<OrganizationSetupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/providers" element={<ProviderPage />} />
        <Route path="/providers/new" element={<ProviderRegistrationPage />} />
        <Route path="/providers/:providerId" element={<ProviderProfilePage />} />
        <Route path="/provider-registration" element={<Navigate to="/providers/new" replace />} />
        <Route path="/credentialing" element={<CredentialingPage />} />
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/capitation" element={<CapitationPage />} />
        <Route path="/financial/dashboard" element={<Navigate to="/dashboard" replace />} />
        <Route path="/analytics/financial-intelligence" element={<Navigate to="/dashboard" replace />} />
        <Route path="/financial/register" element={<FinancialRegisterPage />} />
        <Route path="/financial/claims" element={<Navigate to="/financial/register?type=claims" replace />} />
        <Route path="/financial/claims/analytics" element={<Navigate to="/financial/register?type=claims" replace />} />
        <Route path="/financial/capitation" element={<Navigate to="/financial/register?type=capitation" replace />} />
        <Route path="/financial/ffs" element={<Navigate to="/financial/register?type=ffs" replace />} />
        <Route path="/financial/enrolment" element={<Navigate to="/financial/register" replace />} />
        <Route path="/population/enrolment/register" element={<EnrolmentRegisterPage />} />
        <Route path="/population/enrolment/new" element={<NewEnrolleePage />} />
        <Route path="/financial/upload" element={<DataUploadCentrePage />} />
        <Route path="/financial/history" element={<ImportHistoryPage />} />
        <Route path="/population/enrolment" element={<Navigate to="/dashboard" replace />} />
        <Route path="/population/enrolment/upload" element={<EnrolmentUploadPage />} />
        <Route path="/inspections" element={<InspectionsPage />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/communication" element={<CommunicationPage />} />
        <Route path="/complaints" element={<ComplaintsPage />} />
        <Route path="/admin/users" element={<ManageUsersPage />} />
        <Route path="/admin/invite-provider" element={<InviteProviderPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
