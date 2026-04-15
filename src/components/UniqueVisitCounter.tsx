'use client'

import { useEffect, useRef, useState } from 'react'

export default function UniqueVisitCounter() {
  const [count, setCount] = useState<number | null>(null)
  const registeredRef = useRef(false)

  useEffect(() => {
    if (registeredRef.current) return
    registeredRef.current = true

    fetch('/api/visits', {
      method: 'POST',
      cache: 'no-store',
    })
      .then((response) => response.json())
      .then((data) => {
        const nextCount = Number(data?.uniqueVisitsToday || 0)
        if (Number.isFinite(nextCount)) {
          setCount(nextCount)
        }
      })
      .catch(() => {
        setCount(null)
      })
  }, [])

  if (count === null) {
    return null
  }

  return (
    <span className="text-xs md:text-sm font-semibold text-muted-foreground whitespace-nowrap">
      Visitantes hoje: {count.toLocaleString('pt-BR')}
    </span>
  )
}
