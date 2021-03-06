package com.cradle.iitc_mobile;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URL;
import java.util.Scanner;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.net.http.SslError;
import android.preference.PreferenceManager;
import android.util.Log;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class IITC_WebViewClient extends WebViewClient {
	private static final ByteArrayInputStream style = new ByteArrayInputStream(
		"body, #dashboard_container, #map_canvas { background: #000 !important; }".getBytes());
	private static final ByteArrayInputStream empty = new ByteArrayInputStream("".getBytes());

	private WebResourceResponse iitcjs;
	private String js = null;
	Context context;

	public IITC_WebViewClient(Context c) {
		this.context = c;
		try {
			loadIITC_JS(c);
		} catch(IOException e) {
			e.printStackTrace();
		}
	}

	public String getIITCVersion() {
		String header = js.substring(js.indexOf("==UserScript=="), js.indexOf("==/UserScript=="));
		// remove new line comments
		header = header.replace("\n//", "");
		// get a list of key-value
		String[] attributes = header.split(" +");
		String iitc_version = "not found";
		for (int i = 0; i < attributes.length; i++) {
			// search vor version and use the value
			if (attributes[i].equals("@version")) iitc_version = attributes[i+1];
		}
		return iitc_version;
	}

	public void loadIITC_JS(Context c) throws java.io.IOException {

		StringBuilder sb = new StringBuilder();

		// in developer options, you are able to load the script from external source
		// if a http address is given, use script from this address. else use the local script
		SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(c);
		String iitc_source = sharedPref.getString("pref_iitc_source", "local");
		if (iitc_source.contains("http")) {
			URL url = new URL(iitc_source);
			sb.append(new Scanner(url.openStream(), "UTF-8").useDelimiter("\\A").next());
		} else {
			sb.append(getFile("total-conversion-build.user.js"));
		}

		this.js = sb.toString();

		boolean[] plugins = IITC_Mobile.getSelectedItems();
		for (int i = 0; i < IITC_Mobile.plugins_list.length; i++) {
			if (plugins[i]) {
				sb.append("\n");
				// FIXME: setTimeout solves just about everything when it comes to js
				sb.append("window.setTimeout(function() {");
				sb.append(getFile(IITC_Mobile.plugins_list[i]));
				sb.append("}, 100);");
			}
		}


		// need to wrap the mobile iitc.js version in a document ready. IITC
		// expects to be injected after the DOM has been loaded completely.
		// Since the mobile client injects IITC by replacing the gen_dashboard
		// file, IITC runs to early. The document.ready delays IITC long enough
		// so it boots correctly.
		String js = "$(document).ready(function(){" + sb.toString() + "});";

		iitcjs = new WebResourceResponse(
			"text/javascript",
			"UTF-8",
			new ByteArrayInputStream(js.getBytes())
		);
	};


	private String getFile(String fileName) {
		StringBuilder sb = new StringBuilder();
		BufferedReader br = null;
		try {
			br = new BufferedReader(new InputStreamReader(context.getAssets().open(fileName)));
			String line = "";
			Integer i = 0;
			while ((line = br.readLine()) != null) {
				sb.append(line).append("\n");
				i += 1;
			}
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			if (br != null) {
				try {
					br.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
		}
		return sb.toString();
	}


	// enable https
	@Override
	public void onReceivedSslError (WebView view, SslErrorHandler handler, SslError error) {
		handler.proceed() ;
	};

	// Check every external resource if it’s okay to load it and maybe replace it
	// with our own content. This is used to block loading Niantic resources
	// which aren’t required and to inject IITC early into the site.
	// via http://stackoverflow.com/a/8274881/1684530
	@Override
	public WebResourceResponse shouldInterceptRequest (final WebView view, String url) {
		if(url.contains("/css/common.css")) {
			return new WebResourceResponse("text/css", "UTF-8", style);
		} else if(url.contains("gen_dashboard.js")) {
			return this.iitcjs;
		} else if(url.contains("/css/ap_icons.css")
				|| url.contains("/css/map_icons.css")
				|| url.contains("/css/misc_icons.css")
				|| url.contains("/css/style_full.css")
				|| url.contains("/css/style_mobile.css")
				|| url.contains("/css/portalrender.css")
				|| url.contains("js/analytics.js")
				|| url.contains("google-analytics.com/ga.js")) {
			return new WebResourceResponse("text/plain", "UTF-8", empty);
		} else {
			return super.shouldInterceptRequest(view, url);
		}
	}

	// start non-ingress-intel-urls in another app...
	@Override
	public boolean shouldOverrideUrlLoading(WebView view, String url) {
		if (url.contains("ingress.com")) {
			return false;
		} else {
			Log.d("iitcm", "no ingress intel link, start external app to load url: " + url);
			Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
			context.startActivity(intent);
			return true;
		}
	}
}
