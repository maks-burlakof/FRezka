function getHTMLMovieCard(url, cover, title, year, country, genre, timecode = null, duration = null) {
   return `
      <div class="col-6 col-sm-4 col-lg-3 col-xl-2">
         <div class="card movie-card">
            <a href="/film?u=${url}">
               <img src="${cover}" class="card-img-top">
               <div class="movie-card-caption">
                  <h6>${title}</h6>
                  <p>${year? year : ''}${country ? ', ' + country : ''}${genre ? ', ' + genre : ''}</p>
               </div>
               ${(timecode && duration) ? (`
               <div class="movie-card-progress progress-stacked" style="height: 4px;">
                  <div class="progress" role="progressbar" style="width: ${100*timecode/duration}%">
                     <div class="progress-bar"></div>
                  </div>
               </div>
               `) : '' }
            </a>
         </div>
      </div>
   `;
}


function removeDomain(url) {
   return url.replace(/^.*\/\/[^\/]+/, '').slice(1);
}

function getURLParam(url, param) {
   let urlObj = new URL(url);
   let searchParams = urlObj.searchParams;
   return searchParams.get(param);
}

function makeNextURLParam(location) {
   return location.pathname + location.search + location.hash;
}

function showMessage(type, HTMLText) {
   let newMsgElem = $('<div>').addClass(`toast mb-1 text-bg-${type}`).attr('role', 'alert').attr('aria-live', 'assertive').attr('aria-atomic', 'true');
   newMsgElem.html(`
      <div class="d-flex justify-content-between align-items-center">
         <div class="toast-body">${HTMLText}</div>
         <button type="button" class="btn-close btn-close-white me-3" data-bs-dismiss="toast" aria-label="Закрыть"></button>
      </div>
   `);

   let messagesContainer = $('#messagesContainer');
   messagesContainer.append(newMsgElem);
   bootstrap.Toast.getOrCreateInstance(newMsgElem).show();
   // setTimeout(function () {
   //    newMsgElem.remove();
   // }, 10000);
}

async function fetchRequest(url, ignoreAuth = false, method = 'GET', body = '') {
   let params = {
      method: method,
      headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${Cookies.get('access_token')}`,
      },
   };
   if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      params['body'] = body;
   }

   let response = await fetch(url, params);
   let data = await response.json();

   if (!response.ok) {
      let errorMsg = data['detail'];

      if (response.status === 401 && !ignoreAuth) {
         $('#modalPlace').html(`
            <div class="modal fade" id="loginModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-hidden="true">
               <div class="modal-dialog modal-dialog-centered">
                  <div class="modal-content">
                     <div class="modal-header">
                        <div class="text-start">
                           <h3 class="modal-title text-primary mb-0">Войдите в аккаунт</h3>
                           <h4 class="lh-1 fw-bold text-primary opacity-50">Или создайте его!</h4>
                        </div>
                        <div class="align-self-baseline" data-bs-theme="dark">
                           <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                     </div>
                     <div class="modal-body pt-0">
                        <img class="img-fluid p-4" src="static/img/sign-up.svg">
                        <a class="btn bg-dark-blue-g w-100 py-3 rounded-5" href="/login?next=${makeNextURLParam(location)}">Войти</a>
                     </div>
                  </div>
               </div>
            </div>
         `);
         let loginModal = new bootstrap.Modal(document.querySelector('#loginModal'));
         loginModal.show();
      }
   }
   return [response, data];
}

function ruPlural(value, variants) {
   variants = variants.split(",");
   if (!value) {
      return variants[2];
   }
   value = Math.abs(parseInt(value));
   let variant;
   if (value % 10 === 1 && value % 100 !== 11) {
      variant = 0;
   } else if (2 <= value % 10 && value % 10 <= 4 && (value % 100 < 10 || value % 100 >= 20)) {
      variant = 1;
   } else {
      variant = 2;
   }
   return variants[variant];
}