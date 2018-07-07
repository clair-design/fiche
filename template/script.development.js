const { resolve } = require('path')
const rimraf = require('rimraf')
const Bundler = require('parcel-bundler')
const pluginMd2vue = require('parcel-plugin-md2vue')
const openInBrowser = require('parcel-bundler/lib/utils/openInBrowser')

const projectBase = process.env.NPM_PREFIX || process.cwd()
const ficheWorkDir = process.env.FICHE_WORK_DIR ||
  resolve(projectBase, '.fiche')

rimraf.sync(resolve(projectBase, '.cache'))
rimraf.sync(resolve(ficheWorkDir, '.development'))

const bundler = new Bundler(resolve(__dirname, './entry.development.html'), {
  target: 'browser',
  cache: true,
  cacheDir: resolve(ficheWorkDir, '.cache'),
  outDir: resolve(ficheWorkDir, '.development'),
  watch: true,
  sourceMaps: true
})
pluginMd2vue(bundler)
const port = 1234
bundler.serve(port).then(() => {
  openInBrowser(`http://localhost:${port}`)
})
