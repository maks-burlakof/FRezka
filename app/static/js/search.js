async function getSearchResults() {
   let searchedStr = $('#searchInput').val();
   let [response, data] = await fetchRequest(`/api/media/search?q=${searchedStr}`);

   if (!response.ok) {
      showMessage('danger', `${response.status} ${data['detail']}`);
      return;
   }

   let resultsHTML = '';
   for (let movie of data) {
      resultsHTML += `
         <div class="col-6 col-sm-4 col-lg-3 col-xl-2">
            <div class="card movie-card">
               <a href="/film?u=${removeDomain(movie['url'])}">
                  <img src="${movie['cover_url']}" class="card-img-top">
                  <div class="movie-card-caption">
                     <h6>${movie['title']}</h6>
                     <p>${movie['year']}, ${movie['country']}, ${movie['genre']}</p>
                  </div>
               </a>
            </div>
         </div>
      `;
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