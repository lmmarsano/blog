'use strict'
function getTemplate(id) {
	return document.getElementById(id).content
}
function delegateSelectorHandler(selector) {
	return function delegator(handler) {
		return function selectorHandler(event) {
			if (event.target.matches(selector)) {
				handler(event.target)
			}
		}
	}
}
function delegateClosestHandler(selector) {
	return function delegator(handler) {
		return function closestHandler(event) {
			if (this === event.target.closest(selector)) {
				return handler.call(this, event)
			}
		}
	}
}
function removeChildren(parent) {
	for ( let child
	    ; child = parent.lastChild
	    ; parent.removeChild(child)
	    )
		;
	return parent
}
function clearElement(element) {
	let clone = element.cloneNode(false)
	element.parentElement.replaceChild(clone, element)
	return clone
}
function withDetached(node, action) {
	const parent = node.parentNode
	    , next = node.nextSibling
	parent.removeChild(node)
	let value = action(node)
	if (next) {
		parent.insertBefore(node, next)
	} else {
		parent.appendChild(node)
	}
	return value
}
export { getTemplate, delegateSelectorHandler, delegateClosestHandler, removeChildren, clearElement, withDetached }
