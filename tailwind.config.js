module.exports = {
  content: [
    "./index.html",
    "./renderer.js",
    "./ui.js",
    "./ui/components.js",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['"Ubuntu Mono"', 'monospace'],
      },
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
}
