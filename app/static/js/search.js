window.addEventListener("load", function(){
   let searchedStr = document.querySelector('#searchInput').value;
   fetch(`/api/media/search?q=${searchedStr}`)
      .then(response => response.json())
      .then(data => {
         console.log(data);
         // TODO: if backed error - create bootstrap alert and return
         let resultsElem = document.querySelector('#searchResultsRezka');
         let resultsHTML = '';
         for (let movie of data) {
            resultsHTML += `
               <div class="col-3">
                  <div class="card movie-card">
                     <a href="/film?u=${removeDomain(movie['url'])}"><img src="${movie['cover_url']}" class="card-img-top"></a>
                     <div class="movie-card-caption">
                        <h6 class="card-title">${movie['title']}</h6>
                        <p class="card-text">${movie['year']}, ${movie['country']}, ${movie['genre']}</p>
                     </div>
                  </div>
               </div>
            `;
         }
         if (data) {
            resultsElem.innerHTML = `<div class="row g-4">${resultsHTML}</div>`;
         } else {
            resultsElem.innerHTML = '<p>Результатов не найдено</p>';
         }
         let placeholderElem = document.querySelector('#searchPlaceholderRezka');
         placeholderElem.classList.add('d-none');
      })
      .catch(error => console.error(error));
});
