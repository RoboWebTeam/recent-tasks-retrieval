import { useEffect } from 'react';
import { getLang } from '@/lib/i18n';
import { setSeo } from '@/lib/seo';
import LegalPageLayout from '@/components/legal/LegalPageLayout';

export default function Privacy() {
  const lang = getLang();
  const isRu = lang === 'ru';

  useEffect(() => {
    setSeo({
      title: isRu ? 'Политика конфиденциальности' : 'Privacy Policy',
      description: isRu
        ? 'Политика конфиденциальности Roboweb — как мы собираем, используем и защищаем персональные данные пользователей.'
        : 'Roboweb Privacy Policy — how we collect, use and protect users\' personal data.',
      url: '/privacy',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isRu) {
    return (
      <LegalPageLayout title="Privacy Policy" updatedAt="July 4, 2026">
        <p>
          This Privacy Policy describes how Individual Entrepreneur Arakelov Stanislav Vladislavovich
          (OGRNIP 324508100357892, TIN 501210007760), operating the Roboweb service at roboweb.site
          (the "Operator"), collects, uses, stores and protects personal data of Service users.
        </p>
        <h2>1. What Data We Collect</h2>
        <p>1.1. When registering an account (email/password), we collect:</p>
        <ul>
          <li>full name;</li>
          <li>email address;</li>
          <li>password (stored only as a bcrypt hash, never in plain text).</li>
        </ul>
        <p>1.2. When signing in via third-party services, we receive:</p>
        <ul>
          <li><strong>GitHub</strong> — email, name/username, GitHub login, OAuth access token (used to publish sites to your GitHub repository);</li>
          <li><strong>Yandex ID</strong> — email and name from your Yandex profile;</li>
          <li><strong>Telegram</strong> — Telegram ID and name provided by the Telegram Login Widget.</li>
        </ul>
        <p>1.3. When making a payment, we additionally process: name, email, phone (optional), selected plan, and payment amount — processed by the YooKassa payment system.</p>
        <p>1.4. Automatically collected data: IP address, browser/device type, pages visited, and usage statistics, collected via Yandex.Metrika (counter ID 101026698).</p>
        <p>1.5. Content you create: website projects, generated HTML code, uploaded and AI-generated images, stored in our PostgreSQL database and S3-compatible file storage.</p>
        <h2>2. Purposes of Processing</h2>
        <ul>
          <li>account registration and authentication;</li>
          <li>providing access to the Service and its functionality according to your plan;</li>
          <li>processing payments and issuing receipts;</li>
          <li>technical support and communication about your account;</li>
          <li>improving the Service, analytics and fraud prevention;</li>
          <li>sending service notifications (e.g. low AI request balance).</li>
        </ul>
        <h2>3. Legal Basis and Storage</h2>
        <p>
          3.1. Personal data is processed based on the User's consent, given upon registration and/or accepting
          this Policy, and for the purpose of performing the Public Offer Agreement.
        </p>
        <p>
          3.2. Data is stored in a PostgreSQL database and S3-compatible object storage located on servers used by
          the Service's hosting/infrastructure provider (poehali.dev platform infrastructure).
        </p>
        <p>3.3. Passwords are never stored in plain text — only as bcrypt hashes.</p>
        <h2>4. Data Sharing with Third Parties</h2>
        <p>4.1. We do not sell personal data to third parties. Data may be shared only with:</p>
        <ul>
          <li><strong>YooKassa</strong> — for payment processing;</li>
          <li><strong>Anthropic / OpenAI</strong> — your chat messages are sent to generate website content and images (DALL-E); these providers process the request text but are not authorized to use it for purposes other than generating the response;</li>
          <li><strong>Yandex.Metrika</strong> — anonymized usage/analytics data;</li>
          <li>government authorities — only if required by applicable law.</li>
        </ul>
        <h2>5. Cookies and Similar Technologies</h2>
        <p>
          5.1. The Service uses browser local storage to keep your session identifier, interface language and
          cached profile data on your device.
        </p>
        <p>5.2. Yandex.Metrika sets its own cookies for traffic analysis, click maps and session recording (webvisor).</p>
        <p>5.3. You can clear cookies and local storage at any time through your browser settings; this may require re-authentication.</p>
        <h2>6. Data Retention</h2>
        <p>
          6.1. Personal data is stored for as long as your account is active. Upon account deletion, personal data
          is deleted or anonymized, except where retention is required by law (e.g., payment records for tax purposes).
        </p>
        <h2>7. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>request access to your personal data;</li>
          <li>request correction of inaccurate data (via your account profile);</li>
          <li>request deletion of your account and associated data (via the "Delete account" option in your profile, or by writing to us);</li>
          <li>withdraw consent to processing at any time.</li>
        </ul>
        <p>To exercise these rights, contact us at roboweb.site@yandex.ru.</p>
        <h2>8. Data Security</h2>
        <p>
          We apply reasonable technical and organizational measures to protect personal data, including password
          hashing, restricted database access, and HTTPS encryption for data in transit.
        </p>
        <h2>9. Changes to this Policy</h2>
        <p>
          We may update this Policy from time to time. The current version is always available at roboweb.site/privacy.
          Continued use of the Service after changes constitutes acceptance of the updated Policy.
        </p>
        <h2>10. Operator Contact Details</h2>
        <p>
          Individual Entrepreneur Arakelov Stanislav Vladislavovich<br />
          OGRNIP: 324508100357892<br />
          TIN: 501210007760<br />
          Email: roboweb.site@yandex.ru<br />
          Phone: +7 (933) 177-00-86
        </p>
      </LegalPageLayout>
    );
  }

  return (
    <LegalPageLayout title="Политика конфиденциальности" updatedAt="4 июля 2026 г.">
      <p>
        Настоящая Политика конфиденциальности (далее — «Политика») описывает порядок сбора, использования, хранения
        и защиты персональных данных пользователей сервиса Roboweb (roboweb.site), оператором которого является
        индивидуальный предприниматель Аракелов Станислав Владиславович (ОГРНИП 324508100357892, ИНН 501210007760),
        далее — «Оператор».
      </p>

      <h2>1. Какие данные мы собираем</h2>
      <p>1.1. При регистрации по email и паролю мы собираем:</p>
      <ul>
        <li>имя пользователя;</li>
        <li>адрес электронной почты;</li>
        <li>пароль (хранится исключительно в виде bcrypt-хэша, в открытом виде не сохраняется).</li>
      </ul>
      <p>1.2. При входе через сторонние сервисы мы получаем:</p>
      <ul>
        <li><strong>GitHub</strong> — email, имя/логин, GitHub-логин, токен доступа OAuth (используется для публикации сайтов в ваш репозиторий GitHub);</li>
        <li><strong>Яндекс ID</strong> — email и имя из вашего профиля Яндекс;</li>
        <li><strong>Telegram</strong> — Telegram ID и имя, передаваемые виджетом входа Telegram.</li>
      </ul>
      <p>
        1.3. При оплате тарифа дополнительно обрабатываются: имя, email, телефон (опционально), выбранный тариф
        и сумма платежа — обработку осуществляет платёжная система ЮKassa.
      </p>
      <p>
        1.4. Автоматически собираемые данные: IP-адрес, тип браузера/устройства, посещённые страницы и статистика
        использования — собираются через Яндекс.Метрику (счётчик № 101026698).
      </p>
      <p>
        1.5. Создаваемый вами контент: проекты сайтов, сгенерированный HTML-код, загруженные и созданные
        через AI изображения — хранятся в базе данных PostgreSQL и S3-совместимом файловом хранилище Сервиса.
      </p>

      <h2>2. Цели обработки данных</h2>
      <ul>
        <li>регистрация и аутентификация аккаунта;</li>
        <li>предоставление доступа к Сервису и его функциям в соответствии с тарифом;</li>
        <li>обработка платежей и формирование чеков;</li>
        <li>техническая поддержка и связь по вопросам аккаунта;</li>
        <li>улучшение Сервиса, аналитика и предотвращение мошенничества;</li>
        <li>отправка сервисных уведомлений (например, о низком балансе запросов к AI).</li>
      </ul>

      <h2>3. Правовые основания и место хранения</h2>
      <p>
        3.1. Персональные данные обрабатываются на основании согласия Пользователя, предоставляемого при
        регистрации и/или принятии настоящей Политики, а также в целях исполнения договора публичной оферты.
      </p>
      <p>
        3.2. Данные хранятся в базе данных PostgreSQL и S3-совместимом объектном хранилище, размещённых на
        серверах инфраструктуры платформы, используемой Сервисом (poehali.dev).
      </p>
      <p>3.3. Пароли никогда не хранятся в открытом виде — только в виде bcrypt-хэша.</p>

      <h2>4. Передача данных третьим лицам</h2>
      <p>4.1. Мы не продаём персональные данные третьим лицам. Данные могут передаваться только:</p>
      <ul>
        <li><strong>ЮKassa</strong> — для обработки платежей;</li>
        <li><strong>Anthropic / OpenAI</strong> — текст ваших сообщений в чате передаётся для генерации контента
          сайта и изображений (DALL-E); эти поставщики обрабатывают текст запроса, но не вправе использовать
          его для иных целей, кроме генерации ответа;</li>
        <li><strong>Яндекс.Метрика</strong> — обезличенные данные об использовании сайта;</li>
        <li>государственным органам — только в случаях, предусмотренных законодательством РФ.</li>
      </ul>

      <h2>5. Cookies и аналогичные технологии</h2>
      <p>
        5.1. Сервис использует локальное хранилище браузера (localStorage) для хранения идентификатора сессии,
        языка интерфейса и кэшированных данных профиля на вашем устройстве.
      </p>
      <p>5.2. Яндекс.Метрика устанавливает собственные cookies для анализа трафика, карты кликов и записи сессий (вебвизор).</p>
      <p>5.3. Вы можете в любой момент очистить cookies и localStorage через настройки браузера; это может потребовать повторной авторизации.</p>

      <h2>6. Срок хранения данных</h2>
      <p>
        6.1. Персональные данные хранятся в течение всего срока действия аккаунта. При удалении аккаунта
        персональные данные удаляются или обезличиваются, за исключением случаев, когда их хранение требуется
        законом (например, данные о платежах для целей налогового учёта).
      </p>

      <h2>7. Ваши права</h2>
      <p>Вы имеете право:</p>
      <ul>
        <li>запросить доступ к своим персональным данным;</li>
        <li>потребовать исправления неточных данных (через профиль в личном кабинете);</li>
        <li>потребовать удаления аккаунта и связанных с ним данных (через функцию «Удалить аккаунт» в профиле
          или обратившись к нам);</li>
        <li>отозвать согласие на обработку в любой момент.</li>
      </ul>
      <p>Для реализации этих прав обращайтесь по адресу roboweb.site@yandex.ru.</p>

      <h2>8. Защита данных</h2>
      <p>
        Мы применяем разумные технические и организационные меры для защиты персональных данных, включая
        хэширование паролей, ограничение доступа к базе данных и шифрование передачи данных по протоколу HTTPS.
      </p>

      <h2>9. Изменения Политики</h2>
      <p>
        Мы можем время от времени обновлять настоящую Политику. Актуальная версия всегда доступна по адресу
        roboweb.site/privacy. Продолжение использования Сервиса после внесения изменений означает согласие
        с обновлённой Политикой.
      </p>

      <h2>10. Контактные данные Оператора</h2>
      <p>
        Индивидуальный предприниматель Аракелов Станислав Владиславович<br />
        ОГРНИП: 324508100357892<br />
        ИНН: 501210007760<br />
        Email: roboweb.site@yandex.ru<br />
        Телефон: 8 (933) 177-00-86
      </p>
    </LegalPageLayout>
  );
}
