
import $ from 'jquery'
var bg = chrome.extension.getBackgroundPage();
// 翻译输入
$('#inputText').keypress(e => {
    if (e.keyCode == 13) {
        //Enter Key
        chrome.runtime.sendMessage({
            action : 'opentab',
            data : inputText.value
        },
            function(msg) {

            });
    }
});

//改变大小
$('#inputText').bind('input propertychange', function() {
    this.style.height = '0px';
    this.style.height = (this.scrollHeight + 'px');
});
