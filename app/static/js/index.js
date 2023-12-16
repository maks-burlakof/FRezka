async function getLatestMovies() {
   let [response, data] = await fetchRequest('/api/media/latest/');

   if (!response.ok) {
      showMessage('danger', `${response.status} ${data['detail']}`);
      return;
   }

   let resultsHTML = '';
   for (let movie of data) {
      resultsHTML += getHTMLMovieCard(removeDomain(movie['url']), movie['cover_url'], movie['title'], movie['year'], movie['country'], movie['genre']);
   }

   if (data.length !== 0) {
      $('#latestRezka').html(`<div class="row g-4">${resultsHTML}</div>`);
   }
}

$(document).ready(function() {
   getLatestMovies();
});