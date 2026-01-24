module.exports = {
  content: [
    "./index.html",
    "./renderer.js",
    "./ui.js",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('flowbite/plugin')
  ],
}
