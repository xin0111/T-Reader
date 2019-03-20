const bg = chrome.extension.getBackgroundPage();

import {getSyncConfig} from './config';

import * as bing from './dictionaries/bing-engine';

import * as Engine from 'tjsBrowser';

import * as d3plus from 'd3plusText';

import {handleNetWorkError} from './dictionaries/fetch-dom';
//创建svg显示
export function
    twords(text)
{
    if (undefined == text)
        return;

    getSyncConfig().then(config => {
        textRender(config, text);
    });
}

function textRender(config, text)
{ //换行符处理
    var sentence = text.replace(/↵|\n/g, " <br/> ");
    var textBox
        = new d3plus.TextBox()
              .width(window.innerWidth)
              .height(window.innerHeight)
              // .fontResize(function(d, i) {
              // return true;
              // })
              .fontSize(function() {
                  return Number(config.fontSize);
              })
              .data([ { text : sentence } ])
              .x(function(d, i) {
                  return i * 100;
              })
              .transData(function(word) {                 
                  return bg.getWordTrans(word);
              })
              .render();

    var words = d3plus.textSplit(text);

    if (config.engine === 'bing') {
        bing_search(textBox, words, config);
    } else {
        tjs_search(textBox, words, config);
    }
}

function tjs_search(textBox, words, config)
{    
    for (var i = 0; i < words.length; ++i) {
        bg.findWordInfo(words[i]).then((resp) => {                               
                var word = resp.text;
                var trans = resp.info !=undefined  ? resp.info.result[0] : undefined;
                var to = resp.info !=undefined  ? resp.info.to : undefined;

                if (trans === undefined || trans === '...' 
                || trans === '---' || to != config.to)
                    Engine[config.engine].translate({
                        text: word,
                        to:config.to
                    }
                    ).catch(err => handleNetWorkError(err.message)).then(function(result) {
                        refreshTextBox(result, textBox);
                    });
                //更新显示
                textBox.render(); 
        });

    }
}

function bing_search(textBox, words,config)
{
    for (var i = 0; i < words.length; ++i) {
        bg.findWordInfo(words[i]).then((resp) => {             
                var word = resp.text;
                var trans = resp.info !=undefined  ? resp.info.result[0] : undefined;
                var to = resp.info !=undefined  ? resp.info.to : undefined;          
                if (trans === undefined || trans === '...' 
                || trans === '---'|| to != config.to)
                    bing.translate(word).then((result) => {
                        refreshTextBox(result, textBox);
                    });

                    //更新显示
                    textBox.render(); 
                });
            }
}

function refreshTextBox(result, textBox)
{
    //console.log(result.result);
  new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            action : 'createWord',
            data : result
        },
         (resp) => {               
                //更新显示
                textBox.render();
            });
      });
}