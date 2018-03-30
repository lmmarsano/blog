'use strict'
function getTemplate(id) {
	return document.getElementById(id).content
}
function delegateHandler(selector, handler) {
	return function tagNameHandler(event) {
		if (event.target.matches(selector)) {
			handler(event.target)
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
export {getTemplate, delegateHandler, removeChildren, clearElement}
