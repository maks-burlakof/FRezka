import requests
from bs4 import BeautifulSoup

from app.parser.HdRezkaApi import HdRezkaApi


class Parser:
    def __init__(self):
        self.DOMAIN = 'https://kinopub.me/'
        self.HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36'}

    def _get_dict_info(self, rezka: HdRezkaApi, url: str):
        return {
            'id': rezka.id,
            'title': rezka.name,
            'rezka_url': url,
            'year': rezka.year,
            'type': str(rezka.type),
            'cover_url': rezka.thumbnail,
            'rating_value': rezka.rating.value,
            'rating_votes': rezka.rating.votes,
            'translators': rezka.translators,
            'other_parts': rezka.otherParts,
            'series_info': rezka.seriesInfo,
        }

    def _get_content_inline_items(self, url: str, content_params: dict):
        page = requests.get(url, headers=self.HEADERS)
        soup = BeautifulSoup(page.text, "html.parser")
        content = soup.find('div', **content_params)
        if not content:
            return []
        results = content.findAll('div', 'b-content__inline_item')

        response = []
        for result in results:
            info_div = result.find('div', class_='b-content__inline_item-link')
            cover_div = result.find('div', class_='b-content__inline_item-cover')
            title = info_div.find('a', href=True)
            tags = info_div.find('div').text.split(', ')
            cover_url = cover_div.find('img')['src']
            type_str = cover_div.find('i', 'entity').text

            response.append({
                'title': title.text,
                'url': title['href'],
                'cover_url': cover_url,
                'type': type_str,
                'year': tags[0],
                'country': tags[1],
                'genre': tags[2],
            })
        return response

    def search(self, q: str):
        url = self.DOMAIN + 'search/?do=search&subaction=search&q=' + q
        return self._get_content_inline_items(url, {'class_': 'b-content__inline_items'})

    def film_info(self, url: str):
        rezka = HdRezkaApi(self.DOMAIN + url)
        return self._get_dict_info(rezka, url)

    def stream(self, url: str, translation: int, season: int = None, episode: int = None):
        rezka = HdRezkaApi(self.DOMAIN + url)

        if rezka.type == 'tv_series' and not season and not episode:
            raise ValueError('The season and episode for series must be integers')

        return rezka.getStream(season, episode, translation).videos, self._get_dict_info(rezka, url)

    def latest_movies(self):
        return self._get_content_inline_items(self.DOMAIN, {'class_': 'b-newest_slider__inner'})
