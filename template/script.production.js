const { resolve } = require('path')
const rimraf = require('rimraf')
const Bundler = require('parcel-bundler')
const request = require('request-promise')
const { writeFile, ensureFile } = require('fs-extra')

const express = require('express')
const { createRenderer } = require('vue-server-renderer')

const projectBase = process.env.NPM_PREFIX || process.cwd()
const ficheWorkDir = process.env.ficheWORK_DIR ||
  resolve(projectBase, '.fiche')
const outputDir = process.env.ficheOUTPUT_DIR ||
  resolve(projectBase, 'docs')

rimraf.sync(outputDir)

const entry = `main.${Date.now().toString(16)}`

bundle({
  name: entry,
  target: 'node',
  output: resolve(ficheWorkDir, '.production')
}).then(() => {
  const server = express()
  const renderer = createRenderer({
    template: '<!--vue-ssr-outlet-->'
  })

  const { createApp, routes } = require(
    resolve(__dirname, `./.production/${entry}.js`)
  )

  // for debugging
  // server.use(express.static('.production'))

  server.get('*', (req, res) => {
    res.set('Content-Type', 'text/html')

    const { app, router } = createApp()
    router.push(req.url)
    router.onReady(() => {
      if (!router.getMatchedComponents().length) {
        return res.status(404).end('<pre>Not found</pre>')
      }

      renderer.renderToString(app, (err, html) => {
        if (err) {
          console.log(err)
          return res.status(500).end(`<pre>${err.stack}</pre>`)
        }
        res.end(renderHTML(html, app.$meta().inject(), entry))
      })
    })
  })

  server.listen(8080)

  // start server rendering
  const promises = []
  for (let path of routes.map(r => r.path)) {
    const url = `http://127.0.0.1:8080${path}`
    const dest = `${outputDir}/${path}/index.html`
    const p = request(url).then(resp => ensureFile(dest)
      .then(() => writeFile(dest, resp))
    )
    promises.push(p)
  }

  promises.push(
    bundle({
      name: entry,
      target: 'browser',
      output: outputDir
    }).then(() => {
      rimraf.sync(resolve(ficheWorkDir, '.production'))
    })
  )

  Promise.all(promises).then(() => process.exit())
})

function bundle ({
  name,
  target,
  output
}) {
  const entry = resolve(__dirname, './entry.production.js')
  return new Bundler(entry, {
    target,
    cache: false,
    outDir: output,
    outFile: `${name}.js`,
    minify: true,
    sourceMaps: false,
    watch: false
  }).bundle()
}

function renderHTML (content, injection, entry) {
  const {
    title, htmlAttrs, bodyAttrs,
    meta, link, style, script, noscript
  } = injection
  const arr = [link, style, script, noscript, meta]

  return `<!doctype html>
<html data-vue-meta-server-rendered ${htmlAttrs.text()}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="ie=edge">
${title.text()}
<link rel="stylesheet" href="/${entry}.css">
${arr.map(it => it.text()).join('')}
</head><body ${bodyAttrs.text()}>${content}${script.text({ body: true })}
<script src="/${entry}.js"></script>
</body>
</html>`
}
