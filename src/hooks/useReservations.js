import { useEffect, useMemo, useState } from 'react'
import { ACTIVITY_TYPES } from '../config/activities'
import { getInitialRequests } from '../data/initialRequests'
import {
  addDays,
  formatDate,
  fromDateKey,
  getCalendarDays,
  isDateInMonth,
  toDateKey,
} from '../utils/date'

function createEmptyForm(minimumDateKey) {
  return {
    title: '',
    type: ACTIVITY_TYPES[0],
    date: minimumDateKey,
    startTime: '08:00',
    endTime: '09:00',
    responsible: '',
    notes: '',
  }
}

export function useReservations() {
  const today = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])
  const minimumDate = useMemo(() => addDays(today, 2), [today])
  const minimumDateKey = toDateKey(minimumDate)
  const minimumDateLabel = formatDate(minimumDate, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [requests, setRequests] = useState(() => getInitialRequests(today))
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [notice, setNotice] = useState('')
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState(() => createEmptyForm(minimumDateKey))

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsFormOpen(false)
        setSelectedRequest(null)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  useEffect(() => {
    if (!notice) return undefined
    const timeout = window.setTimeout(() => setNotice(''), 4500)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth),
    [currentMonth],
  )
  const visibleRequests = useMemo(
    () => requests.filter((request) => isDateInMonth(request.date, currentMonth)),
    [currentMonth, requests],
  )
  const pendingCount = requests.filter(
    (request) => request.status === 'Pendiente',
  ).length
  const upcomingRequests = useMemo(
    () =>
      [...requests]
        .sort((a, b) =>
          `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
        )
        .slice(0, 4),
    [requests],
  )
  const nextRequest = useMemo(
    () =>
      [...requests]
        .filter((request) => request.date >= toDateKey(today))
        .sort((a, b) =>
          `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
        )[0],
    [requests, today],
  )
  const monthLabel = formatDate(currentMonth, {
    month: 'long',
    year: 'numeric',
  })

  function moveMonth(amount) {
    setCurrentMonth(
      (month) => new Date(month.getFullYear(), month.getMonth() + amount, 1),
    )
  }

  function returnToToday() {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  function openForm() {
    setFormError('')
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setFormError('')
  }

  function handleFieldChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFormError('')
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!form.title.trim() || !form.responsible.trim()) {
      setFormError('Completa el nombre de la actividad y la persona responsable.')
      return
    }
    if (form.date < minimumDateKey) {
      setFormError(
        `La fecha debe ser el ${minimumDateLabel} o posterior (mínimo 2 días de anticipación).`,
      )
      return
    }
    if (form.endTime <= form.startTime) {
      setFormError('La hora de término debe ser posterior a la hora de inicio.')
      return
    }

    const newRequest = {
      ...form,
      id: Date.now(),
      title: form.title.trim(),
      responsible: form.responsible.trim(),
      notes: form.notes.trim() || 'Sin indicaciones adicionales.',
      status: 'Pendiente',
    }
    const requestedDate = fromDateKey(form.date)

    setRequests((current) => [...current, newRequest])
    setCurrentMonth(
      new Date(requestedDate.getFullYear(), requestedDate.getMonth(), 1),
    )
    setForm(createEmptyForm(minimumDateKey))
    closeForm()
    setNotice('Solicitud registrada. Se agregó al calendario como pendiente.')
  }

  return {
    calendarDays,
    clearSelectedRequest: () => setSelectedRequest(null),
    closeForm,
    currentMonth,
    form,
    formError,
    handleFieldChange,
    handleSubmit,
    isFormOpen,
    minimumDateKey,
    minimumDateLabel,
    monthLabel,
    moveMonth,
    nextRequest,
    notice,
    openForm,
    pendingCount,
    requests,
    returnToToday,
    selectedRequest,
    selectRequest: setSelectedRequest,
    today,
    upcomingRequests,
    visibleRequests,
  }
}
