import { Client } from '@notionhq/client'
import { NotionToMarkdown } from 'notion-to-md'
import { writeFileSync, mkdirSync, existsSync, createWriteStream, rmSync, readFileSync } from 'fs'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'
import https from 'https'
import http from 'http'

/**
 * 從 Notion 的 Works 資料庫同步作品到網站（作法沿用 portfolio 專案的 notion-sync）。
 *
 * Notion 欄位（資料庫：Studio Sync）：
 * - Name（標題）、Slug（文字）、Status（選項，Published 才同步）
 * - Category（選項：client / personal）
 * - Date（日期，創作日期；首頁依此排序，新的在前）
 * - Year（文字或數字，選填；沒填就從 Date 取年份）
 * - Description（文字，作品頁左欄介紹）、Cover（Files，首頁縮圖）
 * - 頁面內文（圖片與文字段落）→ 作品頁右側內容
 *
 * 執行：npm run sync（需要 .env 內的 NOTION_API_KEY、NOTION_DATABASE_ID）
 */

const __dirname = dirname(fileURLToPath(import.meta.url))
const WORKS_FILE = join(__dirname, '../../src/works.generated.js')
const IMAGE_DIR = join(__dirname, '../../public/work-images')
const MANIFEST_FILE = join(__dirname, '../../.synced-works.json')

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const n2m = new NotionToMarkdown({ notionClient: notion })

async function main() {
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
    console.error('❌ 缺少 NOTION_API_KEY 或 NOTION_DATABASE_ID，請確認專案根目錄的 .env')
    process.exit(1)
  }

  console.log('🔍 正在從 Notion 獲取作品...')

  const syncedWorks = loadManifest()

  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID,
    filter: {
      property: 'Status',
      select: { equals: 'Published' }
    }
  })

  console.log(`🖼️  找到 ${response.results.length} 件已發布作品\n`)

  const works = []

  for (const page of response.results) {
    const props = page.properties
    const slug = getText(props.Slug)
    const title = getTitle(props.Name) || getTitle(props.Title)

    if (!slug) {
      console.log(`⚠️ 跳過：缺少 Slug - ${title}`)
      continue
    }

    console.log(`📝 處理: ${title} (${slug})`)

    // 頁面內文 → Markdown，圖片下載到本地
    const mdBlocks = await n2m.pageToMarkdown(page.id)
    const mdResult = n2m.toMarkdownString(mdBlocks)
    const markdownContent = typeof mdResult === 'string' ? mdResult : (mdResult?.parent || '')
    const { content, imageCount } = await processMarkdownImages(markdownContent || '', slug)

    // 首頁縮圖
    const coverUrl = getFileUrl(props.Cover) || getUrl(props.Cover)
    const cover = await processCoverImage(coverUrl, slug)
    if (!cover) {
      console.log(`   ⚠️ 沒有 Cover 縮圖，首頁瀑布流不會顯示這件作品的圖`)
    }

    const date = getDate(props.Date)
    works.push({
      slug,
      title,
      category: (getSelect(props.Category) || 'client').toLowerCase(),
      date,
      year: getText(props.Year) || getNumberText(props.Year) || (date ? date.slice(0, 4) : ''),
      description: getText(props.Description),
      cover: cover || '',
      content
    })

    syncedWorks.add(slug)
    console.log(`   ✅ 完成${imageCount > 0 ? `（下載了 ${imageCount} 張內文圖片）` : ''}\n`)
  }

  // 依創作日期排序，新的在前（沒填 Date 的排最後）
  works.sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return b.date.localeCompare(a.date)
  })

  // 寫入產生檔
  const fileContent = `// 此檔案由 npm run sync 從 Notion 自動產生，請勿手動編輯。
// 作品的新增與修改請到 Notion 的 Works 資料庫操作。
export const WORKS = ${JSON.stringify(works, null, 2)}
`
  writeFileSync(WORKS_FILE, fileContent)
  console.log(`✅ 已寫入: src/works.generated.js（共 ${works.length} 件作品）`)

  // 清理已取消發布作品的圖片
  const publishedSlugs = works.map((w) => w.slug)
  const { deletedCount, updatedSyncedWorks } = cleanupUnpublished(publishedSlugs, syncedWorks)
  if (deletedCount > 0) {
    console.log(`🗑️  已刪除 ${deletedCount} 件取消發布作品的圖片`)
  }

  saveManifest(updatedSyncedWorks)
  console.log('✨ 同步完成！')
}

// ============ Manifest 管理 ============

function loadManifest() {
  try {
    if (existsSync(MANIFEST_FILE)) {
      const data = JSON.parse(readFileSync(MANIFEST_FILE, 'utf-8'))
      return new Set(data.syncedWorks || [])
    }
  } catch {
    console.log('⚠️ 無法讀取 manifest，將建立新的')
  }
  return new Set()
}

function saveManifest(syncedWorks) {
  const data = {
    lastSync: new Date().toISOString(),
    syncedWorks: [...syncedWorks]
  }
  writeFileSync(MANIFEST_FILE, JSON.stringify(data, null, 2))
}

// ============ 清理功能 ============

function cleanupUnpublished(publishedSlugs, syncedWorks) {
  let deletedCount = 0
  const updatedSyncedWorks = new Set(syncedWorks)

  for (const slug of syncedWorks) {
    if (!publishedSlugs.includes(slug)) {
      console.log(`🗑️  刪除取消發布的作品圖片: ${slug}`)
      const imageDir = join(IMAGE_DIR, slug)
      if (existsSync(imageDir)) {
        rmSync(imageDir, { recursive: true })
      }
      updatedSyncedWorks.delete(slug)
      deletedCount++
    }
  }

  return { deletedCount, updatedSyncedWorks }
}

// ============ 圖片處理 ============

async function processMarkdownImages(markdown, slug) {
  if (!markdown || typeof markdown !== 'string') {
    return { content: '', imageCount: 0 }
  }

  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
  let imageCount = 0
  let imageIndex = 0
  let processedMarkdown = markdown

  const matches = [...markdown.matchAll(imageRegex)]

  for (const match of matches) {
    const [fullMatch, alt, url] = match
    if (url.startsWith('/')) continue

    imageIndex++
    const localPath = await downloadImage(url, slug, `image-${imageIndex}`)

    if (localPath) {
      processedMarkdown = processedMarkdown.replace(fullMatch, `![${alt}](${localPath})`)
      imageCount++
    }
  }

  return { content: processedMarkdown, imageCount }
}

async function processCoverImage(url, slug) {
  if (!url) return ''
  if (url.startsWith('/')) return url.slice(1)

  const localPath = await downloadImage(url, slug, 'cover')
  // 縮圖路徑不帶開頭斜線，前端以 BASE + cover 組合（與內文圖片的處理不同）
  return localPath ? localPath.slice(1) : ''
}

async function downloadImage(url, slug, name) {
  try {
    const imageDir = join(IMAGE_DIR, slug)
    if (!existsSync(imageDir)) {
      mkdirSync(imageDir, { recursive: true })
    }

    const urlPath = new URL(url).pathname
    let ext = extname(urlPath).split('?')[0] || '.png'
    if (!ext.match(/^\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      ext = '.png'
    }

    const filename = `${name}${ext}`
    const filepath = join(imageDir, filename)
    const publicPath = `/work-images/${slug}/${filename}`

    await downloadFile(url, filepath)

    return publicPath
  } catch (error) {
    console.error(`   ⚠️ 圖片下載失敗: ${url}`, error.message)
    return null
  }
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http

    const request = protocol.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadFile(response.headers.location, filepath).then(resolve).catch(reject)
        return
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`))
        return
      }

      const file = createWriteStream(filepath)
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
      file.on('error', reject)
    })

    request.on('error', reject)
    request.setTimeout(30000, () => {
      request.destroy()
      reject(new Error('Timeout'))
    })
  })
}

// ============ Helper Functions ============

function getTitle(prop) {
  return prop?.title?.[0]?.plain_text || ''
}

function getText(prop) {
  return prop?.rich_text?.[0]?.plain_text || ''
}

function getSelect(prop) {
  return prop?.select?.name || ''
}

function getDate(prop) {
  return prop?.date?.start || ''
}

function getNumberText(prop) {
  return typeof prop?.number === 'number' ? String(prop.number) : ''
}

function getUrl(prop) {
  return prop?.url || ''
}

function getFileUrl(prop) {
  const file = prop?.files?.[0]
  if (!file) return ''

  if (file.type === 'file') {
    return file.file?.url || ''
  }
  if (file.type === 'external') {
    return file.external?.url || ''
  }
  return ''
}

main().catch((error) => {
  console.error('❌ 同步失敗:', error.message)
  process.exit(1)
})
