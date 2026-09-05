package com.deliveryattendance.app;

import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DeviceSecurity")
public class DeviceSecurityPlugin extends Plugin {

    @PluginMethod
    public void check(PluginCall call) {
        String androidId = Settings.Secure.getString(
                getContext().getContentResolver(), Settings.Secure.ANDROID_ID);
        boolean developerOptions = Settings.Global.getInt(
                getContext().getContentResolver(),
                Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, 0) == 1;
        String mockLocationApp = Settings.Secure.getString(
                getContext().getContentResolver(), "mock_location_app");
        boolean mockLocation = mockLocationApp != null && !mockLocationApp.trim().isEmpty();

        JSObject result = new JSObject();
        result.put("deviceId", "A-" + androidId);
        result.put("developerOptions", developerOptions);
        result.put("mockLocation", mockLocation);
        call.resolve(result);
    }

    @PluginMethod
    public void openUpdate(PluginCall call) {
        String url = call.getString("url");
        if (url == null || !url.startsWith("https://")) {
            call.reject("Invalid update URL");
            return;
        }
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception error) {
            call.reject("Unable to open update URL", error);
        }
    }
}
