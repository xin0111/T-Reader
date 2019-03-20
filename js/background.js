
import './storage/backbone.chromestorage'

import _ from 'underscore'

import {wordLevelInfo} from '../js/config';

import {WordList} from './storage/WordList'

import  localforage from './storage/localforage'

import {getSyncConfig} from './config'
//window 声明全局变量
window.selectTextMap = {};
window.dictData = {};
window.displayAll = false;
window.displayPhonetic =true;

localforage.setDriver(localforage.INDEXEDDB);

//打开翻译页
window.openTranslationTab
    = function(text) {
          chrome.tabs.create(
              { url : chrome.runtime.getURL('tselection.html') }, function(tab) {
                  getCurrentTabId(tabId => {
                      selectTextMap[tabId] = text;
                  });
              });
      };

// 获取当前选项卡ID
window.getCurrentTabId
    = function(callback) {        
          chrome.tabs.query({active : true, currentWindow : true }, function(tabs) {
              if (callback)
                  callback(tabs.length ? tabs[0].id : null);
          });
      };

// 获取当前选项卡 text
window.getCurrentTabText
    = function(callback) {
          getCurrentTabId(tabId => {
              callback(selectTextMap[tabId]);
          });
      };



//菜单
chrome.contextMenus.create({
    title : '翻译：%s', // %s表示选中的文字
    contexts : [ 'selection' ], // 只有当选中文字时才会出现此右键菜单
    onclick : function(params) {
        openTranslationTab(params.selectionText);
    }
});

//删除
chrome.tabs.onRemoved.addListener(function(id) {
    delete selectTextMap[id];
});

//msg监听
['onMessage', 'onMessageExternal'].forEach((msgType) => {
    chrome.runtime[msgType].addListener(msgHandler);
});

window.storeDictData =
    function(word,info)
    {
        dictData[word] = info;
    };
    
function
init()
{
    Promise.all([
                getSyncConfig()
            ])
        .then(([ config ]) => {
            displayAll = config.displayWordok;
            displayPhonetic = config.displayPhonetic;
        });
}

chrome.storage.onChanged.addListener(function(changes, namespace) {

    if (namespace==="sync")
    {//更新“显示 熟悉词”设置
        var storageChange = changes['config'];
        if(storageChange)
        {
            displayAll= storageChange.newValue.displayWordok;
            displayPhonetic= storageChange.newValue.displayPhonetic;
        }
    }
});


window.getWordTrans = 
    function(word)
    {
        var info = dictData[word];
        if (info)
        {
           var trans = info['result'][0];           
           var phonetic = info.phonetic ? info.phonetic[0].value:"";
           if(displayPhonetic) 
                trans = phonetic + " " + trans;
           return displayAll?  trans : info['level'].value === 1 ? "" : trans ;           
        }
        return "";
    };

var wordsHelper = {

    createWord : function(info) {
        if (!info.text) {
            return;
        }   
        //存储
        let wordInfo = {
            ...info,
            level : {
                value : 0,
                text : wordLevelInfo[0]
            }
        };
        storeDictData(info.text, wordInfo);

        return localforage.setItem(info.text, wordInfo
        ,
            function() {
                //console.log('Saved: ' + info);
            });
    }
};

window.findWordInfo = function(word) {
    return localforage.getItem(word).then((readValue) => {            
        if (readValue) {               
            storeDictData(word,readValue);      
            return  {                 
                text:word,
                info:readValue                 
            };
        } else
            return{
                text:word,
                info:undefined
            };
    });
}

//读取所有存储单词
window.getWordBook = function() {
    let Words = [];
    return localforage.iterate((function(result) {
                          Words.push({...result });
                      }))
        .then(() => {
            //toJSON
            var words = _.clone(Words);
            return words;
        });
}
//更新单词
window.updateWord = function(attrs)
{
    return localforage.setItem(attrs.text, attrs, 
        function() {});
}

function msgHandler(requst, sender, response)
{
    let data = requst.data;
    let action = requst.action;
    //创建单词
    if (action === 'createWord') {
        wordsHelper.createWord(data);    
        response('create word');
    }
    if (action === 'opentab') {
        openTranslationTab(data);
        response('opentab ok');
    }
}

init();