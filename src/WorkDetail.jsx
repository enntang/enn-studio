import ReactMarkdown from 'react-markdown'
import { BASE } from './data'
import Reveal from './Reveal'

/**
 * 作品獨立頁面（版面參照 jiaanzhuang.com 的作品頁）：
 * - 左欄：文字標示（回首頁）、作品標題、年代、介紹、返回連結
 * - 右側：Notion 同步下來的圖文內容（content，Markdown）；
 *   沒有 content 時退回顯示 images 陣列的大圖
 */

// 同步腳本會把內文圖片寫成 /work-images/... 的絕對路徑，
// 部署在子路徑（GitHub Pages）時要換成 BASE 開頭
function resolveSrc(src) {
  return src?.startsWith('/') ? BASE + src.slice(1) : src
}

const mdComponents = {
  p: ({ node, children }) => {
    // 圖片獨立成段時不包 <p>，讓 Reveal 的區塊元素合法
    const hasImg = node?.children?.some((c) => c.tagName === 'img')
    if (hasImg) return <>{children}</>
    return (
      <p className='max-w-xl text-sm leading-relaxed text-neutral-600 mb-8'>
        {children}
      </p>
    )
  },
  img: ({ src, alt }) => (
    <Reveal className='mb-8'>
      <img src={resolveSrc(src)} alt={alt || ''} className='w-full h-auto block' />
    </Reveal>
  ),
  h1: ({ children }) => (
    <h2 className='text-lg font-bold tracking-wide mt-12 mb-4'>{children}</h2>
  ),
  h2: ({ children }) => (
    <h2 className='text-lg font-bold tracking-wide mt-12 mb-4'>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className='font-bold tracking-wide mt-8 mb-3'>{children}</h3>
  ),
  a: ({ href, children }) => (
    <a href={href} target='_blank' rel='noreferrer' className='underline underline-offset-4 hover:opacity-60'>
      {children}
    </a>
  ),
}

function WorkDetail({ work }) {
  return (
    <div className='min-h-screen bg-white font-serif text-neutral-800 md:grid md:grid-cols-[18rem_1fr]'>
      {/* 左欄：年代與介紹 */}
      <aside className='px-8 md:pl-10 md:pr-6 pt-10 md:pt-14 md:sticky md:top-0 md:h-screen flex flex-col'>
        <a href='#/' className='block mb-12 hover:opacity-60 transition-opacity'>
          <div className='font-bold tracking-wider text-lg mb-1'>Enn Tang</div>
          <div className='text-xs tracking-[0.25em] text-neutral-400'>STUDIO</div>
        </a>

        <h1 className='text-xl font-bold tracking-wide mb-2'>{work.title}</h1>
        <div className='text-sm tracking-[0.2em] text-neutral-400 mb-8'>{work.year}</div>

        <p className='text-sm leading-relaxed text-neutral-600 whitespace-pre-line'>
          {work.description}
        </p>

        <a
          href='#/'
          className='mt-12 md:mt-auto md:mb-14 text-[13px] tracking-[0.15em] text-neutral-700 hover:opacity-50 transition-opacity'
        >
          ← ALL WORK
        </a>
      </aside>

      {/* 右側：圖文內容 */}
      <main className='px-8 md:pl-0 md:pr-24 pt-8 md:pt-14 pb-24'>
        {work.content ? (
          <ReactMarkdown components={mdComponents}>{work.content}</ReactMarkdown>
        ) : (
          (work.images || [work.cover]).filter(Boolean).map((src, i) => (
            <Reveal key={src} delay={i * 100} className='mb-8'>
              <img
                src={BASE + src}
                alt={work.title}
                className='w-full h-auto block'
              />
            </Reveal>
          ))
        )}
        {!work.content && !(work.images || [work.cover]).some(Boolean) && (
          // Notion 頁面內文還沒放圖文時的暫代區塊
          <div className='aspect-[4/3] bg-neutral-100 flex items-center justify-center text-neutral-400 text-sm tracking-widest'>
            {work.title}
          </div>
        )}
      </main>
    </div>
  )
}

export default WorkDetail
