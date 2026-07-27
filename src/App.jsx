import './App.css'
import { Calendar } from './components/calendar/Calendar'
import { StatsGrid } from './components/dashboard/StatsGrid'
import { WelcomePanel } from './components/dashboard/WelcomePanel'
import { Toast } from './components/feedback/Toast'
import { Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'
import { RequestDetailModal } from './components/modals/RequestDetailModal'
import { RequestFormModal } from './components/modals/RequestFormModal'
import { UpcomingRequests } from './components/requests/UpcomingRequests'
import { useReservations } from './hooks/useReservations'

function App() {
  const reservations = useReservations()

  return (
    <div className="app">
      <Sidebar
        pendingCount={reservations.pendingCount}
      />

      <main className="main-content" id="inicio">
        <Topbar today={reservations.today} />
        <Toast message={reservations.notice} />
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
      </main>

      <RequestFormModal
        error={reservations.formError}
        form={reservations.form}
        isOpen={reservations.isFormOpen}
        minimumDateKey={reservations.minimumDateKey}
        minimumDateLabel={reservations.minimumDateLabel}
        onChange={reservations.handleFieldChange}
        onClose={reservations.closeForm}
        onSubmit={reservations.handleSubmit}
      />
      <RequestDetailModal
        onClose={reservations.clearSelectedRequest}
        request={reservations.selectedRequest}
      />
    </div>
  )
}

export default App
