import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/layout/AppShell';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { OtpPage } from '../pages/auth/OtpPage';
import OnboardingPage from '../pages/auth/OnboardingPage';

// Dashboard Pages
import { HomeDashboard } from '../pages/dashboard/HomeDashboard';
import { RoleSelectPage } from '../pages/dashboard/RoleSelectPage';
import { DashboardAgency } from '../pages/dashboard/DashboardAgency';
import { DashboardCarrier } from '../pages/dashboard/DashboardCarrier';
import { DashboardMga } from '../pages/dashboard/DashboardMga';
import { DashboardReinsurer } from '../pages/dashboard/DashboardReinsurer';
import { DashboardCfo } from '../pages/dashboard/DashboardCfo';
import { DashboardController } from '../pages/dashboard/DashboardController';
import { DashboardAccountant } from '../pages/dashboard/DashboardAccountant';
import { DashboardAuditor } from '../pages/dashboard/DashboardAuditor';
import { DashboardOwner } from '../pages/dashboard/DashboardOwner';
import { DashboardAdmin } from '../pages/dashboard/DashboardAdmin';
import { DashboardGeneralBusiness } from '../pages/dashboard/DashboardGeneralBusiness';

// Core GL
import { ChartOfAccountsPage } from '../pages/gl/ChartOfAccountsPage';
import { JournalEntryPage } from '../pages/gl/JournalEntryPage';
import { ManualEntryPage } from '../pages/gl/ManualEntryPage';
import { FinancialStatementsPage } from '../pages/gl/FinancialStatementsPage';
import { PeriodClosePage } from '../pages/gl/PeriodClosePage';
import { SalesTransactionsPage } from '../pages/business/SalesTransactionsPage';
import { PosOperationsPage } from '../pages/business/PosOperationsPage';

// Operations & Treasury
import { AccountsReceivablePage } from '../pages/operations/AccountsReceivablePage';
import { BillingInvoicingPage } from '../pages/operations/BillingInvoicingPage';
import { AccountsPayablePage } from '../pages/operations/AccountsPayablePage';
import { BankReconciliationPage } from '../pages/operations/BankReconciliationPage';
import { PayrollPage } from '../pages/treasury/PayrollPage';
import { InventoryCostingPage } from '../pages/treasury/InventoryCostingPage';
import { FixedAssetsPage } from '../pages/treasury/FixedAssetsPage';
import ProjectsJobCostingPage from '../pages/treasury/ProjectsJobCostingPage';
import { MultiCurrencyFxPage } from '../pages/treasury/MultiCurrencyFxPage';
import BudgetingForecastingPage from '../pages/treasury/BudgetingForecastingPage';

// Revenue & Tax
import { CommissionEnginePage } from '../pages/revenue/CommissionEnginePage';
import { TaxEnginePage } from '../pages/revenue/TaxEnginePage';
import { PremiumTaxCalculatorPage } from '../pages/revenue/PremiumTaxCalculatorPage';

// Insurance Modules
import { PasPolicyPage } from '../pages/insurance/PasPolicyPage';
import { MgaOperationsPage } from '../pages/insurance/MgaOperationsPage';
import { StatutoryReportsPage } from '../pages/insurance/StatutoryReportsPage';
import { InsuranceFlowSimulatorPage } from '../pages/insurance/InsuranceFlowSimulatorPage';
import { SubledgerProcessingPage } from '../pages/insurance/SubledgerProcessingPage';
import { ReinsuranceAccountingPage } from '../pages/insurance/ReinsuranceAccountingPage';
import { ComplianceFilingsPage } from '../pages/insurance/ComplianceFilingsPage';
import { PremiumClaimsPage } from '../pages/insurance/PremiumClaimsPage';

// Governance
import ReportingAnalyticsPage from '../pages/governance/ReportingAnalyticsPage';
import WorkflowApprovalsPage from '../pages/governance/WorkflowApprovalsPage';
import AuditTrailPage from '../pages/governance/AuditTrailPage';
import DocumentManagementPage from '../pages/governance/DocumentManagementPage';

// Administration
import { AdminConfigPage } from '../pages/admin/AdminConfigPage';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import EntityHierarchyPage from '../pages/admin/EntityHierarchyPage';
import ApiIntegrationHubPage from '../pages/admin/ApiIntegrationHubPage';
import SetupWizardPage from '../pages/admin/SetupWizardPage';
import ExcelOnboardingPage from '../pages/admin/ExcelOnboardingPage';
import ClearAllPage from '../pages/admin/ClearAllPage';

// Portal & Reference
import { DictionaryPage } from '../pages/portal/DictionaryPage';
import ThirdPartyPage from '../pages/portal/ThirdPartyPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public / Auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/otp" element={<OtpPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Authenticated routes inside AppShell */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        {/* Dashboards */}
        <Route path="/" element={<HomeDashboard />} />
        <Route path="/dashboard" element={<HomeDashboard />} />
        <Route path="/workspaces" element={<RoleSelectPage />} />
        <Route path="/role-select" element={<RoleSelectPage />} />
        <Route path="/dashboard-agency" element={<DashboardAgency />} />
        <Route path="/dashboard-carrier" element={<DashboardCarrier />} />
        <Route path="/dashboard-mga" element={<DashboardMga />} />
        <Route path="/dashboard-reinsurer" element={<DashboardReinsurer />} />
        <Route path="/dashboard-cfo" element={<DashboardCfo />} />
        <Route path="/dashboard-controller" element={<DashboardController />} />
        <Route path="/dashboard-accountant" element={<DashboardAccountant />} />
        <Route path="/dashboard-auditor" element={<DashboardAuditor />} />
        <Route path="/dashboard-owner" element={<DashboardOwner />} />
        <Route path="/dashboard-admin" element={<DashboardAdmin />} />
        <Route path="/dashboard-general-business" element={<DashboardGeneralBusiness />} />

        {/* Core GL */}
        <Route path="/chart-of-accounts" element={<ChartOfAccountsPage />} />
        <Route path="/journal-entry" element={<JournalEntryPage />} />
        <Route path="/manual-entry" element={<ManualEntryPage />} />
        <Route path="/financial-statements" element={<FinancialStatementsPage />} />
        <Route path="/period-close" element={<PeriodClosePage />} />
        <Route path="/period-locking" element={<PeriodClosePage />} />
        <Route path="/sales-transactions" element={<SalesTransactionsPage />} />
        <Route path="/pizza-sales" element={<SalesTransactionsPage />} />
        <Route path="/pos-operations" element={<PosOperationsPage />} />
        <Route path="/pos-injector" element={<PosOperationsPage />} />
        <Route path="/pizza-pos" element={<PosOperationsPage />} />

        {/* Operations & Treasury */}
        <Route path="/accounts-receivable" element={<AccountsReceivablePage />} />
        <Route path="/billing-invoicing" element={<BillingInvoicingPage />} />
        <Route path="/billing" element={<BillingInvoicingPage />} />
        <Route path="/accounts-payable" element={<AccountsPayablePage />} />
        <Route path="/bank-reconciliation" element={<BankReconciliationPage />} />
        <Route path="/bank" element={<BankReconciliationPage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/inventory-costing" element={<InventoryCostingPage />} />
        <Route path="/inventory" element={<InventoryCostingPage />} />
        <Route path="/fixed-assets" element={<FixedAssetsPage />} />
        <Route path="/projects-job-costing" element={<ProjectsJobCostingPage />} />
        <Route path="/projects" element={<ProjectsJobCostingPage />} />
        <Route path="/multi-currency-fx" element={<MultiCurrencyFxPage />} />
        <Route path="/fx" element={<MultiCurrencyFxPage />} />
        <Route path="/budgeting-forecasting" element={<BudgetingForecastingPage />} />
        <Route path="/budgeting" element={<BudgetingForecastingPage />} />

        {/* Revenue & Tax */}
        <Route path="/commission-engine" element={<CommissionEnginePage />} />
        <Route path="/commission" element={<CommissionEnginePage />} />
        <Route path="/tax-engine" element={<TaxEnginePage />} />
        <Route path="/tax" element={<TaxEnginePage />} />
        <Route path="/premium-tax-calculator" element={<PremiumTaxCalculatorPage />} />

        {/* Insurance Modules */}
        <Route path="/pas-policy" element={<PasPolicyPage />} />
        <Route path="/mga-operations" element={<MgaOperationsPage />} />
        <Route path="/statutory-reports" element={<StatutoryReportsPage />} />
        <Route path="/insurance-flow-simulator" element={<InsuranceFlowSimulatorPage />} />
        <Route path="/gl-simulation" element={<InsuranceFlowSimulatorPage />} />
        <Route path="/subledger-processing" element={<SubledgerProcessingPage />} />
        <Route path="/subledger" element={<SubledgerProcessingPage />} />
        <Route path="/reinsurance-accounting" element={<ReinsuranceAccountingPage />} />
        <Route path="/reinsurance" element={<ReinsuranceAccountingPage />} />
        <Route path="/compliance-filings" element={<ComplianceFilingsPage />} />
        <Route path="/premium-claims" element={<PremiumClaimsPage />} />

        {/* Governance */}
        <Route path="/reporting-analytics" element={<ReportingAnalyticsPage />} />
        <Route path="/reporting" element={<ReportingAnalyticsPage />} />
        <Route path="/workflow-approvals" element={<WorkflowApprovalsPage />} />
        <Route path="/workflow" element={<WorkflowApprovalsPage />} />
        <Route path="/audit-trail" element={<AuditTrailPage />} />
        <Route path="/document-management" element={<DocumentManagementPage />} />
        <Route path="/documents" element={<DocumentManagementPage />} />

        {/* Administration */}
        <Route path="/admin-config" element={<AdminConfigPage />} />
        <Route path="/admin-config-center" element={<AdminConfigPage />} />
        <Route path="/user-management" element={<UserManagementPage />} />
        <Route path="/user-management.html" element={<UserManagementPage />} />
        <Route path="/identity" element={<UserManagementPage />} />
        <Route path="/entity-hierarchy" element={<EntityHierarchyPage />} />
        <Route path="/api-integration-hub" element={<ApiIntegrationHubPage />} />
        <Route path="/integration" element={<ApiIntegrationHubPage />} />
        <Route path="/setup-wizard" element={<SetupWizardPage />} />
        <Route path="/setup-wizard.html" element={<SetupWizardPage />} />
        <Route path="/excel-onboarding" element={<ExcelOnboardingPage />} />
        <Route path="/clear-all" element={<ClearAllPage />} />

        {/* Reference & Portals */}
        <Route path="/dictionary" element={<DictionaryPage />} />
        <Route path="/third-party" element={<ThirdPartyPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
