const assert = require('assert')
const { promisify } = require('util')
const {
  join,
  resolve,
  relative,
  extname,
  basename
} = require('path')

const glob = require('glob')
const loadYML = require('js-yaml').safeLoad
const findNPMPrefix = require('find-npm-prefix')
const {
  copyFile,
  writeFile,
  ensureDir,
  readFileSync
} = require('fs-extra')

const renderFile = promisify(require('ejs').renderFile)

/**
 * helper function
 * run promises
 */
const series = fns => fns
  .reduce(
    (p, fn) => p.then(fn),
    Promise.resolve(null)
  )

/**
 * simple util to check whether the
 * providing object is a plain object
 */
const { getPrototypeOf } = Object
const objectProto = getPrototypeOf({})
const isPlainObject = o => !!o && getPrototypeOf(o) === objectProto

// an util function
const isNotEmptyString = s => !!s && typeof s === 'string'

// npm prefix: usually the root/base of your project
const setPrefixEnv = () => findNPMPrefix(process.cwd())
  .then(prefix => (process.env.NPM_PREFIX = prefix))

/**
 * load project configuration file
 */
const loadConfig = () => {
  try {
    const file = resolve(process.env.NPM_PREFIX, './fiche.yaml')
    return loadYML(readFileSync(file, 'utf-8'))
  } catch (e) {
    return e
  }
}

/**
 * validate configuration fields
 */
const validateConfig = data => {
  if (data instanceof Error) {
    throw data
  }

  assert(isPlainObject(data), 'Invalid configuration data.')

  const { layouts, plugins, styles } = data
  data.styles = [].concat(styles)
  data.output = data.output || 'docs'

  assert(isNotEmptyString(layouts), '`.layouts`: non-null string required')
  assert(isNotEmptyString(plugins), '`.plugins`: non-null string required')
  assert(isNotEmptyString(data.output), '`.output`: non-null string required')

  for (let field of ['styles', 'documents']) {
    const arr = data[field]
    const cond = Array.isArray(arr) && arr.length
    assert(cond, `\`.${field}\`: non-null array required`)

    for (let i = 0; i < arr.length; i++) {
      const item = arr[i]
      assert(isNotEmptyString(item), `\`.${field}[${i}]\`: non-null string required`)
    }
  }

  const workingDir = resolve(process.env.NPM_PREFIX, '.fiche')
  const outputDir = resolve(process.env.NPM_PREFIX, data.output)
  const r2wd = p => relative(workingDir, p)

  return {
    outputDir,
    workingDir,
    layouts: r2wd(layouts),
    plugins: r2wd(plugins),
    styles: data.styles.map(r2wd),
    documents: data.documents.map(r2wd)
  }
}

/**
 * ensure directory where to copy files to
 */
const ensureWorkingDir = config => {
  return ensureDir(config.workingDir)
    .then(() => {
      process.env.FICHE_WORK_DIR = config.workingDir
      process.env.FICHE_OUTPUT_DIR = config.outputDir
      return config
    })
}

const renderTemplates = config => {
  const dest = config.workingDir
  const tpls = resolve(__dirname, './template/*.tpl')
  const others = resolve(__dirname, './template/!(*.tpl)')

  const p1 = glob.sync(tpls)
    .map(tpl => {
      const rname = basename(tpl, extname(tpl))
      return renderFile(tpl, config)
        .then(result => writeFile(join(dest, rname), result))
    })

  const p2 = glob.sync(others)
    .map(file => copyFile(file, join(dest, basename(file))))

  return Promise.all(p1.concat(p2)).then(() => config)
}

module.exports = function (config) {
  process.env.NODE_ENV =
    process.env.NODE_ENV === 'production'
      ? 'production' : 'development'

  series([
    setPrefixEnv,
    !config ? loadConfig : () => config,
    validateConfig,
    ensureWorkingDir,
    renderTemplates,
    config => {
      require(resolve(config.workingDir, `script.${process.env.NODE_ENV}.js`))
    }
  ])
  .catch(console.log)
}
