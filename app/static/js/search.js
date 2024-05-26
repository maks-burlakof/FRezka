async function getSearchResults() {
   let searchedStr = $('#searchInput').val();
   let pageNumber = getURLParam($(location).attr('href'), 'p');
   $(document).prop('title', `Поиск: ${searchedStr} · FRezka`);

   let response, data;
   if (searchedStr) {
      [response, data] = await fetchRequest(`/api/media/search?${pageNumber ? `p=${pageNumber}&` : ''}q=${searchedStr}`);

      if (!response.ok) {
         if (response.status !== 401) {
            showMessage('danger', `${response.status} ${data['detail']}`);
         }
         return;
      }
   } else {
      data = [];
   }

   let resultsHTML = '';
   for (let movie of data.content) {
      resultsHTML += getHTMLMovieCard(removeDomain(movie['url']), movie['cover_url'], movie['title'], movie['year'], movie['country'], movie['genre']);
   }

   if (data.content.length === 0) {
      $('#searchResultsRezka').html('<p>Ничего не найдено</p>');
   } else {
      $('#searchResultsRezka').html(`<div class="row g-4">${resultsHTML}</div>`);
   }
   $('#searchPlaceholderRezka').remove();

   if (data.pages > 1) {
      createPagination(removeURLParam($(location).attr('href'), 'p'), data.page, data.pages);
   }
}

$(document).ready(async function() {
   await getSearchResults();
});