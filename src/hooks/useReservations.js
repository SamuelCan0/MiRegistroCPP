import { useCallback, useEffect, useMemo, useState } from 'react'
import { ACTIVITY_TYPES } from '../config/activities'
import {
  createRequest,
  deleteRequest,
  listRequests,
  updateRequest,
} from '../services/requestsApi'
import {
  addDays,
  formatDate,
  fromDateKey,
  getCalendarDays,
  isDateInMonth,
  toDateKey,
} from '../utils/date'
import { hasScheduleConflict } from '../utils/reservationConflicts'

function createEmptyForm(minimumDateKey, defaultResponsible = '') {
  return {
    title: '',
    type: ACTIVITY_TYPES[0],
    date: minimumDateKey,
    startTime: '08:00',
    endTime: '09:00',
    responsible: defaultResponsible,
    notes: '',
  }
}

function createEditForm(request) {
  return {
    title: request.title,
    type: request.type,
    date: request.date,
    startTime: request.startTime,
    endTime: request.endTime,
    responsible: request.responsible,
    notes: request.notes,
  }
}

export function useReservations({ canManage, defaultResponsible }) {
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
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [dataError, setDataError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingRequestId, setEditingRequestId] = useState(null)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [requestPendingDeletion, setRequestPendingDeletion] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [notice, setNotice] = useState('')
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState(() =>
    createEmptyForm(minimumDateKey, defaultResponsible),
  )

  const reloadRequests = useCallback(async () => {
    setIsLoading(true)
    setDataError('')

    try {
      setRequests(await listRequests())
    } catch (error) {
      setDataError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    reloadRequests()
  }, [reloadRequests])

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsFormOpen(false)
        setEditingRequestId(null)
        setSelectedRequest(null)
        setRequestPendingDeletion(null)
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
    setForm(createEmptyForm(minimumDateKey, defaultResponsible))
    setEditingRequestId(null)
    setFormError('')
    setIsFormOpen(true)
  }

  function closeForm() {
    if (isSaving) return
    setIsFormOpen(false)
    setEditingRequestId(null)
    setForm(createEmptyForm(minimumDateKey, defaultResponsible))
    setFormError('')
  }

  function editRequest(request) {
    if (!canManage) return
    setForm(createEditForm(request))
    setEditingRequestId(request.id)
    setSelectedRequest(null)
    setFormError('')
    setIsFormOpen(true)
  }

  function requestDelete(request) {
    if (!canManage) return
    setSelectedRequest(null)
    setDeleteError('')
    setRequestPendingDeletion(request)
  }

  function cancelDelete() {
    if (isDeleting) return
    setDeleteError('')
    setRequestPendingDeletion(null)
  }

  async function confirmDelete() {
    if (!requestPendingDeletion || isDeleting) return

    setIsDeleting(true)
    setDeleteError('')

    try {
      await deleteRequest(requestPendingDeletion.id)
      setRequests((current) =>
        current.filter((request) => request.id !== requestPendingDeletion.id),
      )
      setRequestPendingDeletion(null)
      setNotice('Solicitud eliminada correctamente.')
    } catch (error) {
      setDeleteError(error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  function handleFieldChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSaving) return

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
    if (hasScheduleConflict(requests, form, editingRequestId)) {
      setFormError(
        'Ese espacio ya está reservado durante parte o la totalidad del horario seleccionado.',
      )
      return
    }

    const requestValues = {
      ...form,
      title: form.title.trim(),
      responsible: form.responsible.trim(),
      notes: form.notes.trim() || 'Sin indicaciones adicionales.',
    }
    const requestedDate = fromDateKey(form.date)
    const isEditing = editingRequestId !== null

    setIsSaving(true)
    setFormError('')

    try {
      const savedRequest = isEditing
        ? await updateRequest(editingRequestId, requestValues)
        : await createRequest(requestValues)

      setRequests((current) =>
        isEditing
          ? current.map((request) =>
              request.id === savedRequest.id ? savedRequest : request,
            )
          : [...current, savedRequest],
      )
      setCurrentMonth(
        new Date(requestedDate.getFullYear(), requestedDate.getMonth(), 1),
      )
      setIsFormOpen(false)
      setEditingRequestId(null)
      setForm(createEmptyForm(minimumDateKey, defaultResponsible))
      setNotice(
        isEditing
          ? 'Solicitud actualizada correctamente.'
          : 'Solicitud registrada y guardada permanentemente.',
      )
    } catch (error) {
      setFormError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return {
    calendarDays,
    cancelDelete,
    clearSelectedRequest: () => setSelectedRequest(null),
    closeForm,
    confirmDelete,
    currentMonth,
    dataError,
    deleteError,
    editRequest,
    form,
    formError,
    handleFieldChange,
    handleSubmit,
    isDeleting,
    isEditing: editingRequestId !== null,
    isFormOpen,
    isLoading,
    isSaving,
    minimumDateKey,
    minimumDateLabel,
    monthLabel,
    moveMonth,
    nextRequest,
    notice,
    openForm,
    pendingCount,
    reloadRequests,
    requestDelete,
    requestPendingDeletion,
    requests,
    returnToToday,
    selectedRequest,
    selectRequest: setSelectedRequest,
    today,
    upcomingRequests,
    visibleRequests,
  }
}
