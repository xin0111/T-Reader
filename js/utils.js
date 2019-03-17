export function simTemplate(tpl, data)
{
    return tpl.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, function(m, $1) {
        return typeof data[$1] !== 'undefined' ? data[$1] : '';
    });
}
export function getLangCode(lang)
{
    if (lang.indexOf('-') !== -1) {
        if (lang.startsWith('zh')) {
            if (lang.toLowerCase === 'zh-tw') {
                return 'zh-TW';
            } else {
                return 'zh-CN';
            }
        } else {
            return lang.split('-')[0];
        }
    } else {
        return lang;
    }
}

export function getParameterByName(name, search = window.location.search)
{
    let urlsearch = new URLSearchParams(search);

    return urlsearch.get(name);
}
