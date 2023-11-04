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