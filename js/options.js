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
        },
        {
            label : 'Bing',
            value : 'bing'
        } ];

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
                    displayLevel0 : true,
                    displayLevel1 : false,
                    displayLevel2 : true
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

                let { wordSearchText, displayLevel0, displayLevel1, displayLevel2 } = filter;

                let results = this.wordBook;

                if (wordSearchText) {
                    results = results.filter(word => {
                        return word.text.toLowerCase().indexOf(wordSearchText.toLowerCase()) !== -1;
                    });
                } else {
                    //判断level
                    if (displayLevel0) {
                        if (displayLevel1 && displayLevel2) {
                            //0,1,2都显示
                            results = results.filter(({ level }) => {
                                return level.value === 0 || level.value === 1 || level.value === 2;
                            });
                        } else if (displayLevel1 && !displayLevel2) {
                            //0,1显示;2不显示
                            results = results.filter(({ level }) => {
                                return level.value === 0 || level.value === 1;
                            });
                        } else if (!displayLevel1 && displayLevel2) {
                            //0,2显示;1不显示
                            results = results.filter(({ level }) => {
                                return level.value === 0 || level.value === 2;
                            });
                        } else if (!displayLevel1 && !displayLevel2) {
                            //0显示;1,2不显示
                            results = results.filter(({ level }) => {
                                return level.value === 0;
                            });
                        }
                    } else {
                        if (displayLevel1 && displayLevel2) {
                            //0不显示;1,2都显示
                            results = results.filter(({ level }) => {
                                return level.value === 1 || level.value === 2;
                            });
                        } else if (displayLevel1 && !displayLevel2) {
                            //1显示;0,2不显示
                            results = results.filter(({ level }) => {
                                return level.value === 1;
                            });
                        } else if (!displayLevel1 && displayLevel2) {
                            //2显示;0,1不显示
                            results = results.filter(({ level }) => {
                                return level.value === 2;
                            });
                        }
                    }
                }
                return results;
            },
            handleLevelFilterClick(level) {
                //init
                this.wordbookFilter.wordSearchText = '';
                if (!this.wordbookFilter.displayLevel0) {
                    this.wordbookFilter.displayLevel0 = !this.wordbookFilter.displayLevel1 && !this.wordbookFilter.displayLevel2;
                }
                //filter words will auto call "filteredWordBook"
            },
            handleEditorWordLevel(row) {
                let { level } = row;

                if (level.value === 0) {
                    //新单词 双击-->陌生词
                    row.level.value = 2;
                } else if (level.value === 1) {
                    //熟悉词 双击-->陌生词
                    row.level.value = 2;
                } else if (level.value === 2) {
                    //陌生词 双击-->熟悉词
                    row.level.value = 1;
                }

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
                    return new Promise((resolve, reject) => {
                        chrome.runtime.sendMessage({
                            action : 'updateWord',
                            data : wordInfo
                        },
                            (resp) => {
                                resolve(resp);
                            });
                    });
                } else {
                    return Promise.reject(null);
                }
            },
            downloadAsJson(words) {
                let content = "data:text/json;charset=utf-8,";

                content +="{\n";
                words.forEach(({ text, result = [], dict, level = {},to}, index) => {
                    let wordString = `"${text}":{\n\t"result":"${result}",\n\t"dict":"${dict}",\n\t"level":"${level.value}",\n\t"to":"${to}"\n}`;
                
                    content += index < words.length-1 ? wordString+ ",\n" : wordString +"\n";
                });
                content +="}";
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
            handleImportClick() { alert("import") }
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