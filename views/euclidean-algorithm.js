'use strict'
import './script/script'
import { EuclidProcess } from './script/euclidean'
import { getTemplate, clearElement } from './script/dom-utility'
import './style/euclidean-algorithm.sss'

class Demo {
	constructor() {
		// singleton class
		if ('demo' in Demo) {
			return Demo.demo
		}
		// shorthand access to template slots
		Demo.demo = this
		this.demo = clearElement(document.getElementById('demo'))
		this.demo.appendChild(getTemplate('demoContent'))
		this.form = document.querySelector('#demo form')
		this.a = document.getElementById('a')
		this.b = document.getElementById('b')
		this.dirtyField = new Set
		this._step = getTemplate('step').lastElementChild
		for (let key of ['dividend', 'divisor', 'remainder']) {
			this[key] = this._step.querySelector(`.${key}`)
		}
		this.marker = getTemplate('marker').lastElementChild
		this.caption = getTemplate('caption')
		this.captionAnswer = this.caption.querySelector('.answer')
		this.captionA = this.caption.querySelector('.a-value')
		this.captionB = this.caption.querySelector('.b-value')
		this.captionStepCount = this.caption.querySelector('.step-count')
	}
	step(modulo) {
		for (let key of ['dividend', 'divisor', 'remainder']) {
			this[key].textContent = modulo[key]
		}
		return this._step.cloneNode(true)
	}
	updateResponse() {
		// respond to user submission
		// clear data or attach new data container
		if (this.response) {
			this.data = clearElement(this.data)
		} else {
			this.demo.appendChild(getTemplate('response'))
			this.response = document.getElementById('euclidean-process')
			this.data = document.getElementById('euclidean-data')
			this.answer = document.getElementById('euclidean-answer')
		}
		// fill data container
		let data = document.createDocumentFragment()
		  , a = this.a.valueAsNumber
		  , b = this.b.valueAsNumber
		for (let modulo of new EuclidProcess(a, b)) {
			data.appendChild(this.step(modulo))
		}
		// and caption
		this.captionA.textContent = a
		this.captionB.textContent = b
		this.captionAnswer.textContent = this.marker.textContent = this.divisor.textContent
		this.captionStepCount.textContent = data.childElementCount
		// mark answer in data
		let step = data.lastElementChild
		this.replaceCellContent(step, 'divisor', this.marker)
		if (step = step.previousElementSibling) {
			this.replaceCellContent(step, 'remainder', this.marker)
		}
		// attach data
		this.data.appendChild(data)
		// and caption
		this.answer = clearElement(this.answer)
		this.answer.appendChild(this.caption.cloneNode(true))
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
	  , {a, b, dirtyField, form} = demo
	form.addEventListener('focusout', onFocusout)
	form.addEventListener('submit', onSubmit)
	function onSubmit(event) {
		// allow user to enter in any order
		if (b.valueAsNumber === 0) {
			[a.valueAsNumber, b.valueAsNumber] = [b.valueAsNumber, a.valueAsNumber]
		}
		demo.updateResponse()
	}
	function onFocusout(event) {
		// validate form right after focus leaves input
		// extend Constraints API
		if (event.target.tagName.toLowerCase() === 'input') {
			dirtyField.add(event.target.id)
			if ( dirtyField.has('a')
			  && dirtyField.has('b')
			   ) {
				// special constraint: some field must be non-0
				if ( EuclidProcess.IsValidInput
				     (a.valueAsNumber, b.valueAsNumber)
				   ) {
					b.setCustomValidity('')
				} else {
					b.setCustomValidity('Please enter a non-0 integer.')
				}
			}
			this.reportValidity()
		}
	}
}
