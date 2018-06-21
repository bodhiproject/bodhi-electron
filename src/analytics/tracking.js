const Mixpanel = require('mixpanel');
const _ = require('lodash');
const os = require('os');
const { Utils } = require('bodhi-server');

const MIXPANEL_TOKEN = '5c13e6b02fc222c0adae2f1f8cd923b0';

let mixpanel;

class Tracking {
  static track(eventName) {
    if (_.isEmpty(eventName)) {
      console.error('Mixpanel eventName cannot be empty');
      return;
    }

    // Instantiate if not instantiated yet
    if (!mixpanel) {
      mixpanel = Mixpanel.init(MIXPANEL_TOKEN);
    }

    // Only track in production build
    if (!Utils.isDevEnv()) {
      mixpanel.track(eventName, { id: getTrackingId() });
    }
  }

  static mainnetStart() {
    this.track('mainnet-start');
  }

  static testnetStart() {
    this.track('testnet-start');
  }
}

function getTrackingId() {
  return `${os.hostname()}.${os.userInfo().username}.${os.platform()}.${os.arch()}`;
}

module.exports = Tracking;
