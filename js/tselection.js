var bg = chrome.extension.getBackgroundPage();

document.addEventListener("DOMContentLoaded", function() {

    bg.getCurrentTabText(text => {
        twords(text);
    });

});
