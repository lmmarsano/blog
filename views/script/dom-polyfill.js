'use strict'
if (!DOMTokenList.prototype.replace) {
	DOMTokenList.prototype.replace = function replace(oldToken, newToken) {
		if (this.contains(oldToken)) {
			this.remove(oldToken)
			this.add(newToken)
		}
	}
}
