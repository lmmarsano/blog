'use strict'
import './dom-polyfill'
import { instrumentMenu } from './dom-menu'
// progressive enhancement
document.body.classList.replace
('scripting-unavailable', 'scripting-available')
// cancel submissions: no backend
document.addEventListener('submit', onSubmit)
function onSubmit(event) {
	event.preventDefault()
}
// flyout menus
for (let nav of document.querySelectorAll('[aria-haspopup]')) {
	instrumentMenu(nav, { timeLimit: 300 })
}
