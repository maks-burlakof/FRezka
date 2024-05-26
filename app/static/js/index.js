async function getLatestMovies() {
   let [response, data] = await fetchRequest('/api/media/latest');

   if (!response.ok) {
      // showMessage('danger', `${response.status} ${data['detail']}`);
      return;
   }

   // Latest
   let resultsHTML = '';
   for (let movie of data.latest.content) {
      resultsHTML += getHTMLMovieCard(removeDomain(movie['url']), movie['cover_url'], movie['title'], movie['year'], movie['country'], movie['genre']);
   }
   if (data.latest.content.length !== 0) {
      $('#latestRezka').html(`<div class="row g-4">${resultsHTML}</div>`);
   }

   // Genres
   for (let mediaType of Object.keys(data.genres)) {
      let linksHTML = '';
      for (let genre of Object.keys(data.genres[mediaType])) {
         linksHTML += `<div class="col-6 col-md-4"><a class="lh-1 mb-1 hoverable" href="/collection?u=${data.genres[mediaType][genre]}&genre=${genre}&type=${mediaType}">${genre}</a></div>`;
      }

      $('#genresMediaTypes').append(`
         <a class="genre-link hoverable" data-bs-toggle="collapse" href="#collapse-${mediaType}" role="button" aria-expanded="false" aria-controls="collapse-${mediaType}">${mediaType}</a>
      `);
      $('#genresCollapses').append(`
         <div class="collapse collapse-unique" id="collapse-${mediaType}">
            <div class="bg-gray rounded-5 p-4 mb-4 mb-md-5 text-start">
               <div class="mb-3">
                  <h1 class="mb-0" style="color: #F3A623;">${mediaType}</h1>
                  <h3>· Подборки</h3>
               </div>
               <div class="row px-lg-5">${linksHTML}</div>
            </div>
         </div>
      `);
   }
   $('#collapseGenres').html(`<div class="row g-4">${resultsHTML}</div>`);

   $('.collapse-unique').on('show.bs.collapse', function () {
      $('.collapse-unique').each(function(){
         if($(this).hasClass('show')){
            $(this).collapse('hide');
         }
      });
   });
}

async function getRecentWatched() {
   let [response, data] = await fetchRequest('/api/media/timecodes', true);

   if (!response.ok) {
      // showMessage('danger', `${response.status} ${data['detail']}`);
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
   getLatestMovies();
   getRecentWatched();
});