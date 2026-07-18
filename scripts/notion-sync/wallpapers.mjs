import { Client } from '@notionhq/client'
import { writeFileSync, mkdirSync, existsSync, createWriteStream, rmSync, readFileSync } from 'fs'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'
import https from 'https'
import http from 'http'

/**
 * 從 Notion 的 Wallpapers 資料庫同步手機桌布到網站。
 *
 * Notion 欄位（資料庫：Wallpapers）：
 * - Name（標題）、Status（選項，Published 才同步）
 * - Date（日期，排序用，新的在前）
 * - Mockup（Files，帶手機外框的預覽圖，縮圖與大圖都用這張）
 * - Image（Files，下載用的純桌布圖，不含外框）
 *
 * 執行：npm run sync（需要 .env 內的 NOTION_API_KEY、NOTION_WALLPAPERS_DATABASE_ID）
 * 沒有設定 NOTION_WALLPAPERS_DATABASE_ID 時會直接略過，不影響作品同步。
 */

const __dirname = dirname(fileURLToPath(import.meta.url))
const WALLPAPERS_FILE = join(__dirname, '../../src/wallpapers.generated.js')
const IMAGE_DIR = join(__dirname, '../../public/wallpaper-images')
const MANIFEST_FILE = join(__dirname, '../../.synced-wallpapers.json')

const notion = new Client({ auth: process.env.NOTION_API_KEY })

async function main() {
  if (!process.env.NOTION_WALLPAPERS_DATABASE_ID) {
    console.log('ℹ️  未設定 NOTION_WALLPAPERS_DATABASE_ID，略過桌布同步')
    return
  }
  if (!process.env.NOTION_API_KEY) {
    console.error('❌ 缺少 NOTION_API_KEY，請確認專案根目錄的 .env')
    process.exit(1)
  }

  console.log('🔍 正在從 Notion 獲取桌布...')

  const syncedWallpapers = loadManifest()

  const response = await notion.databases.query({
    database_id: process.env.NOTION_WALLPAPERS_DATABASE_ID,
    filter: {
      property: 'Status',
      select: { equals: 'Published' }
    }
  })

  console.log(`🖼️  找到 ${response.results.length} 張已發布桌布\n`)

  const usedSlugs = new Set()
  const wallpapers = []

  for (const page of response.results) {
    const props = page.properties
    const title = getTitle(props.Name)
    const slug = uniqueSlug(title || page.id, usedSlugs)

    console.log(`📝 處理: ${title || '(未命名)'} (${slug})`)

    const mockupUrl = getFileUrl(props.Mockup)
    const imageUrl = getFileUrl(props.Image)

    if (!mockupUrl || !imageUrl) {
      console.log(`   ⚠️ 跳過：缺少 ${!mockupUrl ? 'Mockup' : 'Image'} 圖片`)
      continue
    }

    const mockup = await downloadImage(mockupUrl, slug, 'mockup')
    const image = await downloadImage(imageUrl, slug, 'image')

    if (!mockup || !image) {
      console.log('   ⚠️ 圖片下載失敗，跳過')
      continue
    }

    wallpapers.push({
      slug,
      title,
      date: getDate(props.Date),
      mockup,
      image
    })

    usedSlugs.add(slug)
    syncedWallpapers.add(slug)
    console.log('   ✅ 完成\n')
  }

  // 依日期排序，新的在前（沒填 Date 的排最後）
  wallpapers.sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return b.date.localeCompare(a.date)
  })

  const fileContent = `// 此檔案由 npm run sync 從 Notion 自動產生，請勿手動編輯。
// 桌布的新增與修改請到 Notion 的 Wallpapers 資料庫操作。
export const WALLPAPERS = ${JSON.stringify(wallpapers, null, 2)}
`
  writeFileSync(WALLPAPERS_FILE, fileContent)
  console.log(`✅ 已寫入: src/wallpapers.generated.js（共 ${wallpapers.length} 張桌布）`)

  const publishedSlugs = wallpapers.map((w) => w.slug)
  const { deletedCount, updatedSyncedWallpapers } = cleanupUnpublished(publishedSlugs, syncedWallpapers)
  if (deletedCount > 0) {
    console.log(`🗑️  已刪除 ${deletedCount} 張取消發布桌布的圖片`)
  }

  saveManifest(updatedSyncedWallpapers)
  console.log('✨ 桌布同步完成！')
}

// ============ Slug 產生 ============

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function uniqueSlug(title, usedSlugs) {
  const base = slugify(title) || 'wallpaper'
  let slug = base
  let n = 2
  while (usedSlugs.has(slug)) {
    slug = `${base}-${n}`
    n++
  }
  return slug
}

// ============ Manifest 管理 ============

function loadManifest() {
  try {
    if (existsSync(MANIFEST_FILE)) {
      const data = JSON.parse(readFileSync(MANIFEST_FILE, 'utf-8'))
      return new Set(data.syncedWallpapers || [])
    }
  } catch {
    console.log('⚠️ 無法讀取 manifest，將建立新的')
  }
  return new Set()
}

function saveManifest(syncedWallpapers) {
  const data = {
    lastSync: new Date().toISOString(),
    syncedWallpapers: [...syncedWallpapers]
  }
  writeFileSync(MANIFEST_FILE, JSON.stringify(data, null, 2))
}

// ============ 清理功能 ============

function cleanupUnpublished(publishedSlugs, syncedWallpapers) {
  let deletedCount = 0
  const updatedSyncedWallpapers = new Set(syncedWallpapers)

  for (const slug of syncedWallpapers) {
    if (!publishedSlugs.includes(slug)) {
      console.log(`🗑️  刪除取消發布的桌布圖片: ${slug}`)
      const imageDir = join(IMAGE_DIR, slug)
      if (existsSync(imageDir)) {
        rmSync(imageDir, { recursive: true })
      }
      updatedSyncedWallpapers.delete(slug)
      deletedCount++
    }
  }

  return { deletedCount, updatedSyncedWallpapers }
}

// ============ 圖片處理 ============

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
    // 縮圖路徑不帶開頭斜線，前端以 BASE + path 組合
    const publicPath = `wallpaper-images/${slug}/${filename}`

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

function getDate(prop) {
  return prop?.date?.start || ''
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
  console.error('❌ 桌布同步失敗:', error.message)
  process.exit(1)
})
