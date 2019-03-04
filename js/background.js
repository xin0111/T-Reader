
var selectTextMap = {};
//菜单
chrome.contextMenus.create({
    title : '翻译：%s', // %s表示选中的文字
    contexts : [ 'selection' ], // 只有当选中文字时才会出现此右键菜单
    onclick : function(params) {
        openTranslationTab(params.selectionText);
    }
});

//打开翻译页
function openTranslationTab(text)
{
    chrome.tabs.create(
        { url : chrome.runtime.getURL('tselection.html') }, function(tab) {
            getCurrentTabId(tabId => {
                selectTextMap[tabId] = text;
            });
        });
}

// 获取当前选项卡ID
function getCurrentTabId(callback)
{
    chrome.tabs.query({ active : true, currentWindow : true }, function(tabs) {
        if (callback)
            callback(tabs.length ? tabs[0].id : null);
    });
}

// 获取当前选项卡 text
function getCurrentTabText(callback)
{
    getCurrentTabId(tabId => {
        callback(selectTextMap[tabId]);
    });
}

//删除
chrome.tabs.onRemoved.addListener(function(id) {
    delete selectTextMap[id];
});