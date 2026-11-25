const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

// The Stitch exports are the source of truth for their Tailwind tokens.
function stitchTheme(file) {
  const html = fs.readFileSync(path.join(__dirname, 'src', 'designs', file), 'utf8')
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  const source = scripts.map((match) => match[1]).find((script) => script.includes('tailwind.config'))
  if (!source) throw new Error(`Missing Tailwind theme in ${file}`)
  const context = { tailwind: { config: {} } }
  vm.runInNewContext(source, context)
  return context.tailwind.config
}

const portfolio = stitchTheme('home.html')
const notFound = stitchTheme('not-found.html')
const quotedFont = (fonts) => fonts.map((font) =>
  font.includes(' ') && !font.startsWith('"') ? `"${font}"` : font,
)

module.exports = {
  content: ['./index.html', './src/**/*.{jsx,js,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      ...portfolio.theme.extend,
      colors: {
        ...portfolio.theme.extend.colors,
        ...notFound.theme.extend.colors,
      },
      fontFamily: {
        ...Object.fromEntries(Object.entries(portfolio.theme.extend.fontFamily).map(
          ([name, fonts]) => [name, quotedFont(fonts)],
        )),
        ...notFound.theme.extend.fontFamily,
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/container-queries')],
}
