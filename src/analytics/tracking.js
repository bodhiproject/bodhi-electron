const Mixpanel = require('mixpanel');
const _ = require('lodash');
const os = require('os');

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
      mixpanel = Mixpanel.init(AppConfig.analytics.mixpanelToken);
    }

    // Only track in production build
    if (process.env && process.env.NODE_ENV === 'production') {
      mixpanel.track(eventName);
    }
  }

  static appStart() {
    this.track('AppStart');
  }
}

function getMacAddress() {
  const interfaces = os.networkInterfaces();
  if (!_.isEmpty(interfaces.eth0)) {
    return interfaces.eth0[0].mac;
  }
  return null;
}

module.exports = {
  Tracking,
  getMacAddress,
};
