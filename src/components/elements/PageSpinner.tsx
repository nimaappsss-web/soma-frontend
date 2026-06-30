import React from 'react'
import clsx from 'clsx'

interface PageSpinnerProps {
  className?: string
  width?: string
  height?: string
}

export const PageSpinner: React.FC<PageSpinnerProps> = ({
  className = 'mt-10',
  width = '60px',
  height = '60px',
}) => {
  return (
    <div
      className={clsx(
        'inset-0  flex h-full items-center justify-center',
        className
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        style={{
          background: 'none',
          display: 'block',
          shapeRendering: 'auto',
          margin: 'auto',
        }}
        width={width}
        height={height}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid"
      >
        <circle
          cx="50"
          cy="50"
          fill="none"
          stroke="#0B221D"
          strokeWidth="4"
          r="35"
          strokeDasharray="164.93361431346415 56.97787143782138"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            repeatCount="indefinite"
            dur="1s"
            values="0 50 50;360 50 50"
            keyTimes="0;1"
          ></animateTransform>
        </circle>
      </svg>
    </div>
  )
}
