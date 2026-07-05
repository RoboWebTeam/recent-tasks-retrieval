import os
import json
import base64
import zipfile
import io
import psycopg2
import boto3


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


# S3-хранилище настраивается через переменные окружения — провайдер-независимо.
# По умолчанию — прежний reg.ru; для смены провайдера (imbacloud/hostkey и т.п.)
# достаточно задать S3_* в .env, код менять не нужно.
S3_ENDPOINT = os.environ.get('S3_ENDPOINT_URL', 'https://s3.regru.cloud')
S3_REGION = os.environ.get('S3_REGION', '')
S3_BUCKET = os.environ.get('S3_BUCKET', 'roboweb')
S3_PUBLIC_BASE = (os.environ.get('S3_PUBLIC_BASE') or f'{S3_ENDPOINT}/{S3_BUCKET}').rstrip('/')
S3_ACL = os.environ.get('S3_ACL', 'public-read')  # пусто = не отправлять ACL (если провайдер его не поддерживает)


def get_s3():
    kwargs = {
        'endpoint_url': S3_ENDPOINT,
        'aws_access_key_id': os.environ.get('S3_ACCESS_KEY_ID') or os.environ.get('REG_S3_ACCESS_KEY_ID', ''),
        'aws_secret_access_key': os.environ.get('S3_SECRET_ACCESS_KEY') or os.environ.get('REG_S3_SECRET_ACCESS_KEY', ''),
    }
    if S3_REGION:
        kwargs['region_name'] = S3_REGION
    return boto3.client('s3', **kwargs)


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
    }


def ok(data):
    return {'statusCode': 200, 'headers': cors_headers(), 'body': data}


def err(msg, code=400):
    return {'statusCode': code, 'headers': cors_headers(), 'body': {'error': msg}}


def get_user_id(cur, session_id: str, schema: str):
    cur.execute(
        f"SELECT user_id FROM {schema}.sessions WHERE id = %s AND expires_at > NOW()",
        (session_id,)
    )
    row = cur.fetchone()
    return row[0] if row else None


IMAGE_CONTENT_TYPES = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
}


def detect_file_kind(file_name: str, is_zip: bool):
    """Определяет тип файла (zip/html/image) и корректный Content-Type по расширению."""
    ext = file_name.rsplit('.', 1)[-1].lower() if '.' in file_name else ''

    if is_zip:
        return 'zip', 'zip', 'application/zip'

    if ext in IMAGE_CONTENT_TYPES:
        return 'image', ext, IMAGE_CONTENT_TYPES[ext]

    return 'html', 'html', 'text/html'


def handler(event: dict, context) -> dict:
    """Загрузка, список и удаление готовых сайтов пользователя (HTML/ZIP) в S3-хранилище"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    session_id = headers.get('x-session-id', '')
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

    if not session_id:
        return err('Не авторизован', 401)

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            user_id = get_user_id(cur, session_id, schema)
            if not user_id:
                return err('Сессия истекла', 401)

            if method == 'GET':
                cur.execute(
                    f"SELECT id, project_id, file_name, file_url, file_type, file_size, created_at "
                    f"FROM {schema}.site_files WHERE user_id = %s ORDER BY created_at DESC",
                    (user_id,)
                )
                rows = cur.fetchall()
                files = [
                    {
                        'id': r[0], 'project_id': r[1], 'file_name': r[2],
                        'file_url': r[3], 'file_type': r[4], 'file_size': r[5],
                        'created_at': r[6].isoformat(),
                    }
                    for r in rows
                ]
                return ok({'files': files})

            if method == 'POST':
                body = json.loads(event.get('body') or '{}')
                file_name = body.get('file_name', '').strip()
                file_content_b64 = body.get('file_content', '')
                project_id = body.get('project_id')
                is_zip = body.get('is_zip', False)

                if not file_name or not file_content_b64:
                    return err('Не переданы данные файла')

                raw = base64.b64decode(file_content_b64)

                if is_zip and not zipfile.is_zipfile(io.BytesIO(raw)):
                    return err('Файл повреждён или не является ZIP-архивом')

                file_type, ext, content_type = detect_file_kind(file_name, is_zip)

                safe_name = ''.join(c for c in file_name if c.isalnum() or c in ('-', '_', '.')) or f'file.{ext}'
                key = f"sites/{user_id}/{context.request_id}_{safe_name}"

                s3 = get_s3()
                # ACL='public-read' обязателен: без него reg.ru отдаёт 403 при попытке
                # открыть файл по прямой ссылке, даже если сам bucket публичный.
                put_kwargs = {'Bucket': S3_BUCKET, 'Key': key, 'Body': raw, 'ContentType': content_type}
                if S3_ACL:
                    put_kwargs['ACL'] = S3_ACL
                s3.put_object(**put_kwargs)
                cdn_url = f"{S3_PUBLIC_BASE}/{key}"

                cur.execute(
                    f"INSERT INTO {schema}.site_files (user_id, project_id, file_name, file_key, file_url, file_type, file_size) "
                    f"VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id, created_at",
                    (user_id, project_id, safe_name, key, cdn_url, file_type, len(raw))
                )
                file_id, created_at = cur.fetchone()
                conn.commit()

                return ok({'file': {
                    'id': file_id, 'project_id': project_id, 'file_name': safe_name,
                    'file_url': cdn_url, 'file_type': file_type, 'file_size': len(raw),
                    'created_at': created_at.isoformat(),
                }})

            if method == 'DELETE':
                params = event.get('queryStringParameters') or {}
                file_id = params.get('id')
                if not file_id:
                    return err('Укажите id файла')

                cur.execute(
                    f"SELECT file_key FROM {schema}.site_files WHERE id = %s AND user_id = %s",
                    (file_id, user_id)
                )
                row = cur.fetchone()
                if not row:
                    return err('Файл не найден', 404)

                s3 = get_s3()
                try:
                    s3.delete_object(Bucket=S3_BUCKET, Key=row[0])
                except Exception:
                    pass

                cur.execute(
                    f"DELETE FROM {schema}.site_files WHERE id = %s AND user_id = %s",
                    (file_id, user_id)
                )
                conn.commit()
                return ok({'ok': True})

    finally:
        conn.close()

    return err('Not found', 404)