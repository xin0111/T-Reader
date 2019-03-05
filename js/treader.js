
var bg = chrome.extension.getBackgroundPage();

//创建svg显示
function twords(text)
{
    if (undefined == text)
        return;
    //换行符处理
    var sentence = text.replace(/↵|\n/g, " <br/> ");

    var textBox = new d3plus.TextBox()
                      .width(window.innerWidth)
                      .height(window.innerHeight)
                      // .fontResize(function(d, i) {
                      // return true;
                      // })
                      .fontSize(function() {
                          return 20;
                      })
                      .data([ { text : sentence } ])
                      .x(function(d, i) {
                          return i * 100;
                      })
                      .transData(function(word) {
                          return bg.dictData[word];
                      })
                      .render();

    var words = d3plus.textSplit(text);

    baidu_search(textBox, words);
}

function baidu_search(textBox, words)
{
    const { youdao, baidu, google } = tjs;
    for (var i = 0; i < words.length; ++i) {

        if (bg.dictData[words[i]] == undefined)
            baidu.translate(words[i]).then(function(result) {
                // console.log(result)
                bg.dictData[result.text] = result.result[0];
                //更新显示
                textBox.render();
            })
    }
}

function bing_search(textBox, words)
{
    for (var i = 0; i < words.length; ++i) {
        if (bg.dictData[words[i]] == undefined)
            bing_search(words[i]).then((v) => {
                //  console.log(v.trans);
                bg.dictData[v.title] = v.trans;
                //更新显示
                textBox.render();
            });
    }
}