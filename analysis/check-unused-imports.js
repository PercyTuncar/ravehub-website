const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git', 'public', 'analysis'].includes(entry.name)) continue
      files.push(...walk(full))
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(full)
    }
  }
  return files
}

const files = walk(root)

const importRegex = /^\s*import\s+(.+)\s+from\s+['"](.+)['"];?/gm
const importAllRegex = /^\s*import\s+['"](.+)['"];?/gm
const requireRegex = /const\s+([a-zA-Z0-9_]+)\s*=\s*require\(['\"](.+)['\"]\)/gm

function parseImports(content) {
  const imports = []
  let m
  while ((m = importRegex.exec(content)) !== null) {
    const spec = m[1].trim()
    const source = m[2]
    // default and named
    if (/^\*/.test(spec)) {
      imports.push({ raw: spec, names: ['*'], source })
    } else if (/^{/.test(spec)) {
      const names = spec.replace(/^{|}$/g, '').split(',').map(s => s.split(' as ')[0].trim())
      imports.push({ raw: spec, names, source })
    } else if (/,/.test(spec)) {
      const parts = spec.split(',').map(s => s.trim())
      const defaultName = parts[0]
      const named = (parts[1] || '').replace(/^{|}$/g, '').split(',').map(s => s.split(' as ')[0].trim()).filter(Boolean)
      imports.push({ raw: spec, names: [defaultName, ...named], source })
    } else {
      imports.push({ raw: spec, names: [spec], source })
    }
  }

  while ((m = importAllRegex.exec(content)) !== null) {
    const source = m[1]
    imports.push({ raw: null, names: ['<side-effect>'], source })
  }

  while ((m = requireRegex.exec(content)) !== null) {
    const name = m[1]
    const source = m[2]
    imports.push({ raw: null, names: [name], source })
  }

  return imports
}

function isUsed(name, content, importLine) {
  if (!name || name === '<side-effect>') return true
  // If name is default like React, JSX uses it implicitly; consider React used
  if (name === 'React' || name === 'Fragment') return true
  // strip import line occurrences
  const withoutImports = content.replace(importRegex, '').replace(importAllRegex, '').replace(requireRegex, '')
  // simple word boundary search
  const re = new RegExp('\\b' + name.replace(/[-\\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'g')
  return re.test(withoutImports)
}

const results = []

for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf8')
    const imports = parseImports(content)
    const unused = []
    for (const imp of imports) {
      for (const name of imp.names) {
        if (!isUsed(name, content)) {
          unused.push({ name, source: imp.source })
        }
      }
    }
    if (unused.length > 0) {
      results.push({ file: path.relative(root, file), unused })
    }
  } catch (err) {
    console.error('Error reading', file, err.message)
  }
}

const outPath = path.join(root, 'analysis', 'unused-imports.json')
fs.writeFileSync(outPath, JSON.stringify(results, null, 2))
console.log('Scan complete. Results written to', outPath)
