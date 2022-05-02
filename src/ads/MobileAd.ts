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

import { EmitterSubscription } from 'react-native';
import { isFunction, isOneOf } from '../common';
import { NativeError } from '../internal/NativeError';
import { AdEventType } from '../AdEventType';
import { RewardedAdEventType } from '../RewardedAdEventType';
import { AdEventListener, AdEventPayload } from '../types/AdEventListener';
import { AdEventsListener } from '../types/AdEventsListener';
import { AdShowOptions } from '../types/AdShowOptions';
import { RequestOptions } from '../types/RequestOptions';
import { MobileAdInterface } from '../types/MobileAd.interface';
import { MobileAdsModuleInterface } from '../types/MobileAdsModule.interface';
import { RewardedAdReward } from '../types/RewardedAdReward';
import { GAMAdEventType } from '../GAMAdEventType';
import { AppEvent } from '../types/AppEvent';
import { validateAdShowOptions } from '../validateAdShowOptions';

type EventType = AdEventType | RewardedAdEventType | GAMAdEventType;

export abstract class MobileAd implements MobileAdInterface {
  protected _type: 'app_open' | 'interstitial' | 'rewarded' | 'rewarded_interstitial';
  protected _googleMobileAds: MobileAdsModuleInterface;
  protected _requestId: number;
  protected _adUnitId: string;
  protected _requestOptions: RequestOptions;
  protected _loaded: boolean;
  protected _isLoadCalled: boolean;
  protected _destroyed: boolean;
  protected _adEventsListeners: Map<number, AdEventsListener<EventType>>;
  protected _adEventListenersMap: Map<EventType, Map<number, AdEventListener<EventType>>>;
  protected _adEventsListenerId: number;
  protected _adEventListenerId: number;
  protected _nativeListener: EmitterSubscription;

  protected constructor(
    type: 'app_open' | 'interstitial' | 'rewarded' | 'rewarded_interstitial',
    googleMobileAds: MobileAdsModuleInterface,
    requestId: number,
    adUnitId: string,
    requestOptions: RequestOptions,
  ) {
    this._type = type;
    this._googleMobileAds = googleMobileAds;
    this._requestId = requestId;
    this._adUnitId = adUnitId;
    this._requestOptions = requestOptions;

    this._loaded = false;
    this._isLoadCalled = false;
    this._destroyed = false;
    this._adEventsListeners = new Map();
    this._adEventListenersMap = new Map();
    Object.values({
      ...AdEventType,
      ...RewardedAdEventType,
      ...GAMAdEventType,
      _: AdEventType.LOADED, // since AdEventType.LOADED is overwritten by RewardedAdEventType.LOADED
    }).forEach(type => {
      this._adEventListenersMap.set(type as EventType, new Map());
    });
    this._adEventListenerId = 0;
    this._adEventsListenerId = 0;

    this._nativeListener = googleMobileAds.emitter.addListener(
      `google_mobile_ads_${type}_event:${adUnitId}:${requestId}`,
      this._handleAdEvent.bind(this),
    );
  }

  protected _handleAdEvent(event: {
    body: {
      type: EventType;
      error?: { code: string; message: string };
      data?: RewardedAdReward | AppEvent;
    };
  }) {
    const { type, error, data } = event.body;

    if (type === AdEventType.LOADED || type === RewardedAdEventType.LOADED) {
      this._loaded = true;
    }

    if (type === AdEventType.CLOSED) {
      this._loaded = false;
      this._isLoadCalled = false;
    }

    let payload: AdEventPayload<EventType> = data;
    if (error) {
      payload = NativeError.fromEvent(error, 'googleMobileAds');
    }
    this._adEventsListeners.forEach(listener => {
      listener({
        type,
        payload,
      });
    });
    this._getAdEventListeners(type).forEach(listener => {
      listener(payload);
    });
  }

  protected _addAdEventsListener<T extends EventType>(listener: AdEventsListener<T>) {
    this._checkDestroyed();
    if (!isFunction(listener)) {
      throw new Error(`${this._className}.addAdEventsListener(*) 'listener' expected a function.`);
    }

    const id = this._adEventsListenerId++;
    this._adEventsListeners.set(id, listener as AdEventsListener<EventType>);
    return () => {
      this._adEventsListeners.delete(id);
    };
  }

  protected _addAdEventListener<T extends EventType>(type: T, listener: AdEventListener<T>) {
    this._checkDestroyed();
    if (
      !(
        isOneOf(type, Object.values(AdEventType)) ||
        (isOneOf(type, Object.values(RewardedAdEventType)) && this._type === 'rewarded')
      )
    ) {
      throw new Error(
        `${this._className}.addAdEventListener(*) 'type' expected a valid event type value.`,
      );
    }
    if (!isFunction(listener)) {
      throw new Error(
        `${this._className}.addAdEventListener(_, *) 'listener' expected a function.`,
      );
    }

    const id = this._adEventListenerId++;
    this._getAdEventListeners(type).set(id, listener);
    return () => {
      this._getAdEventListeners(type).delete(id);
    };
  }

  protected _getAdEventListeners<T extends EventType>(type: T) {
    return this._adEventListenersMap.get(type) as Map<number, AdEventListener<T>>;
  }

  protected get _className() {
    return this.constructor.name;
  }

  protected get _camelCaseType() {
    let type: 'appOpen' | 'interstitial' | 'rewarded' | 'rewardedInterstitial';
    if (this._type === 'app_open') {
      type = 'appOpen';
    } else if (this._type === 'rewarded_interstitial') {
      type = 'rewardedInterstitial';
    } else {
      type = this._type;
    }
    return type;
  }

  protected _checkDestroyed() {
    if (this._destroyed) {
      throw new Error(`This ${this._className} instance has been destroyed.`);
    }
  }

  public load() {
    this._checkDestroyed();
    // Prevent multiple load calls
    if (this._loaded || this._isLoadCalled) {
      return;
    }

    this._isLoadCalled = true;
    const load = this._googleMobileAds.native[`${this._camelCaseType}Load`];
    load(this._requestId, this._adUnitId, this._requestOptions);
  }

  public show(showOptions?: AdShowOptions) {
    this._checkDestroyed();
    if (!this._loaded) {
      throw new Error(
        `${this._className}.show() The requested ${this._className} has not loaded and could not be shown.`,
      );
    }

    let options;
    try {
      options = validateAdShowOptions(showOptions);
    } catch (e) {
      if (e instanceof Error) {
        throw new Error(`${this._className}.show(*) ${e.message}.`);
      } else {
        throw e;
      }
    }

    const show = this._googleMobileAds.native[`${this._camelCaseType}Show`];
    return show(this._requestId, this._adUnitId, options);
  }

  public abstract addAdEventsListener<T extends never>(listener: AdEventsListener<T>): () => void;

  public abstract addAdEventListener<T extends never>(type: T, listener: AdEventListener<T>): void;

  public removeAllListeners() {
    this._checkDestroyed();
    this._adEventsListeners.clear();
    this._adEventListenersMap.forEach((_, type, map) => {
      map.set(type, new Map());
    });
  }

  public destroy() {
    this._checkDestroyed();
    const destroy = this._googleMobileAds.native[`${this._camelCaseType}Destroy`];
    destroy(this._requestId);
    this.removeAllListeners();
    this._nativeListener.remove();
  }

  public get adUnitId() {
    return this._adUnitId;
  }

  public get loaded() {
    return this._loaded;
  }
}
