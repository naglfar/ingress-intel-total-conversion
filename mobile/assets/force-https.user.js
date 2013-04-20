// ==UserScript==
// @id             force-https@jonatkins
// @name           IITC plugin: force https access for ingress.com/intel
// @version        0.1.0.20130420.124221
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://github.com/naglfar/ingress-intel-total-conversion/tree/master/build/naglfar/plugins/force-https.meta.js
// @downloadURL    https://github.com/naglfar/ingress-intel-total-conversion/tree/master/build/naglfar/plugins/force-https.user.js
// @description    [naglfar-2013-04-20-124221] Force https access for ingress.com/intel. If the intel site is accessed via http, it redirects to the https version
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==



//NOTE: plugin authors - due to the unique requirements of this plugin, it doesn't use the standard IITC
//plugin architechure. do NOT use it as a template for other plugins


if(window.location.protocol !== 'https:') {
  var redir = window.location.href.replace(/^http:/, 'https:');
  window.location = redir;
  throw('Need to load HTTPS version.');
}
