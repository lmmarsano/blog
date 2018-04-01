'use strict'
import './dom-polyfill'
// cancel submissions: no backend
document.addEventListener('submit', onSubmit)
function onSubmit(event) {
	event.preventDefault()
}
// progressive enhancement
document.body.classList.replace
('scripting-unavailable', 'scripting-available')
