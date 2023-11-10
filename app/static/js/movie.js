var movieId = 0;
var rezkaShortUrl = '';
var seriesInfo = [];
var streamsQualities = {};

var isStreamUpdated = false;
var isStreamUpdating = false;

function needToUpdateStream() {
   isStreamUpdated = false;
   $('#movieSelectsQualityDiv').remove();
   $('#streamUpdateIconPlace').html(`
      <span id="streamUpdateIcon" style="color: #dd910e;" class="small ms-2 mb-2"><i class="fa-solid fa-circle"></i></span>
   `);
}

async function updateUserTimecode() {
   let player = document.querySelector('#moviePlayer');

   let translatorId = $('#movieSelectsTranslators').val();
   let seasonId = $('#movieSelectsSeasons').val();
   let episodeId = $('#movieSelectsEpisodes').val();

   let [response, data] = await fetchRequest('/api/media/timecode/', true, 'POST', JSON.stringify({
      'movie_id': movieId,
      'timecode': Math.round(player.currentTime),
      'duration': Math.round(player.duration),
      'translator': translatorId,
      'season': seasonId ? seasonId : null,
      'episode': episodeId ? episodeId : null,
   }));
}

function changeQuality() {
   let chosenQualityName = $('#movieSelectsQuality').val();
   let streamUrl = streamsQualities[chosenQualityName];

   $('#moviePlayerVideoSrc').attr('src', streamUrl);
   let player = document.querySelector('#moviePlayer');
   player.load();

   $('#movieDownloadBtn').attr('href', streamUrl).attr('download', streamUrl.slice(-9));
   $('#movieCopyBtn').attr('onclick', `navigator.clipboard.writeText('${streamUrl}')`);
}

function changeQualityResume() {
   let player = document.querySelector('#moviePlayer');
   let curtime = player.currentTime;
   changeQuality();
   player.currentTime = curtime;
   player.play();
}

async function getStream() {
   isStreamUpdating = true;
   let responseUrl = `/api/media/stream?u=${rezkaShortUrl}`;

   // Update loading icon
   $('#streamUpdateIcon').html('<i class="fa-solid fa-circle fa-beat-fade"></i>');

   let translatorId = $('#movieSelectsTranslators').val();
   responseUrl += translatorId ? `&t=${translatorId}` : '';
   let seasonId = $('#movieSelectsSeasons').val();
   responseUrl += seasonId ? `&s=${seasonId}` : '';
   let episodeId = $('#movieSelectsEpisodes').val();
   responseUrl += episodeId ? `&e=${episodeId}` : '';

   let [response, data] = await fetchRequest(responseUrl);

   if (!response.ok) {
      showMessage('danger', `${response.status} ${data['detail']}`);
      return;
   }

   streamsQualities = data;
   let qualitiesNames = Object.keys(data);
   let qualityOptionsHTML = '';
   for (let i = 0; i < qualitiesNames.length; i++) {
      qualityOptionsHTML += `<option ${i+1 === qualitiesNames.length ? 'selected':''} value="${qualitiesNames[i]}">${qualitiesNames[i]}</option>`;
   }

   document.querySelector('#movieSelectsQualityPlace').innerHTML = `
      <div id="movieSelectsQualityDiv" class="form-floating select-group-transparent mb-2">
         <select class="form-select" id="movieSelectsQuality" oninput="changeQualityResume()">${qualityOptionsHTML}</select>
         <label for="movieSelectsQuality">Качество</label>
      </div>
   `;

   changeQuality();

   isStreamUpdating = false;
   if (!isStreamUpdated) {
      isStreamUpdated = true;
      document.querySelector('#streamUpdateIcon').remove();
   }
}

function updateEpisodesSelect() {
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
   let translatorId = $('#movieSelectsTranslators').val();
   for (let data of Object.values(seriesInfo)) {
      if (data['translator_id'] === parseInt(translatorId)) {
         let seasonCodes = Object.keys(data['seasons']);
         let seasonNames = Object.values(data['seasons']);

         let seasonsOptionsHTML = '';
         for (let i = 0; i < seasonCodes.length; i++) {
            seasonsOptionsHTML += `<option ${i ? '':'selected'} value="${seasonCodes[i]}">${seasonNames[i]}</option>`;
         }
         $('#movieSelectsSeasons').html(seasonsOptionsHTML);
         updateEpisodesSelect();
      }
   }
}

async function fillInfo() {
   rezkaShortUrl = getURLParam(location.href, 'u');
   $('#movieHdRezkaBtn').attr('href', 'https://kinopub.me/' + rezkaShortUrl);

   let [response, data] = await fetchRequest(`/api/media/info?u=${rezkaShortUrl}`);

   if (!response.ok) {
      let errorMsg = data['detail'];
      // showMessage('danger', `${response.status} ${errorMsg}`);

      $('#movieInfoPlaceholder').html(`
         <div class="alert alert-dark col-12 col-lg-10 col-xl-8" role="alert">
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
      `);
      return;
   }

   $('#movieCoverPlaceholder').remove();

   movieId = data['id'];
   seriesInfo = data['series_info'];

   // Fill movie info
   $('#movieCover').attr('src', data['cover_url']);
   $('#movieTitle').html(data['title']);
   $('#movieYear').html(data['year']);
   $('#movieRating').html(data['rating_value']);

   // Fill translators
   let translatorsSelectHTML = `
      <div id="movieSelectsTranslatorsDiv" class="form-floating select-group-transparent me-2 mb-2">
         <select class="form-select" id="movieSelectsTranslators">
   `;
   let translatorsNames = Object.keys(data['translators']);
   let translatorsCodes = Object.values(data['translators']);
   for (let i = 0; i < translatorsNames.length; i++) {
      translatorsSelectHTML += `<option ${i ? '':'selected'} value="${translatorsCodes[i]}">${translatorsNames[i]}</option>`;
   }
   $('#movieSelects').html(translatorsSelectHTML + `
         </select>
         <label for="movieSelectsTranslators">Озвучка</label>
      </div>
   `);
   if (translatorsNames.length < 2) {
      $('#movieSelectsTranslatorsDiv').addClass('d-none');
   }

   // Create seasons, episodes selects
   if (Object.values(seriesInfo).length > 0) {
      let seasonSelectHTML = `
         <div class="form-floating select-group-transparent me-2 mb-2">
            <select class="form-select" id="movieSelectsSeasons"></select>
            <label for="movieSelectsSeasons">Сезон</label>
         </div>
      `;
      let episodeSelectHTML = `
         <div class="form-floating select-group-transparent me-2 mb-2">
            <select class="form-select" id="movieSelectsEpisodes"></select>
            <label for="movieSelectsEpisodes">Серия</label>
         </div>
      `;
      $('#movieSelects').append(seasonSelectHTML + episodeSelectHTML);
      updateSeasonsSelect();
   }
   needToUpdateStream();

   // Get user timecode and set them
   [responseTimecode, dataTimecode] = await fetchRequest(`/api/media/timecode/${movieId}`);
   if (responseTimecode.ok) {
      $('#movieSelectsTranslators').val(dataTimecode['translator']);
      if (dataTimecode['season']) {
         $('#movieSelectsSeasons').val(dataTimecode['season']);
      }
      if (dataTimecode['episode']) {
         $('#movieSelectsEpisodes').val(dataTimecode['episode']);
      }
      document.querySelector('#moviePlayer').currentTime = dataTimecode['timecode'];
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
      <a id="movieKinopoiskBtn" target="_blank" class="btn bg-orange-g me-1"><i class="fa-solid fa-play me-1"></i> Кинопоиск</a>
   `;
   document.querySelector('#movieButtons').prepend(kinopoiskBtn);
}

window.addEventListener("load", async function () {
   await fillInfo();

   $('#movieSelectsTranslators').change(function () {
      updateSeasonsSelect();
      needToUpdateStream();
   });
   $('#movieSelectsSeasons').change(function () {
      updateEpisodesSelect();
      needToUpdateStream();
   });
   $('#movieSelectsEpisodes').change(function () {
      needToUpdateStream();
   });

   $('#moviePlayer').on({
      click: function () {
         if (!isStreamUpdated && !isStreamUpdating) {
            getStream();
         }
      },
      pause: function () {
         updateUserTimecode();
      },
   });
});