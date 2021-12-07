package io.invertase.googleads;

/*
 * Copyright (c) 2016-present Invertase Limited & Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this library except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import io.invertase.googleads.common.ReactNativeApp;
import io.invertase.googleads.common.RCTConvert;
import io.invertase.googleads.common.ReactNativeEvent;
import io.invertase.googleads.common.ReactNativeEventEmitter;
import io.invertase.googleads.common.ReactNativeJSON;
import io.invertase.googleads.common.ReactNativeMeta;
import io.invertase.googleads.common.ReactNativePreferences;
import io.invertase.googleads.common.ReactNativeModule;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ReactNativeAppModule extends ReactNativeModule {
  private static final String TAG = "RNAppModule";

  ReactNativeAppModule(ReactApplicationContext reactContext) {
    super(reactContext, TAG);
  }

  @Override
  public void initialize() {
    super.initialize();
    ReactNativeEventEmitter.getSharedInstance().attachReactContext(getContext());
  }

  @ReactMethod
  public void initializeApp(ReadableMap options, ReadableMap appConfig, Promise promise) {
    // ReactNativeApp reactNativeApp =
    //     RCTConvertFirebase.readableMapToFirebaseApp(options, appConfig, getContext());

    // WritableMap reactNativeAppMap = RCTConvertFirebase.reactNativeAppToWritableMap(reactNativeApp);
    // promise.resolve(reactNativeAppMap);
    promise.resolve(options);
  }

  @ReactMethod
  public void setAutomaticDataCollectionEnabled(String appName, Boolean enabled) {
    // ReactNativeApp reactNativeApp = ReactNativeApp.getInstance(appName);
    // reactNativeApp.setDataCollectionDefaultEnabled(enabled);
  }

  @ReactMethod
  public void deleteApp(String appName, Promise promise) {
    // ReactNativeApp reactNativeApp = ReactNativeApp.getInstance(appName);

    // if (reactNativeApp != null) {
    //   reactNativeApp.delete();
    // }

    promise.resolve(null);
  }

  @ReactMethod
  public void eventsNotifyReady(Boolean ready) {
    ReactNativeEventEmitter emitter = ReactNativeEventEmitter.getSharedInstance();
    emitter.notifyJsReady(ready);
  }

  @ReactMethod
  public void eventsGetListeners(Promise promise) {
    ReactNativeEventEmitter emitter = ReactNativeEventEmitter.getSharedInstance();
    promise.resolve(emitter.getListenersMap());
  }

  @ReactMethod
  public void eventsPing(String eventName, ReadableMap eventBody, Promise promise) {
    ReactNativeEventEmitter emitter = ReactNativeEventEmitter.getSharedInstance();
    emitter.sendEvent(
        new ReactNativeEvent(
            eventName, RCTConvert.readableMapToWritableMap(eventBody)));
    promise.resolve(RCTConvert.readableMapToWritableMap(eventBody));
  }

  @ReactMethod
  public void eventsAddListener(String eventName) {
    ReactNativeEventEmitter emitter = ReactNativeEventEmitter.getSharedInstance();
    emitter.addListener(eventName);
  }

  @ReactMethod
  public void eventsRemoveListener(String eventName, Boolean all) {
    ReactNativeEventEmitter emitter = ReactNativeEventEmitter.getSharedInstance();
    emitter.removeListener(eventName, all);
  }

  @ReactMethod
  public void addListener(String eventName) {
    // Keep: Required for RN built in Event Emitter Calls.
  }

  @ReactMethod
  public void removeListeners(Integer count) {
    // Keep: Required for RN built in Event Emitter Calls.
  }

  /** ------------------ META ------------------ */
  @ReactMethod
  public void metaGetAll(Promise promise) {
    promise.resolve(ReactNativeMeta.getSharedInstance().getAll());
  }

  /** ------------------ JSON ------------------ */
  @ReactMethod
  public void jsonGetAll(Promise promise) {
    promise.resolve(ReactNativeJSON.getSharedInstance().getAll());
  }

  /** ------------------ PREFERENCES ------------------ */
  @ReactMethod
  public void preferencesSetBool(String key, boolean value, Promise promise) {
    ReactNativePreferences.getSharedInstance().setBooleanValue(key, value);
    promise.resolve(null);
  }

  @ReactMethod
  public void preferencesSetString(String key, String value, Promise promise) {
    ReactNativePreferences.getSharedInstance().setStringValue(key, value);
    promise.resolve(null);
  }

  @ReactMethod
  public void preferencesGetAll(Promise promise) {
    promise.resolve(ReactNativePreferences.getSharedInstance().getAll());
  }

  @ReactMethod
  public void preferencesClearAll(Promise promise) {
    ReactNativePreferences.getSharedInstance().clearAll();
    promise.resolve(null);
  }

  @Override
  public Map<String, Object> getConstants() {
    Map<String, Object> constants = new HashMap<>();
    // List<Map<String, Object>> appsList = new ArrayList<>();
    // List<ReactNativeApp> reactNativeApps = ReactNativeApp.getApps(getReactApplicationContext());

    // for (ReactNativeApp app : reactNativeApps) {
    //   appsList.add(RCTConvertFirebase.reactNativeAppToMap(app));
    // }

    // constants.put("NATIVE_FIREBASE_APPS", appsList);

    // constants.put("FIREBASE_RAW_JSON", ReactNativeJSON.getSharedInstance().getRawJSON());

    return constants;
  }
}
