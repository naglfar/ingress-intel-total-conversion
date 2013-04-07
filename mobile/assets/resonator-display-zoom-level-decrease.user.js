// ==UserScript==
// @id             iitc-plugin-resonator-display-zoom-level-decrease@xelio
// @name           IITC plugin: resonator display zoom level decrease
// @version        1.0.2.20130406.191415
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://github.com/naglfar/ingress-intel-total-conversion/tree/master/build/naglfar/plugins/resonator-display-zoom-level-decrease.meta.js
// @downloadURL    https://github.com/naglfar/ingress-intel-total-conversion/tree/master/build/naglfar/plugins/resonator-display-zoom-level-decrease.user.js
// @description    [naglfar-2013-04-06-191415] Resonator start display earlier
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.resonatorDisplayZoomLevelDecrease = function() {};

window.plugin.resonatorDisplayZoomLevelDecrease.changeConstant = function() {

// Minimum zoom level resonator will display
window.RESONATOR_DISPLAY_ZOOM_LEVEL = 16;
};

var setup =  window.plugin.resonatorDisplayZoomLevelDecrease.changeConstant;

// PLUGIN END //////////////////////////////////////////////////////////

if(window.iitcLoaded && typeof setup === 'function') {
  setup();
} else {
  if(window.bootPlugins)
    window.bootPlugins.push(setup);
  else
    window.bootPlugins = [setup];
}
} // wrapper end
// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);
