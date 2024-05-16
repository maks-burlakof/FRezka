async function getLatestMovies() {
   let [response, data] = await fetchRequest('/api/media/latest');

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

async function getRecentWatched() {
   let [response, data] = await fetchRequest('/api/media/timecodes', true);

   if (!response.ok) {
      showMessage('danger', `${response.status} ${data['detail']}`);
      return;
   }

   let resultsHTML = '';
   for (let movie of data) {
      resultsHTML += getHTMLMovieCard(
         movie['rezka_url'], movie['cover_url'], movie['title'],
         movie['season'] ? movie['season'] + ' сезон' : '',
         movie['episode'] ? movie['episode'] + ' серия' : '',
         '',
         movie['timecode'], movie['duration'],
      );
   }

   if (data.length !== 0) {
      $('#recentWatchedContainer').removeClass('d-none');
      $('#recentWatched').html(`<div class="row g-4">${resultsHTML}</div>`);
   }
}

$(document).ready(function() {
   getRecentWatched();
   getLatestMovies();
});