

export function fetchDirtyDOM(input)
{
    return fetch(input)
        .then(r => r.ok ? r.text() : Promise.reject(r))
        .then(text => new DOMParser().parseFromString(
                  text,
                  'text/html',
                  ));
}

export function
    handleNetWorkError(text)
{
    //todo search local directory
    var result = {
        text : text,
        result : [ "..." ]
    };

    return result;
}
