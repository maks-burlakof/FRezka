async function getSearchResults() {
   let searchedStr = $('#searchInput').val();
   $(document).prop('title', `Поиск: ${searchedStr} · FRezka`);

   let [response, data] = await fetchRequest(`/api/media/search?q=${searchedStr}`);

   if (!response.ok) {
      if (response.status !== 401) {
         showMessage('danger', `${response.status} ${data['detail']}`);
      }
      return;
   }

   let resultsHTML = '';
   for (let movie of data) {
      resultsHTML += getHTMLMovieCard(removeDomain(movie['url']), movie['cover_url'], movie['title'], movie['year'], movie['country'], movie['genre']);
   }

   if (data.length === 0) {
      $('#searchResultsRezka').html('<p>Результатов не найдено</p>');
   } else {
      $('#searchResultsRezka').html(`<div class="row g-4">${resultsHTML}</div>`);
   }
   $('#searchPlaceholderRezka').remove();
}

$(document).ready(async function() {
   await getSearchResults();
});