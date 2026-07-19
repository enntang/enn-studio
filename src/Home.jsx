import { useState } from 'react'
import { BASE, WORKS, FILTERS } from './data'
import Reveal from './Reveal'

/**
 * 首頁：
 * - 固定左欄（文字標示、選單、斜體社群連結）：CLIENT WORK / PERSONAL WORK 篩選
 * - 主區域上方另有一排標籤篩選列（Notion 的 Tags 多選欄位），兩種篩選同時套用
 * - 主區域為多欄瀑布流（CSS columns），縮圖下方固定顯示標題與標籤，點擊進入獨立頁面
 */

// 所有作品目前用到的標籤，依字母排序
const ALL_TAGS = [...new Set(WORKS.flatMap((w) => w.tags || []))].sort()

function Home() {
  const [filter, setFilter] = useState(null) // null = all
  const [tagFilter, setTagFilter] = useState(null) // null = all

  const items = WORKS.filter(
    (w) =>
      (filter === null || w.category === filter) &&
      (tagFilter === null || (w.tags || []).includes(tagFilter))
  )

  return (
    <div className='min-h-screen bg-white font-serif text-neutral-800'>
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
          <a href='mailto:enntang.work@gmail.com' className='hover:opacity-50 transition-opacity'>
            CONTACT
          </a>
        </nav>

        <div className='mt-14 text-sm italic text-neutral-600'>
          <span aria-hidden='true' className='block not-italic mb-2'>↘</span>
          <div className='flex flex-col gap-1'>
            <a href='https://instagram.com' target='_blank' rel='noreferrer' className='hover:opacity-50 transition-opacity'>Instagram</a>
            <a href='mailto:enntang.work@gmail.com' className='hover:opacity-50 transition-opacity'>enntang.work@gmail.com</a>
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
        </div>
      </header>

      {/* 瀑布流主區域 */}
      <main className='pl-8 pr-8 md:pl-64 md:pr-24 pt-10 md:pt-14 pb-24'>
        {/* 標籤篩選列 */}
        {ALL_TAGS.length > 0 && (
          <div className='flex flex-wrap gap-x-5 gap-y-2 mb-10 text-[13px] tracking-[0.1em] text-neutral-500'>
            <button
              className={`hover:opacity-60 transition-opacity ${tagFilter === null ? 'text-neutral-900 underline underline-offset-4' : ''}`}
              onClick={() => setTagFilter(null)}
            >
              All
            </button>
            {ALL_TAGS.map((tag) => (
              <button
                key={tag}
                className={`hover:opacity-60 transition-opacity ${tagFilter === tag ? 'text-neutral-900 underline underline-offset-4' : ''}`}
                onClick={() => setTagFilter(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

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
                    <div className='aspect-[4/3] bg-neutral-100 flex items-center justify-center text-neutral-400 text-sm tracking-widest'>
                      {item.title}
                    </div>
                  )}
                </a>
                {/* 固定顯示標題與標籤 */}
                <figcaption className='mt-3'>
                  <div className='font-bold tracking-wide text-sm'>{item.title}</div>
                  {item.tags?.length > 0 && (
                    <div className='mt-1 text-xs tracking-wide text-neutral-400'>
                      {item.tags.map((t) => `#${t}`).join(' ')}
                    </div>
                  )}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <footer className='mt-20 text-xs tracking-widest text-neutral-400'>
          © {new Date().getFullYear()} Enn Tang
        </footer>
      </main>
    </div>
  )
}

export default Home
