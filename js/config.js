import browser from 'webextension-polyfill'

import * as i18n from '../js/message';

import {getLangCode} from './utils'

const manifest = chrome.runtime.getManifest();
const version = manifest.version;

export const defaultConfig = {
    fontSize : 20,
    to : getLangCode(chrome.i18n.getUILanguage()),
    autoSetFrom : true,
    engine : 'baidu',
    displayWordok : false,
    displayPhonetic: true,
    version
}

// https://cloud.google.com/translate/docs/languages
export const languages
    = [ "zh-CN", "zh-TW", "en", "ja" ];

export const wordLevelInfo = [ i18n.msg.newword, i18n.msg.wordok, i18n.msg.wordnext ];

// merge config && save
export function
getSyncConfig()
{
    return browser.storage.sync.get('config').then(({ config }) => {
        if (!config) {
            config = defaultConfig;
        } else {
            config = Object.assign({}, defaultConfig, config);
        }

        browser.storage.sync.set({ config });

        return config;
    });
}
