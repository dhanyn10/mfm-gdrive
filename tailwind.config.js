module.exports = {
  content: [
    "./index.html",
    "./renderer.js",
    "./ui.js",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Ubuntu Mono', 'sans-serif'],
        mono: ['Ubuntu Mono', 'monospace'],
      },
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
}
