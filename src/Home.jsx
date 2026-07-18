import { useState } from 'react'
import { BASE, WORKS, FILTERS, PRICING } from './data'
import Reveal from './Reveal'

/**
 * 首頁：
 * - 固定左欄（文字標示、選單、斜體社群連結）
 * - 右上角直式文字 logo
 * - 主區域為多欄瀑布流（CSS columns），點擊作品進入獨立頁面
 * - 下方為委託價目表
 */
function Home() {
  const [filter, setFilter] = useState(null) // null = all

  const items = filter ? WORKS.filter((w) => w.category === filter) : WORKS

  return (
    <div className='min-h-screen bg-white font-serif text-neutral-800'>
      {/* 右上角直式 logo */}
      <div
        className='fixed top-8 right-8 z-30 hidden md:block select-none text-neutral-700'
        style={{ writingMode: 'vertical-rl', letterSpacing: '0.4em' }}
      >
        作品目錄
      </div>

      {/* 固定左欄 */}
      <aside className='fixed left-6 md:left-10 top-0 z-20 pt-10 md:pt-14 w-44 hidden md:flex flex-col h-full'>
        <a href='#/' className='block mb-10 hover:opacity-60 transition-opacity'>
          <div className='font-bold tracking-wider text-lg mb-1'>Enn Tang</div>
          <div className='text-xs tracking-[0.25em] text-neutral-400'>STUDIO</div>
        </a>

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
        <a href='#/' className='font-bold tracking-wider'>Enn Tang</a>
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
            <Reveal key={item.slug} delay={(i % 4) * 90} className='mb-8 break-inside-avoid'>
              <figure>
                <a
                  href={`#/work/${item.slug}`}
                  className='block w-full group'
                  aria-label={`View ${item.title}`}
                >
                  {item.cover ? (
                    <img
                      src={BASE + item.cover}
                      alt={item.title}
                      loading='lazy'
                      className='w-full h-auto block transition-opacity duration-300 group-hover:opacity-80'
                    />
                  ) : (
                    // Notion 尚未上傳 Cover 時的暫代區塊
                    <div className='aspect-[4/3] bg-neutral-100 flex items-center justify-center text-neutral-400 text-sm tracking-widest transition-opacity duration-300 group-hover:opacity-80'>
                      {item.title}
                    </div>
                  )}
                </a>
              </figure>
            </Reveal>
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
    </div>
  )
}

export default Home
