'use client'
import { useState } from 'react'

export const useToggle = (defaultToggleState = false) => {
  const [show, setShow] = useState<boolean>(defaultToggleState)

  const handleToggle = () => {
    setShow((prevShow) => !prevShow)
  }

  return {
    show,
    handleToggle,
  }
}
