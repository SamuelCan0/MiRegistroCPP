export function hasScheduleConflict(requests, candidate, ignoredId = null) {
  return requests.some(
    (request) =>
      request.id !== ignoredId &&
      request.type === candidate.type &&
      request.date === candidate.date &&
      request.startTime < candidate.endTime &&
      request.endTime > candidate.startTime,
  )
}
