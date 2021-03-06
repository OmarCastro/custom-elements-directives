/**
 * This file tests the following features:
 *
 *    The connectCallback methods of custom elements and directives are executed in the following order:
 *      1. custom element "connectedCallback" method
 *      2. applied directives "connectedCallback" method in left-to-rigth order
 *      3. custom element "directivesConnectedCallback" method
 *
 *    The disconnectedCallback methods of custom elements and directives are executed in the following order:
 *      1. applied directives "disconnectedCallback" method in rigth-to-left order
 *      2. custom element "disconnectedCallback" method
 */

import test from 'tape'
import directiveApi from '..'
const { HTMLElement, customElements, document } = window

const actionsExecuted = Symbol('actionsExecuted')

const CUSTOM_ELEM_CONNECTED_CB = 'custom element connected callback'
const CUSTOM_ELEM_DIRS_CONNECTED_CB = 'custom element directives connected callback'
const CUSTOM_ELEM_DISCONNECTED_CB = 'custom element disconnected callback'
const DIR_CONNECTED_CB = (directiveName) => `directive ${directiveName} connected callback`
const DIR_DISCONNECTED_CB = (directiveName) => `directive ${directiveName} disconnected callback`
const DIR_VALUE_CHANGED_CB = (directiveName) => `directive ${directiveName} value changed`

class ElementWithConnectionCallbacks extends HTMLElement {
  constructor (...args) {
    super(...args)
    this[actionsExecuted] = []
  }

  static get observedAttributes () {
    return ['test-attr']
  }

  attributeChangedCallback (name, oldValue, newValue) {
    switch (name) {
      case 'test-attr':
        break
    }
  }

  connectedCallback () {
    this[actionsExecuted].push(CUSTOM_ELEM_CONNECTED_CB)
  }

  directivesConnectedCallback () {
    this[actionsExecuted].push(CUSTOM_ELEM_DIRS_CONNECTED_CB)
  }

  disconnectedCallback () {
    this[actionsExecuted].push(CUSTOM_ELEM_DISCONNECTED_CB)
  }
}

class TestDirectiveWithName {
  constructor (directiveName) {
    this.directiveName = directiveName
  }

  valueChanged () {
    this.ownerElement[actionsExecuted].push(DIR_VALUE_CHANGED_CB(this.directiveName))
  }

  connectedCallback () {
    this.ownerElement[actionsExecuted].push(DIR_CONNECTED_CB(this.directiveName))
  }

  disconnectedCallback () {
    this.ownerElement[actionsExecuted].push(DIR_DISCONNECTED_CB(this.directiveName))
  }
}

directiveApi.define('x-test-attributes-order', ElementWithConnectionCallbacks)
  .defineDirective('dir1', new TestDirectiveWithName('dir1'))
  .defineDirective('dir2', new TestDirectiveWithName('dir2'))
  .defineDirective('dir3', new TestDirectiveWithName('dir3'))

test('directives extension test - check directive connection callback are called in correct order', t => {
  const elem = document.createElement('x-test-attributes-order')
  elem.setAttribute('dir1', '')
  elem.setAttribute('dir2', '')
  elem.setAttribute('dir3', '')

  document.body.appendChild(elem)

  let expectedExecutedActions = [
    CUSTOM_ELEM_CONNECTED_CB,
    DIR_CONNECTED_CB('dir1'),
    DIR_CONNECTED_CB('dir2'),
    DIR_CONNECTED_CB('dir3'),
    CUSTOM_ELEM_DIRS_CONNECTED_CB
  ]

  t.deepEqual(elem[actionsExecuted], expectedExecutedActions)

  elem.removeAttribute('dir3')

  setTimeout(checkExecutedActions1, 100)

  function checkExecutedActions1 () {
    expectedExecutedActions.push(...[
      DIR_DISCONNECTED_CB('dir3')
    ])

    t.deepEqual(elem[actionsExecuted], expectedExecutedActions, 'checkExecutedActions1')

    elem.setAttribute('dir1', 'value')
    elem.setAttribute('test-attr', 'dir1=value dir2')
    setTimeout(checkExecutedActions2, 100)
  }

  function checkExecutedActions2 () {
    expectedExecutedActions.push(...[
      DIR_VALUE_CHANGED_CB('dir1')
    ])

    t.deepEqual(elem[actionsExecuted], expectedExecutedActions, 'checkExecutedActions2')

    elem.setAttribute('dir1', 'value2')
    elem.setAttribute('dir3', '')
    setTimeout(checkExecutedActions3, 100)
  }

  function checkExecutedActions3 () {
    expectedExecutedActions.push(...[
      DIR_VALUE_CHANGED_CB('dir1'),
      DIR_CONNECTED_CB('dir3')
    ])

    t.deepEqual(elem[actionsExecuted], expectedExecutedActions, 'checkExecutedActions3')

    elem.removeAttribute('dir2')
    setTimeout(checkExecutedActions4, 100)
  }

  function checkExecutedActions4 () {
    expectedExecutedActions.push(...[
      DIR_DISCONNECTED_CB('dir3'),
      DIR_DISCONNECTED_CB('dir2'),
      DIR_CONNECTED_CB('dir3')
    ])

    t.deepEqual(elem[actionsExecuted], expectedExecutedActions, 'checkExecutedActions4')

    document.body.removeChild(elem)

    expectedExecutedActions.push(...[
      DIR_DISCONNECTED_CB('dir3'),
      DIR_DISCONNECTED_CB('dir1'),
      CUSTOM_ELEM_DISCONNECTED_CB
    ])

    t.deepEqual(elem[actionsExecuted], expectedExecutedActions)
    t.end()
  }
})
