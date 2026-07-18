export const BASE = import.meta.env.BASE_URL

// 作品資料來自 Notion（npm run sync 產生），見 works.generated.js
export { WORKS } from './works.generated'

export const FILTERS = [
  { key: 'client', label: 'CLIENT WORK' },
  { key: 'personal', label: 'PERSONAL WORK' },
]

// 價目表資料：接案品項先放示意內容，之後直接改這個陣列即可
export const PRICING = [
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
