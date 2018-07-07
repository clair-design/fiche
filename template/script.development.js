const { resolve } = require('path')
const rimraf = require('rimraf')
const Bundler = require('parcel-bundler')
const openInBrowser = require('parcel-bundler/lib/utils/openInBrowser')

const projectBase = process.env.NPM_PREFIX || process.cwd()
const ficheWorkDir = process.env.FICHE_WORK_DIR ||
  resolve(projectBase, '.fiche')

rimraf.sync(resolve(projectBase, '.cache'))
rimraf.sync(resolve(ficheWorkDir, '.development'))

const bundler = new Bundler(resolve(__dirname, './entry.development.html'), {
  target: 'browser',
  cache: true,
  outDir: resolve(ficheWorkDir, '.development'),
  watch: true
})
const port = 1234
bundler.serve(port).then(() => {
  openInBrowser(`http://localhost:${port}`)
})
