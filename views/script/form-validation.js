'use script'
if (!HTMLFormElement.prototype.reportValidity) {
	HTMLFormElement.prototype.reportValidity = reportValidity
}
function reportValidity() {
	let submit = this
	             .querySelector('button:not([type=button]),[type=submit]')
	if (submit) {
		submit.click()
	}
}
