import re
from datetime import datetime
from email.utils import format_datetime
from xml.sax.saxutils import escape

from articles_data import ARTICLES

SITE_URL = 'https://roboweb.dev'

MONTHS_RU = {
    'января': 1, 'февраля': 2, 'марта': 3, 'апреля': 4, 'мая': 5, 'июня': 6,
    'июля': 7, 'августа': 8, 'сентября': 9, 'октября': 10, 'ноября': 11, 'декабря': 12,
}


def parse_ru_date(date_str: str) -> datetime:
    """Парсит дату вида '10 июня 2026' в datetime."""
    parts = date_str.strip().split()
    day = int(parts[0])
    month = MONTHS_RU.get(parts[1].lower(), 1)
    year = int(parts[2])
    return datetime(year, month, day, 9, 0, 0)


def markdown_to_html(content: str) -> str:
    """Простой конвертер markdown в HTML для RSS-контента (совместим с требованиями Дзена)."""
    lines = content.split('\n')
    html_parts = []
    in_list = False

    def close_list():
        nonlocal in_list
        if in_list:
            html_parts.append('</ul>')
            in_list = False

    def inline(text: str) -> str:
        text = escape(text)
        text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
        text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)
        return text

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            close_list()
            continue
        if line.startswith('## '):
            close_list()
            html_parts.append(f'<h2>{inline(line[3:])}</h2>')
        elif line.startswith('### '):
            close_list()
            html_parts.append(f'<h3>{inline(line[4:])}</h3>')
        elif line.startswith('- '):
            if not in_list:
                html_parts.append('<ul>')
                in_list = True
            html_parts.append(f'<li>{inline(line[2:])}</li>')
        elif re.match(r'^\d+\.\s', line):
            if not in_list:
                html_parts.append('<ul>')
                in_list = True
            item_text = re.sub(r'^\d+\.\s', '', line)
            html_parts.append(f'<li>{inline(item_text)}</li>')
        else:
            close_list()
            html_parts.append(f'<p>{inline(line)}</p>')

    close_list()
    return ''.join(html_parts)


def build_rss() -> str:
    now = datetime.utcnow()
    items_xml = []

    for a in ARTICLES:
        pub_date = parse_ru_date(a['date'])
        link = f"{SITE_URL}/blog/{a['slug']}"
        html_content = markdown_to_html(a['content'])
        cover_escaped = escape(a['cover'])
        # Дзен требует картинку в начале контента для корректного отображения обложки
        full_content = f'<img src="{cover_escaped}" />{html_content}'

        items_xml.append(f'''    <item>
      <title>{escape(a['title'])}</title>
      <link>{escape(link)}</link>
      <guid isPermaLink="true">{escape(link)}</guid>
      <pubDate>{format_datetime(pub_date)}</pubDate>
      <description>{escape(a['description'])}</description>
      <category>{escape(a['category'])}</category>
      <enclosure url="{escape(a['cover'])}" type="image/jpeg" />
      <content:encoded><![CDATA[{full_content}]]></content:encoded>
    </item>''')

    items_joined = '\n'.join(items_xml)

    return f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Блог Roboweb</title>
    <link>{SITE_URL}/blog</link>
    <description>Статьи об AI-разработке сайтов, советы для бизнеса и кейсы</description>
    <language>ru</language>
    <lastBuildDate>{format_datetime(now)}</lastBuildDate>
{items_joined}
  </channel>
</rss>'''


def handler(event: dict, context) -> dict:
    """Отдаёт RSS-фид блога Roboweb в формате, совместимом с требованиями Яндекс Дзен
    (полный HTML-контент статьи внутри content:encoded, обложка, категория, дата публикации)"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': ''
        }

    rss_xml = build_rss()

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/rss+xml; charset=utf-8',
        },
        'body': rss_xml,
        'isBase64Encoded': False,
    }