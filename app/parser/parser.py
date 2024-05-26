import requests
from bs4 import BeautifulSoup

from app.config import settings
from app.parser.HdRezkaApi import HdRezkaApi


class Parser:
    def __init__(self):
        self.DOMAIN = settings.rezka_url
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

    def _get_soup(self, url: str):
        page = requests.get(url, headers=self.HEADERS)
        if page.history:
            status_code = page.history[0].status_code
            status_codes_errors = {
                301: 'Error 301: Moved Permanently',
            }
            raise requests.exceptions.RequestException(status_codes_errors.get(status_code, f'Error {status_code}'))
        soup = BeautifulSoup(page.text, "html.parser")
        return soup

    def _get_content_inline_items(self, soup: BeautifulSoup, content_params: dict):
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

        navigation = soup.find('div', class_='b-navigation')
        page = 1
        pages = 1
        if navigation:
            page = int(next(filter(lambda s: s.text.strip().isdigit(), navigation.findAll('span'))).text)
            pages = int(next(filter(lambda s: s.text.strip().isdigit(), reversed(navigation.findAll('a')))).text)
            pages = pages if pages > page else page
        return {
            'page': page,
            'pages': pages,
            'content': response,
        }

    def search(self, q: str, page: int = 1):
        soup = self._get_soup(self.DOMAIN + f'search/?do=search&subaction=search&page={page}&q={q}')
        return self._get_content_inline_items(soup, {'class_': 'b-content__inline_items'})

    def collection(self, url: str, page: int = 1):
        soup = self._get_soup(self.DOMAIN + url + f'page/{page}/')
        return self._get_content_inline_items(soup, {'class_': 'b-content__inline_items'})

    def film_info(self, url: str):
        rezka = HdRezkaApi(self.DOMAIN + url)
        return self._get_dict_info(rezka, url)

    def stream(self, url: str, translation: int, season: int = None, episode: int = None):
        rezka = HdRezkaApi(self.DOMAIN + url)

        if rezka.type == 'tv_series' and not season and not episode:
            raise ValueError('The season and episode for series must be integers')

        return rezka.getStream(season, episode, translation).videos, self._get_dict_info(rezka, url)

    def latest_movies(self):
        def parse_genres():
            response = {}
            media_types = soup.findAll('li', class_='b-topnav__item')
            if not media_types:
                return []
            for media_type in media_types:
                genres_content = media_type.find('div', class_='b-topnav__sub')
                genres_response = {}
                if not genres_content:
                    continue
                for genre in genres_content.findAll('a', href=True):
                    if genre.text:
                        genres_response[genre.text.strip()] = genre['href']
                response[media_type.find('a', class_='b-topnav__item-link').text.strip()] = genres_response
            return response

        soup = self._get_soup(self.DOMAIN)
        return {
            'latest': self._get_content_inline_items(soup, {'class_': 'b-newest_slider__inner'}),
            'genres': parse_genres(),
        }
