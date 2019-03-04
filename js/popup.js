var bg = chrome.extension.getBackgroundPage();

// 翻译输入
$('#inputText').keypress(e => {
    if (e.keyCode == 13) {
        //Enter Key
        bg.openTranslationTab(inputText.value);
    }
});

//改变大小
$('#inputText').bind('input propertychange', function() {
    this.style.height = '0px';
    this.style.height = (this.scrollHeight + 'px');
});