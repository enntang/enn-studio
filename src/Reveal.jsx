import { useEffect, useRef, useState } from 'react'

/**
 * 進場動畫：子元素進入可視範圍時淡入並微微上移。
 * delay（毫秒）讓同一批出現的元素輪流錯開。
 */
function Reveal({ delay = 0, className = '', children }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
      style={{ transitionDelay: `${visible ? delay : 0}ms` }}
    >
      {children}
    </div>
  )
}

export default Reveal
