import plugins from '<%= plugins %>'
import layouts from '<%= layouts %>'

<% documents.forEach(function(doc, index){ %>
import pages<%= index %> from '<%= doc %>'
<% }); %>

const pages = [
<%= documents.map(function(_, index) { return '  pages' + index }).join(',\n') %>
]

function getModule (module) {
  return (module.__esModule && module.default) || module
}

function flattenPages (map, collection, path = '') {
  if (!map || typeof map !== 'object') {
    return
  }

  if ('$$metadata' in map) {
    if (process.env.NODE_ENV === 'production') {
      map.filename = path
    }

    collection.push(map)
  } else {
    for (let key of Object.keys(map)) {
      flattenPages(map[key], collection, path + '/' + key)
    }
  }

  return collection
}

const exports = {
  plugins: [],
  layouts: [],
  routes: []
}

for (let key of Object.keys(plugins)) {
  exports.plugins.push(getModule(plugins[key]))
}

for (let key of Object.keys(layouts)) {
  exports.layouts.push({
    install (Vue) {
      Vue.component(`layout-${key}`, getModule(layouts[key]))
    }
  })
}

const documents = flattenPages(pages, [])
for (let document of documents) {
  // deal with markdown error
  if (document.error instanceof Error) {
    if (process.env.NODE_ENV !== 'production') {
      const { error, stack, message } = document
      console.error(error)
      console.error('Original error message is ——\n', message)
      console.error('Original error stack is ——\n', stack)
    }

    break
  }

  const { route, layout } = document.$$metadata
  const path = route.replace(/^\//, '')
  const [group, name] = path.split('/')
  const isMain = group === 'index' && !name

  exports.routes.push({
    path: isMain ? '/' : `/${path}`,
    component: document,
    meta: { layout }
  })
}

export default exports
