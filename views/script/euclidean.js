'use strict'
// error to throw for function calls with arguments outside its domain
class InvalidArgumentError extends Error {
	constructor(message, args) {
		super(message)
		this.name = 'InvalidArgumentError'
		this.arguments = args
	}
}
// members of the modulo (%) graph
class Modulo {
	constructor(a, b) {
		Object.assign
		( this
		, { dividend: a
		  , divisor: b
		  , remainder: a % b
		  }
		)
	}
}
/* iterable Euclidean process for the greatest common divisor of a & b
beginning with i = 0, each term in the sequence is a Modulo(r(i), r(i + 1)) instance where
- r(0) = a
- r(1) = b
- Modulo(r(i), r(i + 1)).remainder = r(i + 2) unless r(i + 1) = 0
*/
class EuclidProcess {
	constructor(a, b) {
		if (b === 0) {
			if(a === 0) {
				throw new InvalidArgumentError('a non-0 argument is required', arguments)
			}
			[b, a] = [a, b]
		}
		this.modulo = new Modulo(a, b)
	}
	*[Symbol.iterator]() {
		let value
		for ( value = this.modulo
		    ; value.remainder
		    ; value = new Modulo(value.divisor, value.remainder)
		    ) {
			yield value
		}
		yield value
	}
}
// static method: check input from forms
EuclidProcess.IsValidInput = function IsValidInput(a, b) {
	return (a || b)
	    && isFinite(a)
	    && isFinite(b)
}
export { InvalidArgumentError, Modulo, EuclidProcess }
