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

async function getCollectionResults() {
   let genre = getURLParam($(location).attr('href'), 'genre');
   genre = genre ? (genre.charAt(0).toUpperCase() + genre.slice(1)) : '';
   let mediaType = getURLParam($(location).attr('href'), 'type');
   mediaType = mediaType ? mediaType.toLowerCase() : '';
   let pageNumber = getURLParam($(location).attr('href'), 'p');
   let collectionUrl = getURLParam($(location).attr('href'), 'u');

   $(document).prop('title', `${(genre && mediaType) ? `${genre} - ${mediaType}` : 'Подборка'} · FRezka`);
   if (genre && mediaType) {
      $('#collectionNameContainer').html(`
         <h1>${genre}</h1>
         <h6 class="text-white-50">${mediaType}</h6>
      `);
   }

   let response, data;
   if (collectionUrl) {
      [response, data] = await fetchRequest(`/api/media/collection?${pageNumber ? `p=${pageNumber}&` : ''}u=${collectionUrl}`);

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
      $('#collectionResults').html('<p>Ничего не найдено</p>');
   } else {
      $('#collectionResults').html(`<div class="row g-4">${resultsHTML}</div>`);
   }

   if (data.pages > 1) {
      createPagination(removeURLParam($(location).attr('href'), 'p'), data.page, data.pages);
   }
}