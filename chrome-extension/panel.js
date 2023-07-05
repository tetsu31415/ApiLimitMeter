const rateLimitHeaderNames = [
  "x-rate-limit-limit",
  "x-rate-limit-remaining",
  "x-rate-limit-reset",
];

const extractHeaders = (response) => {
  const rateLimitHeaders = response.headers
    .filter((h) => rateLimitHeaderNames.includes(h.name.toLowerCase()))
    .reduce((acc, h) => ({...acc, [h.name.toLowerCase()]: h.value}), {});

  return Object.keys(rateLimitHeaders).length === rateLimitHeaderNames.length
    ? rateLimitHeaders : null;
}

let rateLimitData = {}

const updateRateLimit = (method, urlString, rateLimitHeaders) => {
  const url = new URL(urlString);
  const key = `${method} ${url.origin}/${url.pathname}`;
  rateLimitData[key] = {
    ...rateLimitHeaders,
    displayName: `${method} ${url.pathname}`,
  };

  render();
};

const render = () => {
  // remote all elements
  const elem = document.getElementById('content');
  while( elem.firstChild ){
    elem.removeChild( elem.firstChild );
  }

  const template = document.getElementById("template").firstElementChild;
  Object.keys(rateLimitData).forEach((key) => {
    const val = rateLimitData[key];
    // console.log(val);
    const elem = template.cloneNode(true);
    elem.getElementsByClassName('endpoint')[0].innerText = val["displayName"];
    elem.getElementsByClassName('limit-remain')[0].innerText = val["x-rate-limit-remaining"];
    elem.getElementsByClassName('limit-limit')[0].innerText = val["x-rate-limit-limit"];
    elem.getElementsByClassName('limit-progress')[0].setAttribute("value", val["x-rate-limit-remaining"]);
    elem.getElementsByClassName('limit-progress')[0].setAttribute("max", val["x-rate-limit-limit"]);
    elem.getElementsByClassName('limit-reset')[0].innerText = new Date(val["x-rate-limit-reset"]*1000).toLocaleString();
    document.getElementById("content").append(elem);
  });
}

document.getElementById("clear-button").addEventListener('click', (event) => {
  rateLimitData = {};
  render();
});

chrome.devtools.network.onRequestFinished.addListener(
  function(request) {
    // console.log(request);
    if (!request.request.url.includes("api")) {
      return;
    }
    const rateLimitHeaders = extractHeaders(request.response);
    if (!rateLimitHeaders) {
      return;
    }

    updateRateLimit(request.request.method , request.request.url, rateLimitHeaders);
  }
);