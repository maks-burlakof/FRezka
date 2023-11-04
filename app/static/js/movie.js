var seriesInfo = [];

function updateEpisodesSelect() {
   console.log('called update episodes');
   let translatorId = document.querySelector('#movieSelectsTranslators').value;
   let seasonId = document.querySelector('#movieSelectsSeasons').value;

   for (let data of Object.values(seriesInfo)) {
      if (data['translator_id'] === parseInt(translatorId)) {
         let episodes = data['episodes'][seasonId];
         let episodesCodes = Object.keys(episodes);
         let episodesNames = Object.values(episodes);

         let episodesOptionsHTML = '';
         for (let i = 0; i < episodesCodes.length; i++) {
            episodesOptionsHTML += `<option ${i ? '':'selected'} value="${episodesCodes[i]}">${episodesNames[i]}</option>`;
         }
         document.querySelector('#movieSelectsEpisodes').innerHTML = episodesOptionsHTML;
      }
   }
}

function updateSeasonsSelect() {
   console.log('called update seasons');
   let translatorId = document.querySelector('#movieSelectsTranslators').value;
   for (let data of Object.values(seriesInfo)) {
      if (data['translator_id'] === parseInt(translatorId)) {
         let seasonCodes = Object.keys(data['seasons']);
         let seasonNames = Object.values(data['seasons']);

         let seasonsOptionsHTML = '';
         for (let i = 0; i < seasonCodes.length; i++) {
            seasonsOptionsHTML += `<option ${i ? '':'selected'} value="${seasonCodes[i]}">${seasonNames[i]}</option>`;
         }
         document.querySelector('#movieSelectsSeasons').innerHTML = seasonsOptionsHTML;
         updateEpisodesSelect();
      }
   }
}

async function fillInfo() {
   let rezkaShortUrl = getURLParam(location.href, 'u');
   document.querySelector('#movieHdRezkaBtn').href = 'https://kinopub.me/' + rezkaShortUrl;

   let response = await fetch(`/api/media/info?u=${rezkaShortUrl}`);
   let data = await response.json();

   let placeholderInfo = document.querySelector('#movieInfoPlaceholder');

   // If response was unsuccessful
   if (!response.ok) {
      let errorMsg = data['detail'];
      // showMessage('danger', `${response.status} ${errorMsg}`);

      let alertElem = document.createElement('div');
      alertElem.innerHTML = `
         <div class="alert alert-dark col-8" role="alert">
            <a style="color: #4d4d4d" data-bs-toggle="collapse" href="#movieAlertCollapse" role="button" aria-expanded="false" aria-controls="movieAlertCollapse">
               <span class="d-flex justify-content-between align-items-center">
                  Не удалось загрузить информацию
                  <i class="fa-solid fa-circle-info"></i>
               </span>
            </a>
            <div class="collapse" id="movieAlertCollapse">
               <div class="card card-body mt-3">
                  <span><span class="text-danger">${response.status}</span> ${errorMsg}</span>
               </div>
            </div>
         </div>
      `;
      placeholderInfo.prepend(alertElem);
      return
   }

   document.querySelector('#movieCoverPlaceholder').remove();
   placeholderInfo.remove();

   seriesInfo = data['series_info'];

   // Fill movie info
   document.querySelector('#movieCover').src = data['cover_url'];
   document.querySelector('#movieTitle').innerText = data['title'];
   document.querySelector('#movieYear').innerText = '-';
   document.querySelector('#movieRating').innerHTML = data['rating_value'];

   // Fill translators
   let translatorsSelectHTML = `
      <div class="form-floating select-group-transparent">
         <select class="form-select" id="movieSelectsTranslators">
   `;
   let translatorsNames = Object.keys(data['translators']);
   let translatorsCodes = Object.values(data['translators']);
   for (let i = 0; i < translatorsNames.length; i++) {
      translatorsSelectHTML += `<option ${i ? '':'selected'} value="${translatorsCodes[i]}">${translatorsNames[i]}</option>`;
   }
   translatorsSelectHTML += `
         </select>
         <label for="movieSelectsTranslators">Озвучка</label>
      </div>
   `;
   let movieSelectsElem = document.querySelector('#movieSelects');
   movieSelectsElem.innerHTML = translatorsSelectHTML;
   if (translatorsNames.length < 2) {
      document.querySelector('#movieSelectsTranslators').classList.add('d-none');
   }

   // Create seasons, episodes selects
   if (Object.values(seriesInfo).length > 0) {
      let seasonSelectHTML = `
         <div class="form-floating select-group-transparent">
            <select class="form-select" id="movieSelectsSeasons"></select>
            <label for="movieSelectsSeasons">Сезон</label>
         </div>
      `;
      let episodeSelectHTML = `
         <div class="form-floating select-group-transparent">
            <select class="form-select" id="movieSelectsEpisodes"></select>
            <label for="movieSelectsEpisodes">Серия</label>
         </div>
      `;
      movieSelectsElem.innerHTML = movieSelectsElem.innerHTML + seasonSelectHTML + episodeSelectHTML;
      updateSeasonsSelect();
   }

   // Fill other parts
   if (data['other_parts'].length > 0) {
      let otherPartsHTML = '';
      for (let otherMovie of data['other_parts']) {
         otherPartsHTML += `<a href="/film?u=${removeDomain(Object.values(otherMovie)[0])}" target="_blank" class="mb-1">${Object.keys(otherMovie)[0]}</a>`;
      }
      document.querySelector('#movieOtherPartsContent').innerHTML = otherPartsHTML;
      document.querySelector('#movieOtherParts').classList.remove('d-none');
   }

   // Create Kinopoisk button
   let kinopoiskBtn = document.createElement('span');
   kinopoiskBtn.innerHTML = `
      <a id="movieKinopoiskBtn" target="_blank" class="btn btn-orange-g me-1"><i class="fa-solid fa-play me-1"></i> Кинопоиск</a>
   `;
   document.querySelector('#movieButtons').prepend(kinopoiskBtn);
}

window.addEventListener("load", async function () {
   await fillInfo();

   document.querySelector('#movieSelectsTranslators').addEventListener('change', () => {
      updateSeasonsSelect();
   });
   document.querySelector('#movieSelectsSeasons').addEventListener('change', () => {
      updateEpisodesSelect();
   });
});













