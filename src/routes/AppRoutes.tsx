import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import ProtectedRoute from './ProtectedRoute';

const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const SuspendedPage = lazy(() => import('../pages/auth/SuspendedPage'));
const AcceptInvitationPage = lazy(() => import('../pages/auth/AcceptInvitationPage'));
const OrganizationSetupPage = lazy(() => import('../pages/auth/OrganizationSetupPage'));
const InviteProviderPage = lazy(() => import('../pages/auth/InviteProviderPage'));
const ManageUsersPage = lazy(() => import('../pages/auth/ManageUsersPage'));
const AuditLogPage = lazy(() => import('../pages/admin/AuditLogPage'));
const SystemConfigPage = lazy(() => import('../pages/admin/SystemConfigPage'));
const DataManagementPage = lazy(() => import('../pages/admin/DataManagementPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/ExecutiveDashboardPage'));
const ProviderPage = lazy(() => import('../pages/ProviderPage'));
const ProviderProfilePage = lazy(() => import('../pages/ProviderProfilePage'));
const ProviderRegistrationPage = lazy(() => import('../pages/ProviderRegistrationPage'));
const InspectionsPage = lazy(() => import('../pages/InspectionsPage'));
const RegisteredInspectionPage = lazy(() => import('../pages/inspections/RegisteredInspectionPage'));
const InspectionTemplateAdminPage = lazy(() => import('../pages/inspections/InspectionTemplateAdminPage'));
const AccreditationPage = lazy(() => import('../pages/accreditations/AccreditationPage'));
const NewAccreditationPage = lazy(() => import('../pages/accreditations/NewAccreditationPage'));
const ODCHCChecklistPage = lazy(() => import('../pages/ODCHCChecklistPage'));
const ContractsPage = lazy(() => import('../pages/ContractsPage'));
const ReportsPage = lazy(() => import('../pages/ReportsPage'));
const CredentialingPage = lazy(() => import('../pages/CredentialingPage'));
const CapitationPage = lazy(() => import('../pages/CapitationPage'));
const PerformancePage = lazy(() => import('../pages/PerformancePage'));
const FinancialRegisterPage = lazy(() => import('../pages/financial/FinancialRegisterPage'));
const FinancialManualEntryPage = lazy(() => import('../pages/financial/FinancialManualEntryPage'));
const DataUploadCentrePage = lazy(() => import('../pages/financial/DataUploadCentrePage'));
const ImportHistoryPage = lazy(() => import('../pages/financial/ImportHistoryPage'));
const EnrolmentUploadPage = lazy(() => import('../pages/enrolment/EnrolmentUploadPage'));
const NewEnrolleePage = lazy(() => import('../pages/enrolment/NewEnrolleePage'));
const EnrolmentRegisterPage = lazy(() => import('../pages/enrolment/EnrolmentRegisterPage'));
const CommunicationPage = lazy(() => import('../pages/CommunicationPage'));
const ComplaintsPage = lazy(() => import('../pages/ComplaintsPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const PublicHomePage = lazy(() => import('../pages/public/PublicHomePage'));
const SecurityPolicyPage = lazy(() => import('../pages/public/SecurityPolicyPage'));

function RouteLoadingFallback() {
  return <main className="flex min-h-[75vh] w-full items-center justify-center bg-brand-background px-6 py-16" role="status" aria-live="polite"><div className="relative flex max-w-sm w-full flex-col items-center gap-5 rounded-2xl border border-brand-divider/85 bg-brand-card p-10 shadow-2xl"><div className="absolute -top-3 rounded-full border border-[#f7931e]/30 bg-[#f7931e]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#f7931e]">Secure Workspace</div><div className="relative mt-2 flex items-center justify-center"><div className="absolute h-16 w-16 animate-pulse rounded-full border-4 border-[#f7931e]/20" /><div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-divider border-t-[#f7931e]" aria-hidden="true" /></div><div className="flex flex-col items-center gap-1.5 text-center"><h3 className="text-base font-black tracking-tight text-brand-foreground">Loading Module</h3><p className="text-xs font-medium text-brand-muted">Synchronizing network data...</p></div></div></main>;
}

export default function AppRoutes() {
  return <Suspense fallback={<RouteLoadingFallback />}><Routes>
    <Route path="/" element={<PublicHomePage />} />
    <Route path="/security-policy" element={<SecurityPolicyPage />} />
    <Route path="/setup" element={<OrganizationSetupPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/suspended" element={<SuspendedPage />} />
    <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
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
      <Route path="/financial/register" element={<FinancialRegisterPage type="claims-ffs" />} />
      <Route path="/financial/claims" element={<Navigate to="/financial/register" replace />} />
      <Route path="/financial/claims/analytics" element={<Navigate to="/financial/register" replace />} />
      <Route path="/financial/capitation" element={<FinancialRegisterPage type="capitation" />} />
      <Route path="/financial/ffs" element={<Navigate to="/financial/register" replace />} />
      <Route path="/financial/enrolment" element={<Navigate to="/financial/register" replace />} />
      <Route path="/population/enrolment/register" element={<EnrolmentRegisterPage />} />
      <Route path="/population/enrolment/new" element={<NewEnrolleePage />} />
      <Route path="/financial/upload" element={<DataUploadCentrePage />} />
      <Route path="/financial/manual" element={<FinancialManualEntryPage />} />
      <Route path="/financial/manual/capitation" element={<Navigate to="/financial/manual?type=capitation" replace />} />
      <Route path="/financial/history" element={<ImportHistoryPage />} />
      <Route path="/population/enrolment" element={<Navigate to="/dashboard" replace />} />
      <Route path="/population/enrolment/upload" element={<EnrolmentUploadPage />} />
      <Route path="/inspections" element={<InspectionsPage />} />
      <Route path="/inspections/new" element={<RegisteredInspectionPage />} />
      <Route path="/quality-compliance/checklists" element={<ODCHCChecklistPage />} />
      <Route path="/accreditations" element={<AccreditationPage />} />
      <Route path="/accreditations/new" element={<NewAccreditationPage />} />
      <Route path="/settings/inspection-templates" element={<InspectionTemplateAdminPage />} />
      <Route path="/performance" element={<PerformancePage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/communication" element={<CommunicationPage />} />
      <Route path="/complaints" element={<ComplaintsPage />} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['super-admin']}><ManageUsersPage /></ProtectedRoute>} />
      <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={['super-admin']}><AuditLogPage /></ProtectedRoute>} />
      <Route path="/admin/config" element={<ProtectedRoute allowedRoles={['super-admin']}><SystemConfigPage /></ProtectedRoute>} />
      <Route path="/admin/data" element={<ProtectedRoute allowedRoles={['super-admin']}><DataManagementPage /></ProtectedRoute>} />
      <Route path="/admin/invite-provider" element={<ProtectedRoute allowedRoles={['super-admin']}><InviteProviderPage /></ProtectedRoute>} />
      <Route path="/settings" element={<SettingsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense>;
}
