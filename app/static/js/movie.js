var movieId = 0;
var movieIsWatched = false;
var rezkaShortUrl = '';
var seriesInfo = [];
var streamsQualities = {};

var isStreamUpdated = false;
var isStreamUpdating = false;

function showMovieInfoError(status, errorMsg) {
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
               <span><span class="text-danger">${status}</span> ${errorMsg}</span>
            </div>
         </div>
      </div>
   `);
}

function needToUpdateStream() {
   isStreamUpdated = false;
   $('#movieSelectsQualityDiv').remove();
   $('#streamUpdateIconPlace').html(`
      <span id="streamUpdateIcon" style="color: #dd910e;" class="small ms-2 mb-2"><i class="fa-solid fa-circle"></i></span>
   `);

   let player = document.querySelector('#moviePlayer');
   player.pause();
   player.currentTime = 0;
   $('#moviePlayerVideoSrc').attr('src', '');
   player.load();
}

function updateUserTimecodePageInfo(timecode, duration, season, episode) {
   let d = Number(timecode);
   let h = Math.floor(d / 3600);
   let m = Math.floor(d % 3600 / 60);
   let s = Math.floor(d % 3600 % 60);

   $('#movieTimecodeInfo').html(`
         <div class="rounded-4 p-4 bg-dark-g col-xl-6 col-lg-8" style="border-top-left-radius: 0!important;">
            <p class="mb-2">
               Ты остановился на ${h > 0 ? h + ':' : ''}${m > 0 ? (m < 10 ? '0' : '') + m + ':' : '00:'}${s > 0 ? (s < 10 ? '0' : '') + s : '00'}<br>
               ${season ? season + ' сезон, ' : ''}
               ${episode ? episode + ' серия.' : ''}
            </p>
            <div class="progress-stacked" style="height: 4px;">
               <div class="progress" role="progressbar" style="width: ${100*timecode/duration}%">
                  <div class="progress-bar"></div>
               </div>
            </div>
         </div>
      `);
   $('#movieTimecodeInfo').removeClass('d-none');
}

async function updateUserTimecode() {
   let player = document.querySelector('#moviePlayer');

   let translatorId = $('#movieSelectsTranslators').val();
   let seasonId = $('#movieSelectsSeasons').val();
   let episodeId = $('#movieSelectsEpisodes').val();
   let timecode = Math.round(player.currentTime);
   let duration = Math.round(player.duration);

   let [response, data] = await fetchRequest('/api/media/timecode', true, 'POST', JSON.stringify({
      'movie_id': movieId,
      'timecode': timecode,
      'duration': duration,
      'translator': translatorId ? translatorId : null,
      'season': seasonId ? seasonId : null,
      'episode': episodeId ? episodeId : null,
      'is_watched': ((timecode / duration > 0.95) && !episodeId),
      'last_watched': new Date().toISOString(),
   }));

   if (response.ok) {
      updateUserTimecodePageInfo(timecode, duration, seasonId, episodeId);

      movieIsWatched = data['is_watched'];
      if (data['is_watched'] && !$('#movieIsWatchedBtn').hasClass('film-watched')) {
         $('#movieIsWatchedBtn').addClass('film-watched');
         $("#movieIsWatchedBtn").html('<i class="fa-solid fa-circle-check"></i>');
         showMessage('success', '<i class="fa-solid fa-check me-1"></i> Фильм просмотрен');
      }
   }
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
      showMessage('danger', `<i class="fa-solid fa-circle-exclamation me-1"></i> Ошибка ${response.status} при загрузке плеера`);
      showMovieInfoError(response.status, data['detail']);
      return;
   }
   $('#movieInfoPlaceholder').html('');

   streamsQualities = data;
   let qualitiesNames = Object.keys(data);
   let qualityOptionsHTML = '';
   for (let i = 0; i < qualitiesNames.length; i++) {
      qualityOptionsHTML += `<option ${i+1 === qualitiesNames.length ? 'selected':''} value="${qualitiesNames[i]}">${qualitiesNames[i]}</option>`;
   }

   $('#movieSelectsQualityPlace').html(`
      <div id="movieSelectsQualityDiv" class="form-floating select-group-transparent mb-2">
         <select class="form-select" id="movieSelectsQuality" oninput="changeQualityResume()">${qualityOptionsHTML}</select>
         <label for="movieSelectsQuality">Качество</label>
      </div>
   `);

   changeQuality();

   isStreamUpdating = false;
   if (!isStreamUpdated) {
      isStreamUpdated = true;
      $('#streamUpdateIcon').remove();
   }

   if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
         title: $('#movieTitle').text(),
         artist: episodeId ? (seasonId ? `${seasonId} сезон, ${episodeId} серия` : `${episodeId} серия`) : 'FRezka',
         artwork: [
            { src: $('#movieCover').attr('src'), type: "image/png" },
         ]
      });
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
   if (!rezkaShortUrl) {
      $(location).attr('href', '/');
      return;
   }
   $('#movieHdRezkaBtn').attr('href', 'https://kinopub.me/' + rezkaShortUrl);

   // Get user timecode
   let [responseTimecode, dataTimecode] = await fetchRequest(`/api/media/timecode?u=${rezkaShortUrl}`);
   if (responseTimecode.ok) {
      $('#movieCoverPlaceholder').remove();
      $('#movieCover').attr('src', dataTimecode.cover_url);
      $('#movieTitle').html(dataTimecode.title);
      $(document).prop('title', `${dataTimecode.title} · FRezka`);
      movieId = dataTimecode.movie_id;
      updateUserTimecodePageInfo(dataTimecode.timecode, dataTimecode.duration, dataTimecode.season, dataTimecode.episode);

      movieIsWatched = dataTimecode.is_watched;
      $('#movieIsWatchedBtn').removeAttr('disabled');
      if (dataTimecode.is_watched) {
         $('#movieIsWatchedBtn').addClass('film-watched');
         $("#movieIsWatchedBtn").html('<i class="fa-solid fa-circle-check"></i>');
      }
   }

   let [response, data] = await fetchRequest(`/api/media/info?u=${rezkaShortUrl}`);

   if (!response.ok) {
      let errorMsg = data['detail'];
      showMessage('danger', `<i class="fa-solid fa-circle-exclamation me-1"></i> Ошибка ${response.status} при загрузке информации`);
      showMovieInfoError(response.status, errorMsg);
      return;
   }

   movieId = data.id;
   seriesInfo = data.series_info;

   $('#movieCoverPlaceholder').remove();
   $('#movieIsWatchedBtn').removeAttr('disabled');

   // Fill movie info
   $('#movieCover').attr('src', data.cover_url);
   $('#movieTitle').html(data.title);
   $(document).prop('title', `${data.title} · FRezka`);
   $('#movieYear').html(data.year);
   $('#movieRating').html(data.rating_value);

   // Fill translators
   let translatorsSelectHTML = `
      <div id="movieSelectsTranslatorsDiv" class="form-floating select-group-transparent me-2 mb-2">
         <select class="form-select" id="movieSelectsTranslators">
   `;
   let translatorsNames = Object.keys(data.translators);
   let translatorsCodes = Object.values(data.translators);
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

   // Set user timecode
   if (responseTimecode.ok) {
      $('#movieSelectsTranslators').val(dataTimecode.translator);
      if (dataTimecode.season) {
         $('#movieSelectsSeasons').val(dataTimecode.season);
      }
      if (dataTimecode.episode) {
         $('#movieSelectsEpisodes').val(dataTimecode.episode);
      }
      document.querySelector('#moviePlayer').currentTime = dataTimecode.timecode;
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
   $("#movieButtons").append(`
      <a id="movieKinopoiskBtn" href="https://www.kinopoisk.ru/index.php?kp_query=${data.title}" target="_blank" class="btn bg-orange-g"><i class="fa-solid fa-play me-1"></i> Кинопоиск</a>
   `);
}

window.addEventListener("load", async function () {
   $("#movieIsWatchedBtn").click(async function(){
      let [response, data] = await fetchRequest('/api/media/timecode', true, 'PATCH', JSON.stringify({
         'movie_id': movieId,
         'is_watched': !movieIsWatched,
      }));

      if (response.ok) {
         showMessage('success', '<i class="fa-solid fa-check me-1"></i> Сохранено');

         movieIsWatched = data.is_watched;
         if (data.is_watched && !$('#movieIsWatchedBtn').hasClass('film-watched')) {
            $('#movieIsWatchedBtn').addClass('film-watched');
            $("#movieIsWatchedBtn").html('<i class="fa-solid fa-circle-check"></i>');
         } else if (!data.is_watched && $('#movieIsWatchedBtn').hasClass('film-watched')) {
            $('#movieIsWatchedBtn').removeClass('film-watched');
            $("#movieIsWatchedBtn").html('<i class="fa-solid fa-circle-plus"></i>');
         }
      }
   });

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