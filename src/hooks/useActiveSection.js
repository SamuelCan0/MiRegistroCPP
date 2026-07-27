import { useEffect, useState } from 'react'

const SECTION_IDS = ['inicio', 'calendario', 'solicitudes']

function getSectionFromHash() {
  const section = window.location.hash.slice(1)
  return SECTION_IDS.includes(section) ? section : SECTION_IDS[0]
}

export function useActiveSection() {
  const [activeSection, setActiveSection] = useState(getSectionFromHash)

  useEffect(() => {
    let animationFrame

    function updateActiveSection() {
      animationFrame = undefined
      const activationLine = Math.min(window.innerHeight * 0.35, 260)
      const reachedPageEnd =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2

      if (reachedPageEnd) {
        setActiveSection(SECTION_IDS.at(-1))
        return
      }

      const currentSection = SECTION_IDS.reduce((selected, sectionId) => {
        const section = document.getElementById(sectionId)
        return section && section.getBoundingClientRect().top <= activationLine
          ? sectionId
          : selected
      }, SECTION_IDS[0])

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
  }, [])

  function selectSection(sectionId) {
    setActiveSection(sectionId)
  }

  return { activeSection, selectSection }
}
