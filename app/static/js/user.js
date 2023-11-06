async function redirectIsLogged() {
   let responseUser = await fetchRequest('/api/user/', "GET", true);
   if (responseUser.ok) {
      $(location).attr('href', '/profile/');
   }
}

function initializeAuthForm() {
   $('#authTabSwitcher input').click(function(){
      let tabId = $(this).attr('data-tab');
      let tabName = $(this).attr('data-name');

      $('div.tab-pane').removeClass('active');
      $("#"+tabId).addClass('active');

      $('#headerTitle').text(tabName);
   })

   $('#loginForm').submit(async function (e) {
      e.preventDefault();
      let response = await fetch('/api/auth/login/', {
         method: 'POST',
         headers: {
            "Content-Type": "application/x-www-form-urlencoded",
         },
         body: `grant_type=password&username=${encodeURIComponent($('#loginUsername').val())}&password=${encodeURIComponent($('#loginPassword').val())}`,
      });
      let data = await response.json();

      if (!response.ok) {
         let errorMsg = '';
         if (response.status === 403) {
            errorMsg = 'Неверный логин или пароль.';
         } else {
            errorMsg = 'Произошла внутренняя ошибка.';
         }
         $('#loginErrorContainer').removeClass('d-none');
         $('#loginErrorText').text(errorMsg);
         return;
      }

      Cookies.set('access_token', data['access_token'], { expires: 365 });
      $(location).attr('href', '/profile/');
   })

   $('#registerForm').submit(async function (e) {
      function showError(msg) {
         $('#registerErrorContainer').removeClass('d-none');
         $('#registerSuccessContainer').addClass('d-none');
         $('#registerErrorText').text(msg);
      }

      e.preventDefault();

      if ($('#registerAgree').val() !== 'on') {
         showError('Примите пользовательское соглашение.');
         return;
      }
      if ($('#registerPassword1').val() !== $('#registerPassword2').val()) {
         showError('Пароли должны совпадать.');
         return;
      }

      let response = await fetch('/api/auth/register/', {
         method: 'POST',
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify({'username': $('#registerUsername').val(), 'password': $('#registerPassword1').val()}),
      });
      let data = await response.json();

      if (!response.ok) {
         if (response.status === 409) {
            showError('Такой пользователь уже зарегистрирован.');
         } else if (response.status === 422) {
            showError(data['detail'][0]['msg']);
         } else {
            showError('Произошла внутренняя ошибка.');
         }
         return;
      }

      $('#registerErrorContainer').addClass('d-none');
      $('#registerSuccessContainer').removeClass('d-none');
      $('#registerSuccessText').text(`Поздравляю! Теперь можешь войти под своим ником @${$('#registerUsername').val()}!`);
   })
}