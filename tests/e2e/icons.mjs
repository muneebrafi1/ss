/** Screenshots the icon gallery in both themes for visual QA. */
import { chromium } from 'playwright'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
})
const page = await browser.newPage({ viewport: { width: 1180, height: 900 } })
await page.goto(`file://${root}/screenshots/icon-gallery.html`)
await page.waitForTimeout(600)
await page.screenshot({ path: `${root}/screenshots/icons-light.png`, fullPage: true })
await page.evaluate(() => document.body.classList.add('dark'))
await page.waitForTimeout(300)
await page.screenshot({ path: `${root}/screenshots/icons-dark.png`, fullPage: true })
await browser.close()
console.log('wrote screenshots/icons-light.png and icons-dark.png')
