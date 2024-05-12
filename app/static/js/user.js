async function redirectIsLogged() {
   let [responseUser, user] = await fetchRequest('/api/user/', true);
   if (responseUser.ok) {
      $(location).attr('href', '/profile');
   }
}

function logout() {
   Cookies.remove('access_token');
   location.reload();
   showMessage('danger', 'Вы вышли');
}

function initializeAuthForm() {
   $('#authTabSwitcher input').click(function(){
      let tabId = $(this).attr('data-tab');
      let tabName = $(this).attr('data-name');

      $('div.tab-pane').removeClass('active');
      $("#"+tabId).addClass('active');

      $('#headerTitle').text(tabName);
   })

   $('#loginPassword').on('input', function() {
      $('#loginErrorContainer').addClass('d-none');
   });

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
      let nextURL = getURLParam(location.href ,'next');
      $(location).attr('href', nextURL ? nextURL : '/profile/');
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

async function initializeProfileForms() {
   let [response, user] = await fetchRequest('/api/user/');
   if (response.ok) {
      $(document).prop('title', `${user.username} · FRezka`);

      // Fill info in forms
      let lastChangedUsernameDays = Math.round(Math.abs(new Date - new Date(user.username_last_changed))/ (1000 * 60 * 60 * 24));
      if (lastChangedUsernameDays < 60) {
         $('#personalUsernameLastChangedInfo').html(`
            <span class="mt-1 text-danger lh-1">Твой никнейм был изменен ${lastChangedUsernameDays} ${ruPlural(lastChangedUsernameDays, 'день,дня,дней')} назад</span>
         `);
      }
      $('#personalUsername').val(user.username);
      $('#personalKinopoiskUsername').val(user.kinopoisk_username);
      $('#personalKinopoiskBtn').click(() => {
         window.open(`https://mykp.ru/${user.kinopoisk_username}`, '_blank');
      })
      let dateJoined = new Date(user.date_joined);
      let dateJoinedDays = Math.round(Math.abs(new Date() - dateJoined) / (1000 * 60 * 60 * 24));
      $('#personalDateJoinedInfo').html(`
         <p class="mb-2">Мы знакомы с тобой уже ${dateJoinedDays} ${ruPlural(dateJoinedDays, 'день,дня,дней')}, и с каждым днем наша дружба крепчает.</p>
         <p>Ты присоединился ${dateJoined.toLocaleDateString('ru-RU', {year: 'numeric', month: 'long', day: 'numeric'})}</p>
      `);

      $('#securityPasswordOld').val('');
      $('#securityPasswordNew1').val('');
      $('#securityPasswordNew2').val('');
   } else {
      $(location).attr('href', '/login?next=/profile');
   }
}

async function handleProfileForms() {
   $('#personalForm').submit(async function (e) {
      e.preventDefault();

      let [formResponse, formData] = await fetchRequest('/api/user/', true, 'PATCH', JSON.stringify({
         'username': $('#personalUsername').val(),
         'kinopoisk_username': $('#personalKinopoiskUsername').val(),
      }));

      if (!formResponse.ok) {
         $('#personalErrorContainer').removeClass('d-none');
         $('#personalErrorText').text(formData['detail'][0]['msg'] || formData['detail']);
      } else {
         showMessage('success', '<i class="fa-solid fa-check me-1"></i> Профиль обновлен');
         await initializeProfileForms();
         $('#personalErrorContainer').addClass('d-none');
      }
   });

   $('#securityForm').submit(async function (e) {
      function showError(msg) {
         $('#securityErrorContainer').removeClass('d-none');
         $('#securityErrorText').text(msg);
      }

      e.preventDefault();

      if ($('#securityPasswordNew1').val() !== $('#securityPasswordNew2').val()) {
         showError('Пароли должны совпадать.');
         return;
      }

      let [formResponse, formData] = await fetchRequest('/api/user/change-password', true, 'PATCH', JSON.stringify({
         'current_password': $('#securityPasswordOld').val(),
         'new_password': $('#securityPasswordNew1').val(),
      }));

      if (!formResponse.ok) {
         showError(formData['detail'][0]['msg'] || formData['detail']);
      } else {
         showMessage('success', '<i class="fa-solid fa-check me-1"></i> Пароль обновлен');
         $('#securityErrorContainer').addClass('d-none');
      }
   });
}

async function createProfileMenu(response, user) {
   if (response.ok) {
      $('#userMenu').html(`
         <li><a href="/profile/" class="dropdown-item" style="color: #A8E063FF"><i class="fa-solid fa-at me-1"></i>${user['username']}</a></li>
         <li><a href="/profile/watched/" class="dropdown-item">Фильмы</a></li>
         <li><button class="dropdown-item" type="button" onclick="logout()" style="opacity: 70%">Выйти</button></li>
      `);
   } else {
      $('#userMenu').html(`
         <li><a class="dropdown-item" href="/login?next=${makeNextURLParam(location)}">Войти</a></li>
      `);
   }
}

async function initializeUser() {
   let [response, user] = await fetchRequest('/api/user/', true);
   createProfileMenu(response, user);
}

$(document).ready(function() {
   initializeUser();
});
