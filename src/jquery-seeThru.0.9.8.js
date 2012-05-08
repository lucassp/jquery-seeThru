/* jQuery seeThru 0.9.8 WIP - transparent HTML5 video - written by Frederik Ring (frederik.ring@gmail.com) */
/* based on http://jakearchibald.com/scratch/alphavid/ by Jake Archibald (jaffathecake@gmail.com) */

/* Copyright (c) 2012 Frederik Ring */
/* Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: */
/* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. */
/* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. */

/* see https://github.com/m90/jquery-seeThru for documentation */

(function($) {

	//from http://paulirish.com/2011/requestanimationframe-for-smart-animating/
	(function(){
		var lastTime = 0;
		var vendors = ['ms', 'moz', 'webkit', 'o'];
		for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
			window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
			window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
		}
	 
		if (!window.requestAnimationFrame){
			window.requestAnimationFrame = function(callback, element) {
				var currTime = new Date().getTime();
				var timeToCall = Math.max(0, 16 - (currTime - lastTime));
				var id = window.setTimeout(function(){callback(currTime+timeToCall);},timeToCall);
				lastTime = currTime + timeToCall;
				return id;
			};
		}
	})()
 
	if (!window.cancelAnimationFrame){
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
	}

	function convertAlphaMask(dimensions, maskObj){
		
		var convertCtx = $('<canvas/>').attr({'width':dimensions.width,'height':dimensions.height}).get(0).getContext('2d');
		convertCtx.drawImage(maskObj, 0, 0, dimensions.width, dimensions.height);
		
		var RGBA = convertCtx.getImageData(0, 0, dimensions.width, dimensions.height);
		
		for (var i = 3, len = RGBA.data.length; i < len; i = i + 4){
			RGBA.data[i-1] = RGBA.data[i-2] = RGBA.data[i-3] = RGBA.data[i]; //alpha into RGB
			RGBA.data[i] = 255; //alpha is 100% opaque
		}
		
		return RGBA;
		
	}

	var methods = {

	init : function(options) {
		
		options || (options = {}); //options passed?

		/* OPTIONS */
		var settings = $.extend({
		  start: 'autoplay', //'autoplay', 'clicktoplay', 'external' (will display the first frame and make the video wait for an external interface) - defaults to autoplay
		  end: 'loop', //'loop', 'rewind', 'stop' any other input will default to 'stop'
		  mask: '', //this lets you define a <img> (selected by #id or .class - class will use the first occurence)used as a black and white mask instead of adding the alpha to the video
		  alphaMask: false, //defines if the used `mask` uses black and white or alpha information - defaults to false, i.e. black and white
		  width: '', //lets you specify a pixel value used as width -- overrides all other calculations
		  height: '', //lets you specify a pixel value used as height -- overrides all other calculations
		}, options);

		return this.each(function(){
		
		if ($(this).data('seeThru')){
			$.error('seeThru already initialized on selected element');
		}

		var staticMask = false;
		var alphaMask = (settings.alphaMask === true);
		var forceRendering = (settings.forceRendering === true);
		var maskObj;

		if ($(settings.mask).length){
		
			maskObj = $(settings.mask)[0]; //first occurence in case class is selected;
			if (maskObj.tagName === 'IMG'){ //only works if selected element is <img>
				$(maskObj).hide();
				staticMask = true;
			} else {
				$.error('Mask element must be <img>');
			}

		}
		
		if (this.tagName === 'VIDEO'){ //no <video>: no magic!

			$(this).bind('loadedmetadata.seeThru',function(){
			
				var $this = $(this);
				var video = this;
				var $window = $(window);
				var divisor = staticMask ? 1 : 2; //static alpha data will not cut the image dimensions

				/* calculate dimensions */
				var dimensions = {
				  width: parseInt(settings.width,10),
				  height: parseInt(settings.height,10)
				};
				
				if (!dimensions.height || !dimensions.width){
				
					if (!$this.attr('width') && !$this.attr('height')){
						dimensions.width = dimensions.width || video.videoWidth;
						dimensions.height = dimensions.height || video.videoHeight / divisor;
					} else if (!$this.attr('height')){
						var ratio = video.videoWidth / Math.floor(video.videoHeight / divisor);
						dimensions.width = dimensions.width || parseInt($this.attr('width'),10);
						dimensions.height = dimensions.height || parseInt($this.attr('width') / ratio,10);
					} else if (!$this.attr('width')){
						var ratio = video.videoWidth / Math.floor(video.videoHeight / divisor);
						dimensions.width = dimensions.width || parseInt($this.attr('height'),10) * ratio;
						dimensions.height = dimensions.height || parseInt($this.attr('height'),10);
					} else {
						dimensions.width = dimensions.width || parseInt($this.attr('width'),10);
						dimensions.height = dimensions.height || parseInt($this.attr('height'),10) / divisor;
					}
				
				}
				
				/*generate canvas elements*/
				var bufferCanvas = $('<canvas/>',{'class':'seeThru-buffer'}).attr({'width':dimensions.width,'height':dimensions.height * 2}).hide(); //buffer will ALWAYS be twice the height
				var displayCanvas = $('<canvas/>',{'class':'seeThru-display'}).attr({'width':dimensions.width,'height':dimensions.height});
				
				var display = displayCanvas[0].getContext('2d');
				var buffer = bufferCanvas[0].getContext('2d');

				/*echo mouse events*/
				displayCanvas.bind('mouseenter mouseleave click mousedown mouseup mousemove mouseover hover dblclick contextmenu focus blur',function(e){ //see: http://www.w3.org/TR/DOM-Level-3-Events/#events-mouseevents
					$this.trigger(e); //mouse events on the canvas representation will be echoed by the video
				});
				
				/*draw static mask if needed*/
				if (staticMask){
				
					maskObj.width = dimensions.width;
					maskObj.height = dimensions.height; //adjust image dimensions to video dimensions
					
					if (alphaMask){ //alpha channel has to be converted into RGB
						buffer.putImageData(convertAlphaMask(dimensions, maskObj), 0, dimensions.height);
					} else { //no conversion needed, draw image into buffer
						buffer.drawImage(maskObj, 0, dimensions.height, dimensions.width, dimensions.height);
					}
					
				}

				/*hide video and append canvas elements - DOM manipulation done*/
				var interval;
				
				$this.hide().data('seeThru',{'staticMask':staticMask,'alphaMask':alphaMask,interval:interval}).after(bufferCanvas,displayCanvas);
				
				/*event handling - all events are .seeThru-namespaced*/
				$this.bind('play.seeThru', function() { //refresh canvas elements
					if (interval){
						window.cancelAnimationFrame(interval);
					}
					interval = window.requestAnimationFrame(animationLogic);
					$this.data('seeThru').interval = interval;
				}).bind('pause.seeThru', function(){ //stop interval on pause
					window.cancelAnimationFrame(interval);
				});
				
				if (settings.start === 'autoplay'){
					$this.trigger('play.seeThru'); //trigger play
				} else if (settings.start === 'clicktoplay'){
					video.play();
					video.pause(); // fake play to initialize playhead
					drawFrame();
					displayCanvas.one('click.seeThru',function(){
						video.play();
					});
				} else if (settings.start === 'external'){
					video.play();
					video.pause(); // fake play to initialize playhead
					$this.bind('timeupdate.seeThru',function(){
						drawFrame();
					});
				} else {
					video.play();
				}

				if (settings.end === 'loop') {
					$this.bind('ended.seeThru',function(){
						video.play();
					});
				} else if (settings.end === 'rewind'){
					$this.bind('ended.seeThru',function(){
						video.pause();
						video.currentTime = 0;
						if (settings.start == 'clicktoplay'){
							displayCanvas.one('click.seeThru',function(){
								video.play();
							});
					}
					});
				} else {
					$this.bind('ended.seeThru',function(){
						video.pause();
						if (settings.start == 'clicktoplay'){
							displayCanvas.one('click.seeThru',function(){
								video.play();
							});
						}
					});
				}
				
				function inViewport(){
				
					var viewTop = $window.scrollTop();
					var viewBottom = viewTop + $window.height();

					var elemTop = displayCanvas.offset().top;
					var elemBottom = elemTop + displayCanvas.height();
					
					return (!((elemTop < viewTop && elemBottom < viewTop) || (elemTop > viewBottom && elemBottom > viewBottom)));
					
				}

				/*draw buffer info into display canvas*/
				function drawFrame(){
					
					buffer.drawImage(video, 0, 0, dimensions.width, dimensions.height * divisor); //scales if <video>-dimensions are not matching
					var image = buffer.getImageData(0, 0, dimensions.width, dimensions.height);
					
					var alphaData = buffer.getImageData(0, dimensions.height, dimensions.width, dimensions.height).data; //grab from video;

					for (var i = 3, len = image.data.length; i < len; i = i + 4) {
						image.data[i] = Math.floor((alphaData[i - 1] + alphaData[i - 2] + alphaData[i - 3]) / 3); //calculate luminance from buffer part
					}

					display.putImageData(image, 0, 0, 0, 0, dimensions.width, dimensions.height);
						
				}
				
				function animationLogic(){
					drawFrame();
					window.requestAnimationFrame(animationLogic);
				}

			});
			
			if (this.videoWidth && this.videoHeight){
				$(this).trigger('loadedmetadata.seeThru'); //trigger fake event in case seeThru is applied a second time
			}

		} else {
			$.error('Selected element must be <video> element');
		}
 
		});
		
	}, //end init
	
	updateMask : function(options){
	
		var settings = $.extend({
			mask: '', //this lets you define a <img> (selected by #id or .class - class will use the first occurence)used as a black and white mask instead of adding the alpha to the video
		}, options);
		
		return this.each(function(){
		
		var $this = $(this);
		
		if ($(settings.mask).length){

			var staticMask = $this.data('seeThru').staticMask;
			var alphaMask = $this.data('seeThru').alphaMask;

			if (staticMask){
				if ($(settings.mask)[0].tagName === 'IMG'){

					var dimensions = {
					  width:$this.width(),
					  height:$this.height()
					};
					
					var maskObj = $(settings.mask)[0];
					maskObj.width = dimensions.width;
					maskObj.height = dimensions.height;
					
					var buffer = $this.nextAll('.seeThru-buffer')[0].getContext('2d');
				
					if (alphaMask){ //alpha channel has to be converted into RGB
						buffer.putImageData(convertAlphaMask(dimensions, maskObj), 0, dimensions.height);
					} else { //no conversion needed, draw image into buffer
						buffer.drawImage(maskObj, 0, dimensions.height, dimensions.width, dimensions.height);
					}
					
				} else {
					$.error('Passed mask element must be <img>');
				}
			} else {
				$.error('Cannot apply method \'.updateMask()\' to element with moving alpha');
			}
		} else {
			$.error('Missing parameter \'mask\'');
		}

		});
		
	}, //end updateMask
	
	revert : function(){
		return this.each(function(){
		
			var $this = $(this);
		
			if ($this.data('seeThru')){
				window.cancelAnimationFrame($this.data('seeThru').interval);
				$this.show().unbind('.seeThru').removeData('seeThru').nextAll('.seeThru-buffer:first,.seeThru-display:first').remove();
			}
		});
	}, // end revert
	
	play : function(){
	
		return this.each(function(){
			if ($(this).data('seeThru')){
				this.play();
			}
		});
	
	}, //end play
	
	pause : function(){
	
		return this.each(function(){
			if ($(this).data('seeThru')){
				this.pause();
			}
		});
	
	}, //end pause
	
	rewind : function(){ //method is not documented due to strange behavior in Webkit
	
		return this.each(function(){
			if ($(this).data('seeThru')){
				this.pause();
				this.currentTime = 0;
			}
		});
	
	} //end rewind
	
	}; //end methods-object
	
	$.fn.seeThru = function(method){ // Method calling logic -- see: http://docs.jquery.com/Plugins/Authoring
		
		if (methods[method]){
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.seeThru' );
		}
		
	}
	
})(jQuery);