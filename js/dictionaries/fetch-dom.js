'use strict';

function fetchDirtyDOM(input) {
    return fetch(input).then(function (r) {
        return r.ok ? r.text() : Promise.reject(r);
    }).then(function (text) {
        return new DOMParser().parseFromString(text, 'text/html');
    });
}

function
    handleNetWorkError(text)
{
    //todo search local directory
    var result = {
        title : text,
        trans : "..."
    };

    return result;
}
