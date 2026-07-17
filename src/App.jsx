import { useState, useEffect, useCallback } from 'react'

/**
 * Enn Studio — 接案作品目錄 + 委託價目表
 * 版面拆解自 https://zaoridraws.cargo.site/：
 * - 最左側固定的黃色漸層直條
 * - 固定左欄（頭像、名字、選單、斜體社群連結）
 * - 右上角直式文字 logo
 * - 主區域為多欄瀑布流（CSS columns），圖片依原始比例排列
 */

const BASE = import.meta.env.BASE_URL

const GALLERY_ITEMS = [
  { src: 'bg-illustration.png', title: 'Illustration', category: 'personal' },
  { src: 'project-cover-mentor.png', title: 'Mentor', category: 'client' },
  { src: 'bg-train.png', title: 'Train', category: 'personal' },
  { src: 'project-cover-penguin.png', title: 'Penguin Territory', category: 'client' },
  { src: 'bg-hot-tea.png', title: 'Hot Tea', category: 'personal' },
  { src: 'project-cover-ehairpos.png', title: 'eHairPOS', category: 'client' },
  { src: 'bg-chivalry.png', title: 'Chivalry', category: 'personal' },
  { src: 'project-cover-basel.png', title: 'Basel', category: 'client' },
  { src: 'bg-textbook.png', title: 'Textbook', category: 'personal' },
  { src: 'project-cover-chivalry.png', title: 'Chivalry Cover', category: 'client' },
  { src: 'bg-mentor.png', title: 'Mentor Poster', category: 'client' },
  { src: 'project-cover-shopping.png', title: 'Shopping', category: 'client' },
  { src: 'bg-ehairpos.png', title: 'eHairPOS Poster', category: 'client' },
  { src: 'portrait.png', title: 'Portrait', category: 'personal' },
  { src: 'bg-penguin.png', title: 'Penguin Poster', category: 'personal' },
]

const FILTERS = [
  { key: 'client', label: 'CLIENT WORK' },
  { key: 'personal', label: 'PERSONAL WORK' },
]

// 價目表資料：接案品項先放示意內容，之後直接改這個陣列即可
const PRICING = [
  {
    name: 'UI / UX 設計',
    price: 'NT$ —— 起',
    note: '介面設計、原型製作、設計系統。依頁面數與複雜度報價。',
  },
  {
    name: '插畫委託',
    price: 'NT$ —— 起',
    note: '主視覺、書封、貼圖等。含兩次修改，商用授權另計。',
  },
  {
    name: '品牌視覺',
    price: 'NT$ —— 起',
    note: 'Logo、名片、社群模板等整套視覺識別。',
  },
]

function Lightbox({ items, index, onClose, onPrev, onNext }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onPrev, onNext])

  const item = items[index]
  if (!item) return null

  return (
    <div
      className='fixed inset-0 z-50 bg-white/95 flex items-center justify-center'
      onClick={onClose}
    >
      <button
        aria-label='Close'
        className='absolute top-6 right-8 text-2xl text-neutral-500 hover:text-neutral-900 font-serif'
        onClick={onClose}
      >
        ✕
      </button>
      <button
        aria-label='Previous'
        className='absolute left-4 md:left-8 text-3xl text-neutral-400 hover:text-neutral-900 font-serif select-none'
        onClick={(e) => { e.stopPropagation(); onPrev() }}
      >
        ←
      </button>
      <figure
        className='max-w-[82vw] max-h-[86vh] flex flex-col items-center'
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={BASE + item.src}
          alt={item.title}
          className='max-w-full max-h-[78vh] object-contain shadow-sm'
        />
        <figcaption className='mt-4 font-serif text-sm tracking-widest text-neutral-500'>
          {item.title}
          <span className='ml-3 text-neutral-300'>
            {index + 1} / {items.length}
          </span>
        </figcaption>
      </figure>
      <button
        aria-label='Next'
        className='absolute right-4 md:right-8 text-3xl text-neutral-400 hover:text-neutral-900 font-serif select-none'
        onClick={(e) => { e.stopPropagation(); onNext() }}
      >
        →
      </button>
    </div>
  )
}

function App() {
  const [filter, setFilter] = useState(null) // null = all
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const items = filter
    ? GALLERY_ITEMS.filter((it) => it.category === filter)
    : GALLERY_ITEMS

  const openLightbox = useCallback((i) => setLightboxIndex(i), [])
  const closeLightbox = useCallback(() => setLightboxIndex(null), [])
  const prev = useCallback(
    () => setLightboxIndex((i) => (i - 1 + items.length) % items.length),
    [items.length]
  )
  const next = useCallback(
    () => setLightboxIndex((i) => (i + 1) % items.length),
    [items.length]
  )

  return (
    <div className='min-h-screen bg-white font-serif text-neutral-800'>
      {/* 左側黃色漸層直條 */}
      <div
        aria-hidden='true'
        className='fixed left-0 top-0 h-full w-6 md:w-8 z-30 pointer-events-none'
        style={{
          background:
            'linear-gradient(to right, #F5D547 0%, #FBEFB8 55%, rgba(255,255,255,0) 100%)',
        }}
      />

      {/* 右上角直式 logo */}
      <div
        className='fixed top-8 right-8 z-30 hidden md:block select-none text-neutral-700'
        style={{ writingMode: 'vertical-rl', letterSpacing: '0.4em' }}
      >
        作品目錄
      </div>

      {/* 固定左欄 */}
      <aside className='fixed left-6 md:left-10 top-0 z-20 pt-10 md:pt-14 w-44 hidden md:flex flex-col h-full'>
        <img
          src={BASE + 'portrait.png'}
          alt='Enn Tang'
          className='w-24 h-24 object-cover rounded-full grayscale hover:grayscale-0 transition-all duration-500 mb-8'
        />

        <div className='font-bold tracking-wider text-lg mb-1'>Enn Tang</div>
        <div className='text-xs tracking-[0.25em] text-neutral-400 mb-10'>STUDIO</div>

        <nav className='flex flex-col gap-4 text-[13px] tracking-[0.15em] text-neutral-700'>
          <button
            className={`text-left hover:opacity-50 transition-opacity ${filter === null ? 'underline underline-offset-4' : ''}`}
            onClick={() => setFilter(null)}
          >
            ALL WORK
          </button>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`text-left hover:opacity-50 transition-opacity ${filter === f.key ? 'underline underline-offset-4' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
          <a href='#pricing' className='hover:opacity-50 transition-opacity'>
            PRICING
          </a>
          <a href='mailto:viesty2004@gmail.com' className='hover:opacity-50 transition-opacity'>
            CONTACT
          </a>
        </nav>

        <div className='mt-14 text-sm italic text-neutral-600'>
          <span aria-hidden='true' className='block not-italic mb-2'>↘</span>
          <div className='flex flex-col gap-1'>
            <a href='https://instagram.com' target='_blank' rel='noreferrer' className='hover:opacity-50 transition-opacity'>Instagram</a>
            <a href='https://behance.net' target='_blank' rel='noreferrer' className='hover:opacity-50 transition-opacity'>Behance</a>
            <a href='https://facebook.com' target='_blank' rel='noreferrer' className='hover:opacity-50 transition-opacity'>Facebook</a>
          </div>
        </div>
      </aside>

      {/* 行動版頂部列 */}
      <header className='md:hidden sticky top-0 z-20 bg-white/90 backdrop-blur px-8 py-4 flex items-center justify-between'>
        <div className='font-bold tracking-wider'>Enn Tang</div>
        <div className='flex gap-3 text-[11px] tracking-widest text-neutral-600'>
          <button
            className={filter === null ? 'underline underline-offset-4' : ''}
            onClick={() => setFilter(null)}
          >
            ALL
          </button>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={filter === f.key ? 'underline underline-offset-4' : ''}
              onClick={() => setFilter(f.key)}
            >
              {f.key.toUpperCase()}
            </button>
          ))}
          <a href='#pricing'>PRICING</a>
        </div>
      </header>

      {/* 瀑布流主區域 */}
      <main className='pl-8 pr-8 md:pl-64 md:pr-24 pt-10 md:pt-14 pb-24'>
        <div className='columns-1 sm:columns-2 xl:columns-3 gap-8 [column-fill:balance]'>
          {items.map((item, i) => (
            <figure key={item.src} className='mb-8 break-inside-avoid'>
              <button
                className='block w-full group'
                onClick={() => openLightbox(i)}
                aria-label={`View ${item.title}`}
              >
                <img
                  src={BASE + item.src}
                  alt={item.title}
                  loading='lazy'
                  className='w-full h-auto block transition-opacity duration-300 group-hover:opacity-80'
                />
              </button>
            </figure>
          ))}
        </div>

        {/* 價目表 */}
        <section id='pricing' className='mt-28 max-w-2xl scroll-mt-16'>
          <h2 className='text-sm tracking-[0.3em] text-neutral-500 mb-10'>PRICING 委託價目</h2>
          <dl className='divide-y divide-neutral-200'>
            {PRICING.map((p) => (
              <div key={p.name} className='py-6 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-8'>
                <dt className='w-40 shrink-0 font-bold tracking-wide'>{p.name}</dt>
                <dd className='flex-1'>
                  <div className='mb-1'>{p.price}</div>
                  <div className='text-sm text-neutral-500 leading-relaxed'>{p.note}</div>
                </dd>
              </div>
            ))}
          </dl>
          <p className='mt-8 text-sm text-neutral-500 leading-relaxed'>
            以上為參考價格，實際依需求規模與時程報價。
            歡迎來信 <a href='mailto:viesty2004@gmail.com' className='underline underline-offset-4 hover:opacity-60'>viesty2004@gmail.com</a> 討論你的專案。
          </p>
        </section>

        <footer className='mt-20 text-xs tracking-widest text-neutral-400'>
          © {new Date().getFullYear()} Enn Tang
        </footer>
      </main>

      {lightboxIndex !== null && (
        <Lightbox
          items={items}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prev}
          onNext={next}
        />
      )}
    </div>
  )
}

export default App
