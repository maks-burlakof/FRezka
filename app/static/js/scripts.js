function removeDomain(url) {
   // let urlObj = new URL(url);
   return url.replace(/^.*\/\/[^\/]+/, '')
}

function getURLParam(url, param) {
   let urlObj = new URL(url);
   let searchParams = urlObj.searchParams;
   return searchParams.get(param);
}