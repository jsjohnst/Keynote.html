Keynote / Presentation template system written using HTML5/CSS3/Javascript
==========================================================================

Sample slide format:
--------------------
```html
<section data-onload="blink_background">
    <h2>Centered Headline</h2>
    <h3>Centered Subheadline</h3>
    <footer>Footer text for slide</footer>
	<aside>First slide of the presentation. This is some notes about it.</aside>
</section>
```
Formatted Elements:
-------------------
h1 = Title text in top left corner
h2 = Title text centered in middle of page
h3 = Subtitle text centered just below h2 text
footer = Right aligned bottom text
*.buildout = will incrementally make each child of that element built out (usually ul/li, but could be anything)

Section Events:
---------------
data-onload = fired when slide is loaded
data-onunload = fired when slide is unloaded
data-onbuild = fired each time the slide steps through a build out

data-eventscope = the scope to find/call the callback above in (defaults to window)
data-autoplay = set this to "false" or "0" to disable auto playback of HTML5 video and/or audio elements on a slide

Keys:
-----
left arrow, up arrow, page up = go back one slide / build step
right arrow, down arrow, page down, space = go forward one slide / build step
home = go to first slide
end = go to last slide

Loosely based on work by:
-------------------------
Paul Rouget - http://paulrouget.com/dzslides
Christian Heilmann - http://christianheilmann.com/