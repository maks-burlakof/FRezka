function removeDomain(url) {
   return url.replace(/^.*\/\/[^\/]+/, '').slice(1);
}

function getURLParam(url, param) {
   let urlObj = new URL(url);
   let searchParams = urlObj.searchParams;
   return searchParams.get(param);
}