window.isSmartphone = function() {
  // this check is also used in main.js. Note it should not detect
  // tablets because their display is large enough to use the desktop
  // version.

  // The stock intel site allows forcing mobile/full sites with a vp=m or vp=f
  // parameter - let's support the same. (stock only allows this for some
  // browsers - e.g. android phone/tablet. let's allow it for all, but
  // no promises it'll work right)
  var viewParam = getURLParam('vp');
  if (viewParam == 'm') return true;
  if (viewParam == 'f') return false;

  return navigator.userAgent.match(/Android.*Mobile/);
}

window.smartphone = function() {};

window.runOnSmartphonesBeforeBoot = function() {
  if(!isSmartphone()) return;
  console.warn('running smartphone pre boot stuff');

  // add smartphone stylesheet
  headHTML = document.getElementsByTagName('head')[0].innerHTML;
  headHTML += '<style>@@INCLUDESTRING:mobile/smartphone.css@@</style>';
  document.getElementsByTagName('head')[0].innerHTML = headHTML;

  // don’t need many of those
  window.setupStyles = function() {
    $('head').append('<style>' +
      [ '#largepreview.enl img { border:2px solid '+COLORS[TEAM_ENL]+'; } ',
        '#largepreview.res img { border:2px solid '+COLORS[TEAM_RES]+'; } ',
        '#largepreview.none img { border:2px solid '+COLORS[TEAM_NONE]+'; } '].join("\n")
      + '</style>');
  }

  // this also matches the expand button, but it is hidden via CSS
  $('#chatcontrols a').click(function() {
    $('#scrollwrapper, #updatestatus').hide();
    // not displaying the map causes bugs in Leaflet
    $('#map').css('visibility', 'hidden');
    $('#chat, #chatinput').show();
  });

  window.smartphone.mapButton = $('<a>map</a>').click(function() {
    $('#chat, #chatinput, #scrollwrapper').hide();
    $('#map').css('visibility', 'visible');
    $('#updatestatus').show();
    $('.active').removeClass('active');
    $(this).addClass('active');
  });

  window.smartphone.sideButton = $('<a>info</a>').click(function() {
    $('#chat, #chatinput, #updatestatus').hide();
    $('#map').css('visibility', 'hidden');
    $('#scrollwrapper').show();
    $('.active').removeClass('active');
    $(this).addClass('active');
  });

  $('#chatcontrols').append(smartphone.mapButton).append(smartphone.sideButton);

  window.addHook('portalDetailsUpdated', function(data) {
    var x = $('.imgpreview img').removeClass('hide');

    if(!x.length) {
      $('.fullimg').remove();
      return;
    }

    if($('.fullimg').length) {
      $('.fullimg').replaceWith(x.addClass('fullimg'));
    } else {
      x.addClass('fullimg').appendTo('#sidebar');
    }
  });
}

window.runOnSmartphonesAfterBoot = function() {
  if(!isSmartphone()) return;
  console.warn('running smartphone post boot stuff');

  chat.toggle();
  smartphone.mapButton.click();

  // disable img full view
  $('#portaldetails').off('click', '**');

  $('.leaflet-right').addClass('leaflet-left').removeClass('leaflet-right');

  // make buttons in action bar flexible
  var l = $('#chatcontrols a:visible');
  l.css('width', 100/l.length + '%');

  // add event to portals that allows long press to switch to sidebar
  window.addHook('portalAdded', function(data) {
    data.portal.on('add', function() {
      if(!this._container || this.options.addedTapHoldHandler) return;
      this.options.addedTapHoldHandler = true;
      var guid = this.options.guid;

      // this is a hack, accessing Leaflet’s private _container is evil
      $(this._container).on('taphold', function() {
        window.renderPortalDetails(guid);
        window.smartphone.sideButton.click();
      });
    });
  });
  
  
  var lcl = $('.leaflet-control-layers');
  
  lcl.css('position', 'relative');
  lcl.parent().css({'height': '100%', 'width': '100%'});
  
  var scrollDown = $('<img>').attr('src', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoyMTQ4RkNBOTVCMEQxMUUxOTQxOUU0QkNBRjUxNzRCMSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDoyMTQ4RkNBQTVCMEQxMUUxOTQxOUU0QkNBRjUxNzRCMSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjIwQjc5QTI0NUIwRDExRTE5NDE5RTRCQ0FGNTE3NEIxIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjIxNDhGQ0E4NUIwRDExRTE5NDE5RTRCQ0FGNTE3NEIxIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+PWL1wgAAAxhJREFUeNrsmMtrU0EUh+fGmCY+NlEKXVS6sAhFu6gX3FgKgqCCtVQQFR9UCm7c+I90Y4UuqvgAUfFBN7oQKu6sBLcF60oXlooPfMcmuf5GfgPDcFGTmzu32HPgg/QmuXPON3PPTBNEUaRWcwQiQASIABEgAkSACBABIkAEiAARIAJEgAgQASJABIgAEfCnCMPQvCyAQ2AOvMoo/y1gF5gBP/WFSqXS1A1yCQbfA4bBCdCZQfGdHHuYubQUrQrYCUbBD9ALzoMej8X3cMxe5jDKnLwI2AHGwBrQ4NLrYkKhh+JDjtXFsRvMZYy5pS5gAJRB3bpWBRvAeJLl+I+P3TjHqlrX68xpoNkb5ltI4h4b4G4mYbpoDawFJ8FmcNeRlCT0DB8G+znjNbuRgw7wmLmlLuAzuAI+gX1OQjUmdABsBDfA94TFl8BxMMglHzn561X8gMUv+xCgONAt8BYc4X3MbEdMdAhsAtPgfYvjlLnkt7PZRc6q0HncBrO+dwETsyzwK5ehsiTome9LsEOYTt/He9nFd3DM6STFt0PA77MHuAAW2RuU0xy7wTnQ38Q9+/mdbqfZmQPYIsesJE0+16Ym9RJMgBd8ZgNHgl7KZ/kc/y0G+dlyTPEljjHBMdVKEaBjibPylLMUOD2jyL16xHnPzmWEnyk6DS3gtTmOsdSupPOqvfEFXAIfwV42xrq1Q+R4dNXN8bo5v1PYMTbOOncWu9lpHoE7bIZqpQowS15vfx94RM1b22SDzWyIh5nLvH6Gh5hqzDbXYKd/mMbJKg0BJnTC78ApsM5a0maH0AWv57VtMTOrD1XfwDXwLK0k0xSgmLg+OJ3m2d0uUr/ear22Qz/vb8BVMJ9mgjmVfugCLoIFFuYeqJZjil/gd+bTTs6HAB2vwSR4HrNN2p2+xM9M8jvqfxGguDNMsZsX2NntTl/ge1P8rJfIK79R5fan/5E66EzAff605TV8CzAxw1k+yr9vgidZJJKVAMWCi9brTEJ+FhcBIkAEiAARIAJEgAgQASJABIgAESACRIAIEAEiQASsqvglwAD3pyIbjjqAzwAAAABJRU5ErkJggg==')
	.addClass("scrollArrow")
	.css({'left':55})
	.on("click", function(e) {
		lcl[0].scrollTop += 200;
		e.preventDefault();
		e.stopPropagation();
		return false;
	  });
  
  var scrollTop = $('<img>').attr('src', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoyMEI3OUExQTVCMEQxMUUxOTQxOUU0QkNBRjUxNzRCMSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDoyMEI3OUExQjVCMEQxMUUxOTQxOUU0QkNBRjUxNzRCMSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjIwMjcxQTA3NUIwRDExRTE5NDE5RTRCQ0FGNTE3NEIxIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjIwMjcxQTA4NUIwRDExRTE5NDE5RTRCQ0FGNTE3NEIxIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+OI2sywAAAuxJREFUeNrsms1rE0EYxrP5sBWtikLRg+BBBa8aqgdBqqhU8PPQiqCC1lPxYP8RDwpFUOvXoRQs6kHxEig9CWsOFXqph0IPBcEgWDBtYtdn4AkMw7aQdDcm2eeFHw3Zna/fzrwz29YLgiCV5EinEh4SIAESIAESIAESIAESIAESIAESIAESIAESIAEJi2y9BfL5fJTtn+fPz1FV6Pt+vAIijFPgCj+XwXRbzICI4jK4CGq/k78JdoH3nS6gCwyCM6AK1vh9BlwFO8AkWOlEAeYJ3wbHOOXtv8j8pYyzYDd4CX51koD9HPwh8GedewJeOwp6KGGxE7bBI2CEgy8713LEjjLvHWHZthbQx4H0hgy+G3wn3SESelm2r12XwAC4RskV63uPybAInvO7OyG5wZTZCu6BPeBTu8wAM7gbzPYes73dnpFeAGPgNxnjOSDr9KnKOgZZZ1erz4Dt4Ban7aqT6bMczAeyZl1b5Wz4CS5RQtXZIc5xJ3kFlltRgFmzd5m43G0uxww/AWY22AXeUcJ1Tv+Kdc1IOgF2gmfgRystgYNgFBzmQANnSZTAkw0Gb8cM7y05U762TZo2HoADrSLAvB3dB3v5lNx8YPbyx2C2jjpnWWYxZN2bNvZRQv5/CzgNhsE25/jqcQrPgYdgoYG6F1h2jnV51rUV5pth9qHpAsyaHuJLTI6Jyh78Fmb1R5zKjUaJdUyzTs/ZIXLsw1DIgSq2JNjDJHWST8LN9EbqR/DWEdNomHX/gtvlAHeEqrNNXuCL1ATvi3UGmMNN/zqDN1n7Nd/oohi8/bI0yborzoML2Jd+9i32JVDk1Mw4yc7szU95yIkrCmxj2UmOGfap2AwB38A4n0qaa3OJCctPxR8+21pi22n2ZZx9a0oS/Aqm+BIzv4lM32jUdoh59mGKfWrqSbDAhPglqlNZnWHafAOOb2bZefpX2YSHBEiABEiABEiABEiABEiABEiABEiABEiABEhAwuKfAAMA60iqdtHtkNkAAAAASUVORK5CYII=')
    .addClass("scrollArrow")
	.css({'left':0})
	.on("click", function(e) {
		lcl[0].scrollTop -= 200;
		e.preventDefault();
		e.stopPropagation();
		return false;
	  });
  
	lcl.append(scrollTop).append(scrollDown);
}
