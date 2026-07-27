import { useEffect, useState } from 'react'
import {
  getSession,
  login,
  logout,
  setupPassword,
} from '../services/authApi'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [setupEmail, setSetupEmail] = useState('')
  const [isChecking, setIsChecking] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsChecking(false))
  }, [])

  async function signIn(credentials) {
    setIsSubmitting(true)
    setError('')
    try {
      setUser(await login(credentials))
      return true
    } catch (requestError) {
      if (requestError.code === 'PASSWORD_SETUP_REQUIRED') {
        setSetupEmail(credentials.email.trim().toLowerCase())
        setError('')
      } else {
        setError(requestError.message)
      }
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  async function completePasswordSetup(credentials) {
    setIsSubmitting(true)
    setError('')
    try {
      setUser(await setupPassword(credentials))
      setSetupEmail('')
      return true
    } catch (requestError) {
      setError(requestError.message)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  async function signOut() {
    setIsSubmitting(true)
    try {
      await logout()
    } finally {
      setUser(null)
      setSetupEmail('')
      setError('')
      setIsSubmitting(false)
    }
  }

  return {
    cancelPasswordSetup: () => {
      setSetupEmail('')
      setError('')
    },
    clearError: () => setError(''),
    completePasswordSetup,
    error,
    isChecking,
    isSubmitting,
    setupEmail,
    signIn,
    signOut,
    user,
  }
}
