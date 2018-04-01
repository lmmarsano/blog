'use script'
if (!HTMLFormElement.prototype.reportValidity) {
	HTMLFormElement.prototype.reportValidity = reportValidity
}
function reportValidity() {
	// polyfill
	const submit = this
	               .querySelector('button:not([type=button]),[type=submit]')
	if (submit) {
		submit.click()
	}
}
function onInvalidAria(event) {
	/* expose error message to ARIA
	   register to invalid events on forms via capture */
	const target = event.target
	setAriaErrorMessage(target)
	target.setAttribute('aria-invalid', 'true')
}
function tryUnsetAriaInvalid(event) {
	/* recheck validity to remedy invalid state
	   register to input or change events on submittable elements */
	const target = event.target
	if ( target.hasAttribute('aria-invalid')
	  && target.checkValidity()
	   ) {
		target.removeAttribute('aria-invalid')
		setAriaErrorMessage(target)
	}
}
function setAriaErrorMessage(target) {
	// synchronize any ARIA error messages with validation message from constraint API
	if (target.hasAttribute('aria-errormessage')) {
		document.getElementById
		(target.getAttribute('aria-errormessage'))
		.textContent = target.validationMessage
	}
}
export { onInvalidAria, tryUnsetAriaInvalid }
