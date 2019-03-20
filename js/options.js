//显示布局
import 'element-ui/lib/theme-default/index.css'
import ElementUI from 'element-ui';
import keyboardJS from 'keyboardjs';
import _ from 'underscore';
import Vue from 'vue';
import SocialSharing from 'vue-social-sharing';
import browser from 'webextension-polyfill';

import {getSyncConfig,
    languages,
    wordLevelInfo} from '../js/config';
import * as i18n from '../js/message';
import {getParameterByName} from '../js/utils'
import wordRoots from '../js/wordroots';
import $ from 'jquery'

Vue.use(SocialSharing);

const chrome = window.chrome;
const bg = chrome.extension.getBackgroundPage();
const manifest = chrome.runtime.getManifest();
const version = manifest.version;
const appName = manifest.name;

const TRANSLATE_ENGINS =
    [ {
         label : 'Baidu',
         value : 'baidu'
     },
        {
            label : 'Google',
            value : 'google'
        }
        //,
        // {
        //     label : 'Bing',
        //     value : 'bing'
        // } 
    ];

Vue.use(ElementUI);

function
init()
{
    Promise.all([
               getSyncConfig()
           ])
        .then(([ config ]) => {
            render(config);
        });
}

const tabs = [ 'general', 'wordbook', 'wordroots' ];

function render(config)
{
    let activeName = getParameterByName('tab') || 'general';

    if (config.version < version) {
        config.version = version;
        activeName = 'update';
    }

    const app = new Vue({
        el : '#app',
        data : function() {
            return  {
                i18n,
                // tab
                activeName,
                appName,
                config,
                TRANSLATE_ENGINS,                
                wordRoots,
                languages,
                wordLevelInfo,
                wordBook: [],
                wordbookFilter: {
                    wordSearchText : '',
                    levels:[0,2]
                },
                // roots
                wordRootsFilter: {
                    searchText : ''
                },

                // sync
                version
            } },
        computed : {
            //计算
            filteredWordBook() {
                //单词本显示(wordbookFilter 参数存在变化即会调用该函数)
                let filter = this.wordbookFilter;

                return this.filterWords(filter);
            },
            filteredRoots() {
                //词根筛选
                let { searchText } = this.wordRootsFilter;

                let results = this.wordRoots;

                if (searchText) {
                    results = results.filter(({ root }) => {
                        return root.toLowerCase().indexOf(searchText.toLowerCase()) !== -1;
                    });
                }

                return results;
            }

        },
        watch : {
            //监听
            activeName() {
                let activeName = this.activeName;
                if (activeName === 'wordbook') {
                    this.loadWordBook();
                }
            }
        },
        mounted : function() {

        },
        methods : {
            //方法
            handleClick : function(tab) {
                //tab 切换
            },
            tableRowStyle({ row, rowIndex }) {
                return "background-color:#20a0ff";
            },
            handleConfigSubmit() {
                //通用保存
                this.saveConfig();
            },
            saveConfig : function(silent) {
                //保存配制
                let newConfig = JSON.parse(JSON.stringify(this.config));

                browser.storage.sync.set({
                                        config : newConfig
                                    })
                    .then(resp => {
                        if (!silent) {
                            this.$message(i18n.msg.saveok);
                        }
                    });
            },
            loadWordBook() {
                //加载存储单词列表
                bg.getWordBook().then((words) => {                      
                        if (words) {
                            this.wordBook = words;
                        }
                    });
            },
            filterWords(filter) {

                let { wordSearchText, levels } = filter;

                let results = this.wordBook;

                if (wordSearchText) {
                    results = results.filter(word => {
                        return word.text.toLowerCase().indexOf(wordSearchText.toLowerCase()) !== -1;
                    });
                } else {
                    if (levels.length) {
                        results = results.filter(({ level }) => {
                            return levels.indexOf(level.value) !== -1;     
                        });
                    }
                }
                return results;
            },
            getPhonetic(row, column){
                return row.phonetic ? row.phonetic[0].value : "";    
            },
            handleLevelFilterClick(level) {
                //init
                this.wordbookFilter.wordSearchText = '';

                let index = this.wordbookFilter.levels.indexOf(level);

                if (index > -1) {
                    this.wordbookFilter.levels.splice(index, 1);
                } else {
                    this.wordbookFilter.levels.push(level);
                }
                if(this.wordbookFilter.levels.length ===0)
                {// 新单词显示
                    this.wordbookFilter.levels.push(0);
                }
                //filter words will auto call "filteredWordBook"
            },
            handleEditorWordOk(index, row) {             
                 //->熟悉词
                 row.level.value = 1;

                this.saveWord(row); 
               
            },
            handleEditorWordNext(index, row) {         

                //熟悉词 双击-->陌生词
                row.level.value = 2;

                this.saveWord(row); 
               
            },
            handleMarkAllNewWordClick() {
                let wordBook = this.wordBook;
                let nextWords = wordBook.filter(({ level }) => {
                    return (level.value === 0);        
                });   
                 //批量更新为->熟悉词
                nextWords.forEach(wordInfo => {
                    wordInfo.level.value = 1;
                    this.saveWord(wordInfo);
                });             
            },
            saveWord(wordInfo) {
                wordInfo.level.text = wordLevelInfo[wordInfo.level.value];

                if (wordInfo && wordInfo.text) {
                    bg.updateWord(wordInfo);
                } 
            },
            downloadAsJson(words) {
                let content = "data:text/json;charset=utf-8,";

                content +="[\n";
                words.forEach(({ text, result = [], dict, level = {},to}, index) => {
                    let wordString = `{\n\t"text":"${text}","result":"${result}",\n\t"dict":"${dict}",\n\t"level":"${level.value}",\n\t"to":"${to}"\n}`;
                
                    content += index < words.length-1 ? wordString+ ",\n" : wordString +"\n";
                });
                content +="]";
                let encodedUri = encodeURI(content);

                this.download(encodedUri, 't-reader.json');
            },
            
            download(url, name) {
                const downloadAnchorNode = document.createElement('a');

                downloadAnchorNode.setAttribute('href', url);
                downloadAnchorNode.setAttribute('download', name);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
            },
            handleExportClick() {  
                let wordStorage = this.wordBook;
                const obj = JSON.parse(JSON.stringify(wordStorage));
                this.downloadAsJson(obj);               
            },
            handleImportClick() {                  
                //   $.getJSON("",function(data){
                //   });
            }
        }
    });

    function bindEvents()
    {
        let keys = [ 'alt + 1', 'alt + 2', 'alt + 3', 'alt + 4', 'alt + 5', 'alt + 6', 'alt + 7' ];

        keys.forEach((key, index) => {
            keyboardJS.on(key, _ => {
                app.activeName = tabs[index];
            });
        });
    }

    bindEvents();
}

init();