'use strict'
import './script/script'
import { EuclidProcess } from './script/euclidean'
import { getTemplate, clearElement } from './script/dom-utility'
import './style/euclidean-algorithm.sss'
import './script/form-validation'

class Demo {
	constructor() {
		// singleton class
		if ('demo' in Demo) {
			return Demo.demo
		}
		Demo.demo = this
		// shorthand access to section, form, input fields, and result slots
		this.cleanField = new Set(['a', 'b'])
		for (let key of [ 'demo'
		                , 'euclideanInput'
		                , 'a'
		                , 'b'
		                , 'results'
		                , 'aValue'
		                , 'bValue'
		                , 'answer'
		                , 'stepCount'
		                , 'euclideanData'
		                ]) {
			this[key] = document.getElementById(key)
		}
		// shorthand access to template slots
		this._step = getTemplate('step')
		for (let key of ['dividend', 'divisor', 'remainder']) {
			this[key] = this._step.querySelector(`.${key}`)
		}
		this._marker = getTemplate('marker').lastChild
	}
	step(modulo) {
		for (let key of ['dividend', 'divisor', 'remainder']) {
			this[key].textContent = modulo[key]
		}
		return this._step.cloneNode(true)
	}
	updateResponse() {
		// respond to user submission
		// detach from DOM
		this.results.remove()
		// set visible
		this.results.removeAttribute('aria-hidden')
		// clear data and get input values
		let data = this.euclideanData = clearElement(this.euclideanData)
		  , a = parseInt(this.a.value)
		  , b = parseInt(this.b.value)
		// fill data container
		for (let modulo of new EuclidProcess(a, b)) {
			data.appendChild(this.step(modulo))
		}
		// and caption
		this.aValue.textContent = a
		this.bValue.textContent = b
		this.answer.textContent = this._marker.textContent = this.divisor.textContent
		this.stepCount.textContent = data.childNodes.length
		// mark answer in data
		let step = data.lastChild
		this.replaceCellContent(step, 'divisor', this._marker)
		if (step = step.previousElementSibling) {
			this.replaceCellContent(step, 'remainder', this._marker)
		}
		// attach to DOM
		this.demo.appendChild(this.results)
	}
	replaceCellContent(step, className, replacement) {
		// replaces content of cell given by className in step
		let cell = step.querySelector(`.${className}`)
		cell.replaceChild
		( replacement.cloneNode(true)
		, cell.lastChild
		)
	}
}
{
	let demo = new Demo
	  , {a, b, cleanField, euclideanInput: form} = demo
	form.addEventListener('focusout', onFocusout)
	form.addEventListener('input', onInput)
	form.addEventListener('submit', onSubmit)
	function onSubmit(event) {
		// allow user to enter in any order
		if (parseInt(b.value) === 0) {
			[a.value, b.value] = [b.value, a.value]
		}
		demo.updateResponse()
	}
	function onFocusout(event) {
		// validate form right after focus leaves input
		// extend Constraints API
		if (event.target.tagName.toLowerCase() === 'input') {
			cleanField.delete(event.target.id)
			if (!cleanField.size) {
				// custom constraint: some field must be non-0
				if ( parseInt(a.value) === 0
				  && parseInt(b.value) === 0
				   ) {
					b.setCustomValidity('Please enter a non-0 integer.')
				}
				this.reportValidity()
			}
		}
	}
	function onInput(event) {
		// clear custom errors when resolved
		if ( event.target.tagName.toLowerCase() === 'input'
		  && b.validity.customError
		  && !( parseInt(a.value) === 0
		     && parseInt(b.value) === 0
		      )
		   ) {
			b.setCustomValidity('')
		}
	}
}
