#jQuery seeThru - HTML5 video with alpha channel transparencies#

This jQuery plugin adds support for the lacking alpha channel in HTML5 `<video>` elements.<br/>The original data will simply be re-rendered into a canvas-element, therefore adding support for alpha information that can either be included in the source file for the video element or in a seperate `<img>`-element.

##Video setup##
In default configuration the plugin assumes that the alpha information is added underneath the original video track (in the exact same dimensions, therefore a video of 400x300 target dimensions will have a 400x600 source file). The alpha information should be a black and white image with white being fully opaque and black being fully transparent (colored information will be used based on its overall luminance).<br/>For optimal results the color channel should be un-premultiplied. (see the Wikipedia article on **[Alpha Compositing][15]** for more info on what that is all about). If you need a tool to un-premultiply your imagery you can use **[Knoll Unmult][16]** which is available for quite a lot of packages.<br/>
For a basic introduction of how to encode and embed video for HTML5 pages see the great **[Dive into HTML5][14]**
###Example image:###
Note the jagged edges in the color channel(s) due to un-premultiplying:<br/>
![Example image][5]<br/>
put over a greenish/blueish background results in<br/>
![Example image][6]<br/>
**[Live Demo][1]**

##Static Mask##
It is also possible to source the alpha information from an `<img>`-element. The plugin lets you use either the luminance information of the RGB channels (i.e. the image) or the image's alpha channel (see options for how to choose). In case the image does not fit your video's dimensions it will be stretched to those.<br/>
**[Live Demo][2]**

##Basic plugin usage##
Basic HTML5 video markup should look something like this:

```html
<video id="myVideo">
    <source src="src.mp4" type="video/mp4" />
    <source src="src.ogg" type="video/ogg" />
    ....
</video>
```

In case you are planning to have your video set to autoplay or loop you can do this when initializing the plugin. The lack of a loop option in Firefox will also be fixed when doing that.<br/>
To make the magic happen you just have to do the following:<br/>
Include jQuery (I built the plugin with 1.7+ but it should be working with older versions down to 1.4 as well) and the plugin in your `<head>`:

```html 
<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>
<script type="text/javascript" src="jquery-seeThru.0.9.8.min.js"></script>
```
and then call the following jQuery method on your video (preferrably on `$(document).ready`):

```javascript
$(document).ready(function(){
    $('#myVideo').seeThru();
});
```

If you specify dimension-attributes in your markup they will be considered, in case not the dimensions of the source file will be used (video with alpha included will of course turn out to be halved in height). To avoid flickering on pageload I'd recommend setting your video to `display:none;` in your CSS.<br/>In case you want to style the generated canvas elements, the generated markup (you don't have to add this portion - the plugin does this) looks like this:
```html
<video style="display:none;">...</video><!-- video is hidden -->
<canvas height="XXX" width="XXX" class="seeThru-display"></canvas><!-- this is the actual "video" -->
<canvas height="XXX" width="XXX" class="seeThru-buffer" style="display:none;"></canvas><!-- this is just a helper element -->
```
##Options##
There are a few options you can pass when calling the plugin:

 - `start` defines the video's behavior on load. It defaults to `'autoplay'` which will automatically start the video as soon as possible. Other options are `'clicktoplay'` which will display the first frame of the video until it is clicked or `'external'` which will just display the first frame of the video and wait for external JS calls (so you can build your own interface or something - note that although the `<video>` is hidden it is still playing and controls the rendered image).
 - `end` defines the video's behavior when it has reached its end. It defaults to `'loop'` which will loop the video. Other possibilities are `'stop'` (it will just stop), or `'rewind'` which will jump back to the first frame and stop. If you use `start:'clicktoplay'` along with `'rewind'` or `'end'` the video will be clickable again when finished.
 - `mask` lets you use the content of an `<img>` node as alpha information (also black and white). The parameter expects a CSS selector (preferrably ID) that refers directly to an image tag, like `'#fancyMask'`. In case it returns a collection (class passed), the first element is used - in case the selector matches nothing or a non-image node the option is ignored. Defaults to an empty string, so video information is used for the alpha.
 - `alphaMask` specifies if the plugin uses either the black and white information (i.e. `false`) or the alpha information (i.e. `true`) of the element specified in the `mask` parameter. Defaults to `false`.
 - `height` can be used to control the height of the rendered canvas. Overrides the attributes of the `<video>`-element
 - `width` can be used to control the width of the rendered canvas. Overrides the attributes of the `<video>`-element

This might look like this:
```javascript
$('#myVideo').seeThru({start:'autoplay',end:'stop'});
```
or
```javascript
$('#myVideo').seeThru({mask:'#imageWithAlpha',alphaMask: true});
```
##Additional methods##
Apart from `init`, these methods are available:

 - `updateMask` lets you swap the alpha source for a video that uses static alpha information. Has to be used along with a new selector as `mask` parameter, the value for `alphaMask` will be kept from init.
 - `revert` will revert the `<video>` element back to its original state, remove the `<canvas>` elements, all attached data and event listeners/handlers
 - `play` and `pause` can be used to control the playback of the video - basically the same as `$('#video')[0].play()`, but still chainable

This might look like:
```javascript
/* sets mask to element with id "newMask" */
$('#myVideo').seeThru('updateMask',{mask:'#newMask'});
```
or
```javascript
/* destroys seeThru functionality and adds class "plainOldVideo" */
$('#myVideo').seeThru('revert').addClass('plainOldVideo');
```
or
```javascript
/* pauses video and binds click handler to resume playback */
$('#myVideo').seeThru('pause').one('click',function(){
   $(this).seeThru('play');
});
```
##Examples##
**[Moving alpha][1]**<br>
**[Static alpha][2]**<br>
**[Swapping alpha sources][3]**<br>
**[Video listening to external JS calls][4]**<br>

##Too much jQuery?##
If you do not want to use jQuery, but still think transparent video is nice, here's **[a gist][13]** showing how the basic principle works.

##Cross Domain issues with canvas-elements##
Please note that canvas is very picky about where it gets its contents from, so be aware that the video source file has to be hosted on the same domain.

##Binding mouse events to your video##
To mimic a behavior as if the original video was still visible it will echo all mouse events fired by the canvas representation. This means that you can still do sth like:
```javascript
$('#myVideo').seeThru(); // the <video> is hidden
$('#myVideo').click(function(){ //this is still working as a click on the `.seeThru-display`-<canvas> will be echoed by the video
   alert('But I thought I was hidden?');
});
```
The events that are echoed are: `mouseenter mouseleave click mousedown mouseup mousemove mouseover hover dblclick contextmenu focus blur`

##Mobile devices##
As most mobile devices use external video players to handle HTML5-video this plugin is *not* working on mobile Safari or Webkit (yet). This is definitely on our to-do-list (wishlist rather), although outcome is uncertain.
Apparently Android 3.1+ will play `<video>` inline, but I do not have any experience regarding using it as a canvas source yet.

##Browser support##
Tested on Chrome, Firefox, Safari, Opera 11 and IE 9.0+ 
(the browser has to support `<video>` and `<canvas>` of course)<br/>If you are looking for a tool to detect these features you should have a look at <a href="http://www.modernizr.com/">modernizr</a>

##tl;dr##
Put a black-and white alpha channel right underneath your `<video>` source (in the same file), load jQuery and let the plugin do magical things:
<code>
$('#myRadVideoNeedsTransparencies').seeThru();
</code><br>
Voila! Here's an [example][1].

##Changelog##
   * v0.9.8: the plugin now uses the `requestAnimationFrame`-API for refreshing the canvas instead of using a JavaScript-interval (older browsers will be "poly-filled"), this should increase performance in critical situations and improve overall efficiency. Therefore the `fps` and `forceRendering` options are deprecated.
   * v0.9.7: the original video will now echo mouse events triggered by the canvas represenation, so you can still "use" the hidden video element to bind events for user interaction, faster
   * v0.9.6: elements that are not visible in the viewport will stop rendering to lower CPU usage, added the `forceRendering` option
   * v0.9.5: added simple video playback control methods: `play` and `pause`
   * v0.9.4: fixed canvas updating issues when listening to external interfaces
   * v0.9.3: added the `revert` method and `width` and `height` options, fixed even more chaining issues, proper event namespacing
   * v0.9.2: added support for `alphaMask`, added the possibility to swap static masks via `updateMask`, improved interpretation of colored images as black and white mask, improved performance, properly namespaced (`seeThru`-prefix) the applied classes, fixed chaining issues, added error messages, nicer example pages
   * v0.9.1: added the `mask` option that enables the use of a static image as alpha information, also some minor improvements in overall perfomance
   * v0.9.0: first version

Older versions (< 0.9.6) are available at **[Google Code][9]**

##Licensing##
This plugin is licensed under the **[MIT License][11]**, demo content, video and imagery is **[CC-BY-SA 3.0][12]**

##Thank you##
Thanks to **[Jake Archibald][7]**, who had the original idea for this approach, **[Kathi Käppel][8]** who designed the lovely Mr. Kolor from the demo and Sebastian Lechenbauer for making fun of my git dyslexia.
![Footer image][10]

[1]:http://www.frederikring.com/seeThru/movingAlpha
[2]:http://www.frederikring.com/seeThru/staticAlpha
[3]:http://www.frederikring.com/seeThru/swapAlpha
[4]:http://www.frederikring.com/seeThru/external
[5]:http://www.frederikring.com/seeThru/img/seeThruDemo.png
[6]:http://www.frederikring.com/seeThru/img/seeThruResult.png
[7]:http://www.jakearchibald.com
[8]:http://www.kathikaeppel.de
[9]:http://code.google.com/p/jquery-seethru/
[10]:http://www.frederikring.com/seeThru/img/footer.png
[11]:http://www.opensource.org/licenses/mit-license.php
[12]:http://creativecommons.org/licenses/by-sa/3.0/
[13]:https://gist.github.com/2469449
[14]:http://www.diveintohtml5.info/video.html
[15]:http://en.wikipedia.org/wiki/Alpha_compositing
[16]:http://www.redgiantsoftware.com/products/all/knoll-unmult-free