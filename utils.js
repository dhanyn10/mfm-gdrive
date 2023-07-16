// utility
/**
 * @param {string | null} elem input, checkbox, etc
 * @param {string | null} [attr=null] attribute
 * @param {string | null} [attrvalue=null] value for the attribute
 * @param {string | null} [className=null] list of class for the element
 * @param {string | null} [innerHTML=null] any html inside the element
 * @param {string | null} [value=null] set value
 * @param {string | Array} [child=null] children for the element, will inserted based on it's queue
 */
export function elemFactory(
  elem,
  attr=null,
  attrvalue=null,
  className=null,
  value=null,
  innerHTML=null,
  child=null) {

  const factory = document.createElement(elem)
  factory.setAttribute(attr, attrvalue)
  factory.className = className
  factory.value = value
  factory.innerHTML = innerHTML
  if(child != null) {
      if(Array.isArray(child)) {
      for(let b = 0; b < child.length; b++) {
          factory.appendChild(child[b])
      }
      } else
      factory.appendChild(child)
  }
  return factory
}