import {twords} from './treader';

document.addEventListener("DOMContentLoaded", function() {
    var bg = chrome.extension.getBackgroundPage();
    bg.getCurrentTabText(text => {
        twords(text);
    });
});
