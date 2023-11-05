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

         let placeholderElem = document.querySelector('#searchPlaceholderRezka');
         placeholderElem.classList.add('d-none');
      })
      .catch(error => console.error(error));
});
