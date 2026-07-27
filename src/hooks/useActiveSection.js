import { useEffect, useMemo, useState } from 'react'

const BASE_SECTION_IDS = ['inicio', 'calendario', 'solicitudes']

function getSectionFromHash(sectionIds) {
  const section = window.location.hash.slice(1)
  return sectionIds.includes(section) ? section : sectionIds[0]
}

export function useActiveSection(canManageUsers = false) {
  const sectionIds = useMemo(
    () =>
      canManageUsers
        ? [...BASE_SECTION_IDS, 'usuarios']
        : BASE_SECTION_IDS,
    [canManageUsers],
  )
  const [activeSection, setActiveSection] = useState(() =>
    getSectionFromHash(sectionIds),
  )

  useEffect(() => {
    let animationFrame

    function updateActiveSection() {
      animationFrame = undefined
      const activationLine = Math.min(window.innerHeight * 0.35, 260)
      const reachedPageEnd =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2

      if (reachedPageEnd) {
        setActiveSection(sectionIds.at(-1))
        return
      }

      const currentSection = sectionIds.reduce((selected, sectionId) => {
        const section = document.getElementById(sectionId)
        return section && section.getBoundingClientRect().top <= activationLine
          ? sectionId
          : selected
      }, sectionIds[0])

      setActiveSection(currentSection)
    }

    function scheduleUpdate() {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(updateActiveSection)
      }
    }

    updateActiveSection()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('hashchange', scheduleUpdate)

    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      window.removeEventListener('hashchange', scheduleUpdate)
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
    }
  }, [sectionIds])

  function selectSection(sectionId) {
    setActiveSection(sectionId)
  }

  return { activeSection, selectSection }
}
