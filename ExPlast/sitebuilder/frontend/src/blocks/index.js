import * as text from './text.js'
import * as image from './image.js'
import * as header from './header.js'
import * as button from './button.js'

const registry = { text, image, header, button }

export function create(type) {
  const mod = registry[type]
  return mod ? mod.create() : null
}
