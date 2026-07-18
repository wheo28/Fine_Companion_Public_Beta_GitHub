// SPA fallback for GitHub Pages: copy the built index.html to 404.html so any
// unknown path (a deep link or a refresh on a nested route) loads the same app
// shell. React Router then renders the intended route from the URL. This keeps
// the existing BrowserRouter route structure unchanged (no hash routing, no
// redirect dance) and works under any configurable base path.
import { copyFile, access } from 'node:fs/promises'
import { join } from 'node:path'

const dist = join(process.cwd(), 'dist')
const index = join(dist, 'index.html')
const fallback = join(dist, '404.html')

try {
  await access(index)
  await copyFile(index, fallback)
  console.log('[copy-404] dist/index.html -> dist/404.html')
} catch (err) {
  console.error('[copy-404] failed:', err.message)
  process.exit(1)
}
