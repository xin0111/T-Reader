
//创建svg显示
function twords(text)
{
    if (undefined == text)
        return;
    //换行符处理
    var sentence = text.replace(/↵|\n/g, "<br/>");
    var dictData = {};

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
                          return dictData[word];
                      })
                      .render();

    var words = d3plus.textSplit(text);

    for (var i = 0; i < words.length; ++i) {
        bing_search(words[i]).then((v) => {
            console.log(v.trans);
            dictData[v.title] = v.trans;
            //更新显示
            textBox.render();
        });
    }
}
