function removeDomain(url) {
   return url.replace(/^.*\/\/[^\/]+/, '').slice(1);
}

function getURLParam(url, param) {
   let urlObj = new URL(url);
   let searchParams = urlObj.searchParams;
   return searchParams.get(param);
}

async function showMessage(type, HTMLText) {
   let messagesContainer = document.querySelector('#messagesContainer');
   let newMsgElem = document.createElement('div');
   newMsgElem.classList.add('toast', 'mb-1', `text-bg-${type}`);
   newMsgElem.setAttribute('role', 'alert');
   newMsgElem.setAttribute('aria-live', 'assertive');
   newMsgElem.setAttribute('aria-atomic', 'true');
   newMsgElem.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
         <div class="toast-body">${HTMLText}</div>
         <button type="button" class="btn-close btn-close-white me-3" data-bs-dismiss="toast" aria-label="Закрыть"></button>
      </div>
   `;
   messagesContainer.appendChild(newMsgElem);
   bootstrap.Toast.getOrCreateInstance(newMsgElem).show();
   await new Promise(resolve => setTimeout(resolve, 10000));
   messagesContainer.removeChild(newMsgElem);
}

async function fetchRequest(url, method = "GET") {
   let response = await fetch(url, {
      method: method,
      headers: {
         "Authorization": "Bearer ",  // TODO: read cookie token
      },
   });

   if (!response.ok) {
      let errorMsg = (await response.json())['detail'];

      if (response.status === 401) {
         document.querySelector('#modalPlace').innerHTML = `
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
                        <div class="d-flex">
                           <a class="btn bg-dark-blue-g col-6 me-2" href="/login">Войти</a>
                           <a class="btn bg-dark-blue-g col-6" href="/register">Регистрация</a>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         `;
         let loginModal = new bootstrap.Modal(document.querySelector('#loginModal'));
         loginModal.show();
      }
   }
   return response;
}