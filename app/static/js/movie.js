window.addEventListener("load", function(){
   let rezkaShortUrl = getURLParam(location.href, 'u');
   fetch(`/api/media/info?u=${rezkaShortUrl}`)
      .then(response => response.json())
      .then(data => {
         console.log(data);
         // TODO: if backed error - create bootstrap alert and return

         let placeholderInfo = document.querySelector('#movieInfoPlaceholder');
         placeholderInfo.classList.add('d-none');
         let placeholderCover = document.querySelector('#movieCoverPlaceholder');
         placeholderCover.classList.add('d-none');

         document.querySelector('#movieCover').src = data['cover_url'];
         document.querySelector('#movieTitle').innerText = data['title'];
         document.querySelector('#movieYear').innerText = '-';
         document.querySelector('#movieRating').innerHTML = data['rating_value'];
         document.querySelector('#movieHdRezkaBtn').href = data['url'];
      })
      .catch(error => console.error(error));
});
