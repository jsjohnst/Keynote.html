if (!Function.prototype.bind) {
	Function.prototype.bind = function (oThis) {
		// closest thing possible to the ECMAScript 5 internal IsCallable
		// function 
		if (typeof this !== "function") {
			throw new TypeError("Function.prototype.bind - what is trying to be fBound is not callable");
		}
    
    	var aArgs = Array.prototype.slice.call(arguments, 1),
        	fToBind = this,
        	fNOP = function () {},
        	fBound = function () {
          				return fToBind.apply( this instanceof fNOP ? this : oThis || window,
                 			aArgs.concat(Array.prototype.slice.call(arguments)));
        			 };

    	fNOP.prototype = this.prototype;
    	fBound.prototype = new fNOP();

    	return fBound;
	};
}

NodeList.prototype.forEach = function(fun) {
	if (typeof fun !== "function") throw new TypeError();
	for (var i = 0; i < this.length; i++) {
		fun.call(this, this[i]);
	}
};

HTMLElement.prototype.$ = function HTMLElement_$(aQuery) {
	return this.querySelector(aQuery);
};

HTMLElement.prototype.$$ = function HTMLElement_$$(aQuery) {
	return this.querySelectorAll(aQuery);
};

HTMLElement.prototype.set = function HTMLElement_set(flag) {
	flag = flag || 'aria-selected';
	this.setAttribute(flag, true);
};

HTMLElement.prototype.unset = function HTMLElement_unset(flag) {
	flag = flag || 'aria-selected';
	this.removeAttribute(flag);
};

var $ = (HTMLElement.prototype.$).bind(document);
var $$ = (HTMLElement.prototype.$$).bind(document);