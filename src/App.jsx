import './App.css'
import { AuthScreen } from './components/auth/AuthScreen'
import { Calendar } from './components/calendar/Calendar'
import { StatsGrid } from './components/dashboard/StatsGrid'
import { WelcomePanel } from './components/dashboard/WelcomePanel'
import { DataStatus } from './components/feedback/DataStatus'
import { Toast } from './components/feedback/Toast'
import { Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'
import { DeleteRequestModal } from './components/modals/DeleteRequestModal'
import { RequestDetailModal } from './components/modals/RequestDetailModal'
import { RequestFormModal } from './components/modals/RequestFormModal'
import { UpcomingRequests } from './components/requests/UpcomingRequests'
import { AdminUsers } from './components/users/AdminUsers'
import { useActiveSection } from './hooks/useActiveSection'
import { useAuth } from './hooks/useAuth'
import { useReservations } from './hooks/useReservations'
import { useTheme } from './hooks/useTheme'

function AuthenticatedApp({ onSignOut, user }) {
  const canManage = user.role === 'admin'
  const reservations = useReservations({
    canManage,
    defaultResponsible: user.displayName,
  })
  const { activeSection, selectSection } = useActiveSection(canManage)
  const { isDark, theme, toggleTheme } = useTheme()

  return (
    <div className="app">
      <Sidebar
        activeSection={activeSection}
        isDark={isDark}
        onSectionSelect={selectSection}
        onThemeToggle={toggleTheme}
        pendingCount={reservations.pendingCount}
        theme={theme}
        userRole={user.role}
      />

      <main className="main-content" id="inicio">
        <Topbar
          onSignOut={onSignOut}
          today={reservations.today}
          user={user}
        />
        <Toast message={reservations.notice} />
        <DataStatus
          error={reservations.dataError}
          isLoading={reservations.isLoading}
          onRetry={reservations.reloadRequests}
        />
        <WelcomePanel onNewRequest={reservations.openForm} />
        <StatsGrid
          nextRequest={reservations.nextRequest}
          pendingCount={reservations.pendingCount}
          visibleRequestCount={reservations.visibleRequests.length}
        />
        <Calendar
          calendarDays={reservations.calendarDays}
          currentMonth={reservations.currentMonth}
          monthLabel={reservations.monthLabel}
          onMoveMonth={reservations.moveMonth}
          onRequestSelect={reservations.selectRequest}
          onReturnToToday={reservations.returnToToday}
          requests={reservations.requests}
          today={reservations.today}
        />
        <UpcomingRequests
          onRequestSelect={reservations.selectRequest}
          requests={reservations.upcomingRequests}
        />
        {canManage && <AdminUsers currentUserId={user.id} />}
      </main>

      <RequestFormModal
        error={reservations.formError}
        form={reservations.form}
        isEditing={reservations.isEditing}
        isOpen={reservations.isFormOpen}
        isSaving={reservations.isSaving}
        minimumDateKey={reservations.minimumDateKey}
        minimumDateLabel={reservations.minimumDateLabel}
        onChange={reservations.handleFieldChange}
        onClose={reservations.closeForm}
        onSubmit={reservations.handleSubmit}
      />
      <RequestDetailModal
        canManage={canManage}
        onClose={reservations.clearSelectedRequest}
        onDelete={reservations.requestDelete}
        onEdit={reservations.editRequest}
        request={reservations.selectedRequest}
      />
      <DeleteRequestModal
        error={reservations.deleteError}
        isDeleting={reservations.isDeleting}
        onCancel={reservations.cancelDelete}
        onConfirm={reservations.confirmDelete}
        request={reservations.requestPendingDeletion}
      />
    </div>
  )
}

function App() {
  const auth = useAuth()

  if (!auth.user) {
    return (
      <AuthScreen
        error={auth.error}
        isChecking={auth.isChecking}
        isSubmitting={auth.isSubmitting}
        onCancelPasswordSetup={auth.cancelPasswordSetup}
        onClearError={auth.clearError}
        onCompletePasswordSetup={auth.completePasswordSetup}
        onSignIn={auth.signIn}
        setupEmail={auth.setupEmail}
      />
    )
  }

  return <AuthenticatedApp onSignOut={auth.signOut} user={auth.user} />
}

export default App
