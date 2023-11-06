async function getSearchResults() {
   let searchedStr = document.querySelector('#searchInput').value;
   let response = await fetchRequest(`/api/media/search?q=${searchedStr}`);
   let data = await response.json();

   if (!response.ok) {
      showMessage('danger', `${response.status} ${data['detail']}`);
      return;
   }

   let resultsElem = document.querySelector('#searchResultsRezka');
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
      resultsElem.innerHTML = '<p>Результатов не найдено</p>';
   } else {
      resultsElem.innerHTML = `<div class="row g-4">${resultsHTML}</div>`;
   }
   document.querySelector('#searchPlaceholderRezka').remove();
}

window.addEventListener("load", function(){
   getSearchResults();
});