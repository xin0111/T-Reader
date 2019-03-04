//promise
function bing_search(text)
{
    const DICT_LINK = 'https://cn.bing.com/dict/clientsearch?mkt=zh-CN&setLang=zh&form=BDVEHC&ClientVer=BDDTV3.5.1.4320&q='

    return fetchDirtyDOM(DICT_LINK + text)
        .catch(err => handleNetWorkError(text))
        .then(doc => handleDom(doc, text))
        .then(result => {
            return result;
        });
}

function handleDom(doc, text)
{
    try {
        if (doc.querySelector('.client_def_hd_hd')) {
            return handleLexResult(doc, text)
        }
    } catch (e) {
        return doc;
    }
    return doc;
}

function handleLexResult(doc, text)
{
    var result = {
        title : text,
        // getText(doc, '.client_def_hd_hd'),
        trans : ""
    };

    let $container
        = doc.querySelector('.client_def_container');
    if ($container) {
        let $defs = Array.from($container.querySelectorAll('.client_def_bar'));
        if ($defs.length > 0) {
            //取第一组数据 todo
            result.trans = $defs[0].innerText.split('.')[1].split("；")[0];
        }
    }

    return result;
}

function getText(el, childSelector)
{
    var child = el.querySelector(childSelector);
    if (child) {
        return child.innerText.trim()
    }
    return ''
}
