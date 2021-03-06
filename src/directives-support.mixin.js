import parseAttributeValue from './parser'
import { reloadDirectives, initializeDirectives, finalizeDirectives, isDirectivesReloadEnabledOnElement } from './directives-management'

function getParsedAttributesList (targetAttributeValue) {
  return targetAttributeValue ? parseAttributeValue(targetAttributeValue) : []
}

export default function addDirectivesSupport (targetElementClass, targetAttributeName) {
  const definedDirectives = {}

  class classWithDirectivesSupport extends targetElementClass {
    static get definedDirectives () {
      return Object.assign({}, definedDirectives)
    }

    static defineDirective (directiveName, directivePrototype) {
      if (typeof directiveName !== 'string') {
        throw Error('expected directive name to be a string')
      } if (directivePrototype == null) {
        throw Error('expected directive prototype to be an non null object')
      } else if (definedDirectives[directiveName] != null) {
        throw Error(`directive ${directiveName} is already defined, cannot redefine directives`)
      }
      definedDirectives[directiveName] = directivePrototype
      return this
    }

    static get observedAttributes () {
      if (Array.isArray(super.observedAttributes)) {
        return [targetAttributeName].concat(super.observedAttributes)
      } else {
        return [targetAttributeName]
      }
    }

    attributeChangedCallback (name, oldValue, newValue) {
      switch (name) {
        case targetAttributeName:
          if (isDirectivesReloadEnabledOnElement(this)) {
            reloadDirectives(this, getParsedAttributesList(newValue), definedDirectives)
          }
          break
        default:
          if (typeof super.attributeChangedCallback === 'function') {
            super.attributeChangedCallback(name, oldValue, newValue)
          }
          break
      }
    }

    disconnectedCallback () {
      finalizeDirectives(this)
      if (typeof super.disconnectedCallback === 'function') {
        super.disconnectedCallback()
      }
    }

    connectedCallback () {
      if (typeof super.connectedCallback === 'function') {
        super.connectedCallback()
      }
      const parsedAttributeList = getParsedAttributesList(this.getAttribute(targetAttributeName))
      initializeDirectives(this, parsedAttributeList, definedDirectives)
      if (typeof super.directivesConnectedCallback === 'function') {
        super.directivesConnectedCallback()
      }
    }
  }

  Object.defineProperty(classWithDirectivesSupport, 'name', { value: targetElementClass.name })
  return classWithDirectivesSupport
}
