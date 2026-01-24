module.exports = {
  content: [
    "./index.html",
    "./renderer.js",
    "./ui.js",
    "./node_modules/flowbite/**/*.js"
  ],
  safelist: [
    'bg-opacity-50',
    'dark:bg-opacity-80'
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('flowbite/plugin')
  ],
}
