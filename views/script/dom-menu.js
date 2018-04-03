'use strict'
import { delegateClosestHandler } from './dom-utility'
const closestExpanderHandler = delegateClosestHandler('[aria-expanded]')
    , cancelCollapse = closestExpanderHandler
/* accessible fly-out menus
   mouse automatically causes expansion
   keyboard manually controls expansion, so the user can defer submenu traversal */
( function cancel(event) {
	clearTimeout(this.focusTimeout)
}
)
    , initiateCollapse = closestExpanderHandler
( function initiate(event) {
	this.focusTimeout = setTimeout
	( () => this.setAttribute('aria-expanded', 'false')
	  , this.timeLimit
	)
}
)
    , toggleExpand = closestExpanderHandler
( function toggle(event) {
	this.setAttribute
	( 'aria-expanded'
	, this.getAttribute('aria-expanded').toLowerCase() === 'false'
	? 'true'
	: 'false'
	)
}
)
    , affirmExpand = closestExpanderHandler
( function affirm(event) {
	clearTimeout(this.focusTimeout)
	this.setAttribute('aria-expanded', 'true')
}
)
function instrumentMenu(nav, options) {
	/* attach event handlers for fly-out menus
	   options.timeLimit controls collapse delay (fine-motor accessibility) */
	Object.assign(nav, options)
	nav.addEventListener
	('mouseover', affirmExpand)
	nav.addEventListener
	('mouseout', initiateCollapse)
	nav.addEventListener
	('click', toggleExpand)
	nav.addEventListener
	('focusout', initiateCollapse)
	nav.addEventListener
	('focusin', cancelCollapse)
}
export { instrumentMenu }
