import { useEffect } from 'react';
import { getLang } from '@/lib/i18n';
import { setSeo } from '@/lib/seo';
import LegalPageLayout from '@/components/legal/LegalPageLayout';

export default function PersonalData() {
  const lang = getLang();
  const isRu = lang === 'ru';

  useEffect(() => {
    setSeo({
      title: isRu ? 'Согласие на обработку персональных данных' : 'Consent to Personal Data Processing',
      description: isRu
        ? 'Согласие пользователя Roboweb на обработку персональных данных в соответствии с ФЗ-152.'
        : 'Roboweb user consent to personal data processing in accordance with Russian Federal Law 152-FZ.',
      url: '/personal-data',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isRu) {
    return (
      <LegalPageLayout title="Consent to Personal Data Processing" updatedAt="July 4, 2026">
        <p>
          By registering an account on the Roboweb service (roboweb.dev), I confirm that I give my consent to the
          processing of my personal data to Individual Entrepreneur Arakelov Stanislav Vladislavovich
          (OGRNIP 324508100357892, TIN 501210007760), hereinafter — the "Operator", on the terms below, in
          accordance with Federal Law No. 152-FZ "On Personal Data" dated July 27, 2006.
        </p>
        <h2>1. List of Personal Data Covered by this Consent</h2>
        <ul>
          <li>full name;</li>
          <li>email address;</li>
          <li>phone number (if provided during payment);</li>
          <li>data received from third-party authorization services (GitHub, Yandex ID): name, email, unique account identifiers, OAuth access tokens;</li>
          <li>payment data processed through YooKassa (payment amount, plan, transaction status);</li>
          <li>technical data: IP address, browser and device information, cookies and usage statistics.</li>
        </ul>
        <h2>2. Purposes of Processing</h2>
        <ul>
          <li>registration and identification of the User in the Service;</li>
          <li>providing access to the Service's functionality;</li>
          <li>processing payments for subscription plans and additional AI request packages;</li>
          <li>sending service and informational messages related to the use of the Service;</li>
          <li>fulfilling obligations under the Public Offer Agreement;</li>
          <li>improving the quality of the Service and analyzing its usage.</li>
        </ul>
        <h2>3. List of Actions with Personal Data</h2>
        <p>
          I consent to the following actions with my personal data: collection, recording, systematization,
          accumulation, storage, clarification, extraction, use, transfer (provision, access), depersonalization,
          blocking, deletion and destruction, carried out both with and without the use of automation tools.
        </p>
        <h2>4. Data Transfer to Third Parties</h2>
        <p>
          I am informed and agree that, to the extent necessary to achieve the purposes above, my personal data
          may be transferred to: the YooKassa payment system, Anthropic and OpenAI (for AI content generation
          based on my requests), and the Yandex.Metrika analytics service.
        </p>
        <h2>5. Consent Validity Period</h2>
        <p>
          This consent is valid for the entire period of use of the Service and for 3 years after account
          deletion, unless a longer storage period is required by applicable law (e.g., for accounting and tax
          purposes related to payments).
        </p>
        <h2>6. Withdrawal of Consent</h2>
        <p>
          I may withdraw this consent at any time by sending a written request to roboweb.site@yandex.ru or by
          deleting my account through the personal account interface. Withdrawal of consent may result in the
          inability to continue using the Service.
        </p>
        <h2>7. Operator Details</h2>
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
    <LegalPageLayout title="Согласие на обработку персональных данных" updatedAt="4 июля 2026 г.">
      <p>
        Регистрируясь на сервисе Roboweb (roboweb.dev), я подтверждаю своё согласие на обработку моих персональных
        данных индивидуальным предпринимателем Аракеловым Станиславом Владиславовичем (ОГРНИП 324508100357892,
        ИНН 501210007760), далее — «Оператор», на изложенных ниже условиях, в соответствии с Федеральным законом
        от 27.07.2006 № 152-ФЗ «О персональных данных».
      </p>

      <h2>1. Перечень персональных данных, на обработку которых даётся согласие</h2>
      <ul>
        <li>фамилия, имя;</li>
        <li>адрес электронной почты;</li>
        <li>номер телефона (при указании во время оплаты);</li>
        <li>данные, полученные от сторонних сервисов авторизации (GitHub, Яндекс ID): имя, email,
          уникальные идентификаторы аккаунта, токены доступа OAuth;</li>
        <li>данные об оплате, обрабатываемые через ЮKassa (сумма платежа, тариф, статус транзакции);</li>
        <li>технические данные: IP-адрес, информация о браузере и устройстве, cookies и статистика использования.</li>
      </ul>

      <h2>2. Цели обработки</h2>
      <ul>
        <li>регистрация и идентификация Пользователя в Сервисе;</li>
        <li>предоставление доступа к функциональности Сервиса;</li>
        <li>обработка платежей за тарифные планы и дополнительные пакеты запросов к AI;</li>
        <li>направление сервисных и информационных сообщений, связанных с использованием Сервиса;</li>
        <li>исполнение обязательств по договору публичной оферты;</li>
        <li>улучшение качества Сервиса и анализ его использования.</li>
      </ul>

      <h2>3. Перечень действий с персональными данными</h2>
      <p>
        Согласие даётся на совершение следующих действий с персональными данными: сбор, запись, систематизация,
        накопление, хранение, уточнение, извлечение, использование, передачу (предоставление, доступ),
        обезличивание, блокирование, удаление и уничтожение — как с использованием средств автоматизации, так
        и без их использования.
      </p>

      <h2>4. Передача данных третьим лицам</h2>
      <p>
        Я проинформирован(а) и согласен(на) с тем, что в объёме, необходимом для достижения указанных выше целей,
        мои персональные данные могут передаваться: платёжной системе ЮKassa, компаниям Anthropic и OpenAI
        (для генерации контента с помощью AI на основе моих запросов), а также сервису аналитики Яндекс.Метрика.
      </p>

      <h2>5. Срок действия согласия</h2>
      <p>
        Настоящее согласие действует в течение всего периода использования Сервиса и в течение 3 лет после
        удаления аккаунта, если более длительный срок хранения не требуется применимым законодательством
        (например, для целей бухгалтерского и налогового учёта платежей).
      </p>

      <h2>6. Отзыв согласия</h2>
      <p>
        Я вправе отозвать настоящее согласие в любой момент, направив письменное заявление на адрес
        roboweb.site@yandex.ru, либо удалив свой аккаунт через интерфейс личного кабинета. Отзыв согласия
        может повлечь невозможность дальнейшего использования Сервиса.
      </p>

      <h2>7. Реквизиты Оператора</h2>
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