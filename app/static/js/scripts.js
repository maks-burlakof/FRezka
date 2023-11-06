function removeDomain(url) {
   return url.replace(/^.*\/\/[^\/]+/, '').slice(1);
}

function getURLParam(url, param) {
   let urlObj = new URL(url);
   let searchParams = urlObj.searchParams;
   return searchParams.get(param);
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
   setTimeout(function () {
      newMsgElem.remove();
   }, 10000);
}

async function fetchRequest(url, method = "GET", ignoreAuth = false) {
   let response = await fetch(url, {
      method: method,
      headers: {
         "Content-Type": "application/json",
         "Authorization": `Bearer ${Cookies.get('access_token')}`,
      },
   });

   if (!response.ok && !ignoreAuth) {
      let errorMsg = (await response.json())['detail'];

      if (response.status === 401) {
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
                        <img class="img-fluid p-4 p-sm-5" src="static/img/sign-up.svg">
                        <a class="btn bg-dark-blue-g w-100" href="/login">Войти</a>
                     </div>
                  </div>
               </div>
            </div>
         `);
         let loginModal = new bootstrap.Modal(document.querySelector('#loginModal'));
         loginModal.show();
      }
   }
   return response;
}