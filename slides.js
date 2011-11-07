var slides = (function() {
	var currentSlideIndex = 0;
	var currentStepIndex = 0;
	var popup = null;

	function updateState(slide, step) {
		var previousSlideIndex = currentSlideIndex;
		var previousStepIndex = currentStepIndex;
	
		if(typeof slide == "undefined") {
			currentSlideIndex = 0;
			currentStepIndex = 0;
		} else {
			if(slide == null) {
				if(typeof step == "undefined") {
					currentSlideIndex += 1;
					currentStepIndex = 0;
					previousStepIndex = 0; // since the previous step was on a different slide, ignore
				} else {
					if(step == null) {
						currentStepIndex += 1;
					} else {
						currentStepIndex = Number(step);
					}
				}
			} else {
				currentSlideIndex = Number(slide);
				currentStepIndex = Number(step) || 0;
				if(previousSlideIndex != currentSlideIndex) {
					previousStepIndex = currentStepIndex; // since the previous step was on a different slide, ignore
				}
			}
		}
	
		if(previousSlideIndex != currentSlideIndex) {
			previousSlideIndex && callEventHandlers('unload', previousSlideIndex);
			currentSlideIndex && !currentStepIndex && callEventHandlers('load', currentSlideIndex, { 'slide': currentSlideIndex, 'step': currentStepIndex });
		} else {
			if(previousStepIndex != currentStepIndex) {
				currentSlideIndex && callEventHandlers('build', currentSlideIndex, { 'slide': currentSlideIndex, 'step': currentStepIndex });
			}
		}
		
		sendNotification("SET_SLIDE", { 'slide': currentSlideIndex, 'step': currentStepIndex });
	}

	function persistState() {
		window.history.pushState({ 'slide': currentSlideIndex, 'step': currentStepIndex }, "", "#/slide-" + currentSlideIndex + "_" + currentStepIndex + ".html");
	}

	function callEventHandlers(eventName, slideIndex, payload) {
		var slide = $('body > section:nth-of-type(' + slideIndex + ')');
		if(slide) {
			var scope = slide.getAttribute('data-eventscope') || window;
			var func = slide.getAttribute('data-on' + eventName);
			if(func) {
				try {
					scope[func] && scope[func].call && scope[func].call(scope, eventName, payload);
				} catch(e) {
					console.log("Caught exception when trying to invoke '" + eventName + "' handler for slide #" + slideIndex);
					console.log(e);
				}
			}
		
			var autoplay = slide.getAttribute('data-autoplay');
			// check if autoplay was provided and evaluates to false, if not, auto play audio/video elements
			if(autoplay != "false" && autoplay != "0") {
				var video = slide.$("video");
				if(video) {
					video[eventName == "unload" ? "pause" : "play"]();
				}
			
				var audio = slide.$("audio");
				if(audio) {
					audio[eventName == "unload" ? "pause" : "play"]();
				}
			} 
		}
	}

	function setMode(mode) {
		switch(mode) {
			case 'presentation': 
				$('body').className = 'presentation';
				resizeHandler();
				break;
			case 'presenter':
				setScale(1.0);
				$('body').className = 'presenter';
				openSubWindow();
				break;
			case 'overview':
			default:
				setScale(1.0);
				updateState(0,0);
				$('body').className = 'overview';
				$$('*[aria-selected]').forEach(function(el) {
					el.unset('aria-selected');
				});
				popup && popup.close();
				break;
		}
	}

	/* Sets/Advances slides in a presentation
	 *
	 * slideIndex (int|optional) - 1 based index of slide to show, if null/undefined, advance to next slide
	 * stepIndex (int|optional) - 1 based index of step in buildout to show, if null/undefined, advance to next step
	 */
	function setSlide(slideIndex, stepIndex) {			
		if(slideIndex) {
			// if a slide was provided, try to see if it exists
			var slide = $('body > section:nth-of-type(' + slideIndex + ')');
			if(slide) {
				// if it does, unset any other slide/buildout from being selected
				$$('*[aria-selected]').forEach(function(el) {
					el.unset('aria-selected');
				});
				slide.set('aria-selected');
			
				if(stepIndex) {
					// a step was provided, check if there is any buildouts
					var buildout = slide.$('.buildout');
					if(buildout) {
						buildout.set('aria-selected');
						var step = buildout.$('*:nth-of-type(' + stepIndex + ')');
						if(step) {
							// unset any other steps as selected, then set the one found
							buildout.$$('*[aria-selected]').forEach(function(el) {
								el.unset('aria-selected');
							});
							step.set('aria-selected');
							updateState(slideIndex, stepIndex);
						} else { // if(step)
							// stepIndex was out of range, so just select the first step
							buildout.$('*:nth-of-type(1)').set('aria-selected');
							updateState(slideIndex, 1);
						}
					} else { // if(buildout)
						// no buildout found, so clear anything selected on the slide even though nothing should be
						slide.$$("*[aria-selected]").forEach(function(el) {
							el.unset('aria-selected');
						});
						updateState(slideIndex);
					}
				} else { // if(stepIndex)
					// no step provided, so just clear any buildout as we already selected the right slide
					slide.$$("*[aria-selected]").forEach(function(el) {
						el.unset('aria-selected');
					});
					updateState(slideIndex);
				}
			} else { // if(slide)
				// slideIndex is out of range, so just select the first one
				$('body > section:nth-of-type(1)').set('aria-selected');
				updateState(1);
			}
		} else { // if(slideIndex)
			var slide = $('body > section[aria-selected]');
			if(slide) {
				// have existing slide selected, so see if there is any buildouts on it to advance through
				var buildout = slide.$('.buildout');
				if(buildout) {
					// found a buildout, so were we provided a specific step?
					if(stepIndex) {
						buildout.set('aria-selected');
						var step = buildout.$('*:nth-of-type(' + stepIndex + ')');
						if(step) {
							step.set('aria-selected');
							updateState(null, stepIndex);
						} else { // if(step)
							// stepIndex was out of range, so default to the first step
							buildout.$('*:nth-of-type(1)').set('aria-selected');
							updateState(null, 1);
						}
					} else { // if(stepIndex)
						// no stepIndex provided, so do we have an active buildout?
						if(buildout.getAttribute('aria-selected')) {
							var step = buildout.$('*[aria-selected]');
							if(step) {
								// have a buildout with an item selected, so find the next step
								var nextstep = buildout.$('*[aria-selected] ~ *');
								if(nextstep) {
									step.unset('aria-selected');
									nextstep.set('aria-selected');
									updateState(null, null);
								} else { // if(nextstep)
									// no steps left, so move to the next slide
									var next = $('body > section[aria-selected] ~ section');
								
									slide.unset('aria-selected');
									slide.$$("*[aria-selected]").forEach(function(el) {
										el.unset('aria-selected');
									});
								
									if(next) {
										next.set('aria-selected');
										updateState(null);
									} else {
										setMode('overview');
									}
								}
							} else { // if(step)
								// technically this should never occur, but handle it the same as if the buildout wasn't selected
								buildout.set('aria-selected');
								buildout.$('*:nth-of-type(1)').set('aria-selected');
								updateState(null, 1);
							}
						} else { // if(buildout.getAttribute('aria-selected'))
							// buildout never selected, so let's select it now and advance to first step
							buildout.set('aria-selected');
							buildout.$('*:nth-of-type(1)').set('aria-selected');
							updateState(null, 1);
						}
					}
				} else { // if(buildout)
					// slide has no buildouts, so clear anything and advance to next slide
					var next = $('body > section[aria-selected] ~ section');
			
					slide.unset('aria-selected');
					slide.$$("*[aria-selected]").forEach(function(el) {
						el.unset('aria-selected');
					});

					if(next) {
						next.set('aria-selected');
						updateState(null);
					} else { // if(next)
						// no more slides, so go back to overview
						setMode('overview');
					}
				}
			} else { // if(slide)
				// no slide was active, so clear any stale state stuck around and then select the first slide
				$$("*[aria-selected]").forEach(function(el) {
					el.unset('aria-selected');
				});
				$('body > section:nth-of-type(1)').set('aria-selected');
				updateState(1);
			}
		}
	}
	
	function openSubWindow() {
		popup = window.open(document.location.href, "popup", "resizeable=yes,scrollbars=no,status=no,location=no,menubar=no,toolbar=no");
	}
	
	function keydownHandler(event) {	
		// Don't intercept keyboard shortcuts
		if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
		    return;
		}
		
		// space, right arrow, down arrow, page down
		if(event.keyCode == 32 || event.keyCode == 39 || event.keyCode == 40 || event.keyCode == 34) {
			setSlide();
			persistState();
		}
		
		// left arrow, up arrow, page up
		if(event.keyCode == 37 || event.keyCode == 38 || event.keyCode == 33) {
			window.history.back();
		}
		
		// home
		if(event.keyCode == 36) {
			setSlide(1, 0);
			persistState();
		}
		
		// end
		if(event.keyCode == 35) {
			setSlide($$("body > section").length, 0);
			persistState();
		}
	}
	
	function popstateHandler(event) {
		if(event.state) {
			setSlide(event.state.slide, event.state.step);
		} else {
			if(document.location.hash.length) {
				var state = document.location.hash.substr(8, document.location.hash.length - 13).split('_');
				setSlide(state[0], state[1]);
			} else {
				setMode('overview');
			}
		}
	}
	
	function messageHandler(event) {
		console.log(event);
		try {
			var message = JSON.parse(event.data);
			
			switch(message.eventName) {
				case "SET_SLIDE":
					setMode("presentation");
					setSlide(message.payload.slide, message.payload.step);
					persistState();
					break;
				case "SET_MODE":
					setMode(message.payload.mode);
					break;
				default:
					console.log("Unhandled message event!", event);
			}
		} catch(e) {
			console.log("Couldn't parse message received!", e);
		}
	}
	
	function resizeHandler() {
		var sx = document.body.clientWidth / window.innerWidth;
		var sy = document.body.clientHeight / window.innerHeight;
		
		
		if(document.body.className == "presentation") {
			setScale(1/Math.max(sx, sy));
		} else {
			setScale(1.0);
		}
	}
	
	function setScale(scale) {
		var transform = "scale(" + (scale) + ")";
		
		document.body.style.MozTransform = transform;
		document.body.style.WebkitTransform = transform;
		document.body.style.OTransform = transform;
		document.body.style.msTransform = transform;
		document.body.style.transform = transform;
	}
	
	function sendNotification(eventName, payload) {
		popup && popup.window.postMessage(JSON.stringify({ 'eventName': eventName, 'payload': payload }), "*");
	}
	
	function bindWindowEvents() {
		window.addEventListener('keydown', keydownHandler, true);
		window.addEventListener('popstate', popstateHandler, false);
	}
	
	// we always want these to be listening, unlike the others
	window.addEventListener('message', messageHandler, false);
	window.addEventListener('resize', resizeHandler, true);
	
	// public API
	return {
		'start': function(mode) {
			bindWindowEvents();
			setMode(mode || 'presentation');
			setTimeout(function() {
				setSlide(1,0);
				persistState();
			}, 500);
		},
		'end': function() {
			setMode('overview');
		},
		'setSlide': function(slide, step) {
			setSlide(slide, step);
			persistState();
		},
		'changeSlide': function() {
			setSlide();
			persistState();
		}
	};
})();