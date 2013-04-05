package com.cradle.iitc_mobile;

import java.io.IOException;
import java.util.ArrayList;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.OnSharedPreferenceChangeListener;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.NetworkInfo.State;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.StrictMode;
import android.preference.PreferenceManager;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.Toast;

public class IITC_Mobile extends Activity {

	private IITC_WebView iitc_view;
	private boolean back_button_pressed = false;
	private boolean desktop = false;
	private OnSharedPreferenceChangeListener listener;

	static String[] plugins_list;
	static SharedPreferences mPrefs;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		// TODO build an async task for url.openStream() in IITC_WebViewClient
		StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
		StrictMode.setThreadPolicy(policy);

		mPrefs = PreferenceManager.getDefaultSharedPreferences(this);
		initPluginsList();

		setContentView(R.layout.activity_main);
		iitc_view = (IITC_WebView) findViewById(R.id.iitc_webview);

		listener = new OnSharedPreferenceChangeListener() {
			@Override
			public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) {
				if (key.equals("pref_force_desktop"))
					desktop = sharedPreferences.getBoolean("pref_force_desktop", false);
				// reload intel map
				iitc_view.loadUrl(addUrlParam("https://www.ingress.com/intel"));
				injectJS();
			}
		};
		mPrefs.registerOnSharedPreferenceChangeListener(listener);

		// we do not want to reload our page every time we switch orientations...
		// so restore state if activity was already created
		if(savedInstanceState != null) {
			iitc_view.restoreState(savedInstanceState);
		}
		else {
			// load new iitc web view with ingress intel page
			Intent intent = getIntent();
			String action = intent.getAction();
			if (Intent.ACTION_VIEW.equals(action)) {
				Uri uri = intent.getData();
				String url = uri.toString();
				if (intent.getScheme().equals("http://"))
					url = url.replace("http://", "https://");
				Log.d("Intent received", "url: " + url);
				if (url.contains("ingress.com")) {
					Log.d("Intent received", "loading url...");
					iitc_view.loadUrl(addUrlParam(url));
				}
			}
			else {
				Log.d("No Intent call", "loading https://www.ingress.com/intel");
				iitc_view.loadUrl(addUrlParam("https://www.ingress.com/intel"));
			}
		}
	}

	@Override
	protected void onResume() {
		// enough idle...let's do some work
		iitc_view.loadUrl("javascript: window.idleTime = 0");
		iitc_view.loadUrl("javascript: window.renderUpdateStatus()");
		super.onResume();
	}

	@Override
	protected void onStop() {
		ConnectivityManager conMan = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);

		State mobile = conMan.getNetworkInfo(0).getState();
		State wifi = conMan.getNetworkInfo(1).getState();

		if (mobile == NetworkInfo.State.CONNECTED || mobile == NetworkInfo.State.CONNECTING) {
			// cancel all current requests
			iitc_view.loadUrl("javascript: window.requests.abort()");
			// set idletime to maximum...no need for more
			iitc_view.loadUrl("javascript: window.idleTime = 999");
		} else if (wifi == NetworkInfo.State.CONNECTED || wifi == NetworkInfo.State.CONNECTING) {
			iitc_view.loadUrl("javascript: window.idleTime = 999");
		}
		super.onStop();
	}

	private void initPluginsList() {
		try {
		String[] assets = getAssets().list("");

		ArrayList<String> plugins = new ArrayList<String>();

		for (int i = 0; i < assets.length; i += 1) {
			if (!assets[i].equals("iitc.js") && assets[i].substring(assets[i].length() - 3).equals(".js")) {
				plugins.add(assets[i]);
				Log.d(this.getClass().getSimpleName(), "plugin " + i + " :" + assets[i]);
			}
		}

		plugins_list = new String[plugins.size()];
		plugins.toArray(plugins_list);

		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	// save instance state to avoid reloading on orientation change
	@Override
	protected void onSaveInstanceState(Bundle outState) {
		iitc_view.saveState(outState);
	}

	// we want a self defined behavior for the back button
	@Override
	public void onBackPressed() {
		if (this.back_button_pressed) {
			super.onBackPressed();
			return;
		}

		iitc_view.loadUrl("javascript: window.goBack();");
		this.back_button_pressed = true;
		Toast.makeText(this, "Press twice to exit", Toast.LENGTH_SHORT).show();

		// reset back button after 0.5 seconds
		new Handler().postDelayed(new Runnable() {
			@Override
			public void run() {
				back_button_pressed=false;
			}
		}, 500);
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		getMenuInflater().inflate(R.menu.main, menu);
		return true;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		// Handle item selection
		switch (item.getItemId()) {
		case R.id.reload_button:
			iitc_view.loadUrl(addUrlParam("https://www.ingress.com/intel"));
			injectJS();
			return true;
		case R.id.select_plugins:
			AlertDialog.Builder builder = new AlertDialog.Builder(this);
			builder
				.setTitle(R.string.select_plugins)
				.setMultiChoiceItems(plugins_list, getSelectedItems(),
					new DialogInterface.OnMultiChoiceClickListener() {
						@Override
						public void onClick(DialogInterface dialog, int which, boolean isChecked) {
							mPrefs.edit().putBoolean(plugins_list[which], isChecked).commit();
						}
					})

				.setPositiveButton(R.string.reload, new DialogInterface.OnClickListener() {
					public void onClick(DialogInterface dialog, int id) {
						Toast.makeText(IITC_Mobile.this, "Reloading...", Toast.LENGTH_SHORT).show();
						iitc_view.loadUrl(addUrlParam("https://www.ingress.com/intel"));
						injectJS();
					}
				})
				.setNegativeButton(R.string.cancel, null);

			AlertDialog dialog = builder.create();
			dialog.show();

			return true;
		// clear cache
		case R.id.cache_clear:
			iitc_view.clearHistory();
			iitc_view.clearFormData();
			iitc_view.clearCache(true);
			return true;
		// get the users current location and focus it on map
		case R.id.locate:
			iitc_view.loadUrl("javascript: window.map.locate({setView : true, maxZoom: 13});");
			return true;
		case R.id.settings:
			Intent intent = new Intent(this, IITC_Settings.class);
			intent.putExtra("iitc_version", iitc_view.getWebViewClient().getIITCVersion());
			startActivity(intent);
			return true;
		default:
			return super.onOptionsItemSelected(item);
		}
	}

	private void injectJS() {
		try {
			iitc_view.getWebViewClient().loadIITC_JS(this);
		} catch (IOException e1) {
			e1.printStackTrace();
		} catch (NullPointerException e2) {
			e2.printStackTrace();
		}
	}

	private boolean[] getSelectedItems() {
		boolean[] selected_plugins = new boolean[plugins_list.length];
		for (int i = 0; i < plugins_list.length; i++) {
			selected_plugins[i] = mPrefs.getBoolean(plugins_list[i], true);
		}
		return selected_plugins;
	}

	private String addUrlParam(String url) {
		SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(this);
		this.desktop = sharedPref.getBoolean("pref_force_desktop", false);

		if (desktop)
			return (url + "?vp=f");
		else
			return (url + "?vp=m");
	}
}
