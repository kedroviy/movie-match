import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nMessage, LandingLocale } from './i18n.model';

const DEFAULT_NAMESPACE = 'landing';
const FALLBACK_LOCALE: LandingLocale = 'en';
const SUPPORTED_LOCALES: readonly LandingLocale[] = ['en', 'ru', 'es', 'de', 'ja'] as const;

const DEFAULT_MESSAGES: Record<LandingLocale, Record<string, string>> = {
    en: {
        'header.features': 'Features',
        'header.guides': 'Guides',
        'header.download': 'Google Play',
        'header.faq': 'FAQ',
        'header.reviews': 'Reviews',
        'header.start': 'Start',
        'header.startAria': 'Start: open the app on Google Play',
        'header.brandAria': 'Movie Match - jump to top',
        'header.langAria': 'Language',
        'hero.badge': 'Movie Match · entertainment · Google Play',
        'hero.title.before': 'Movie night picks -',
        'hero.title.highlight': 'without arguments',
        'hero.title.after': 'with friends, a partner, or solo',
        'hero.description':
            'Just like in the Google Play app listing: lobby, invite, and shared selection with friends or your partner - or a solo picker when you want a movie for yourself without a lobby or second participant.',
        'hero.webCta': 'Create account (web)',
        'hero.webCtaAria': 'Create a Movie Match account in the browser',
        'hero.playCta': 'Download on Google Play',
        'hero.playCtaAria': 'Download Movie Match on Google Play (opens in a new tab)',
        'features.title': 'Together or solo',
        'features.description':
            'The app offers a lobby, invites, and shared selection - plus a solo flow when you are choosing the movie night pick by yourself.',
        'scenario.title': 'Your scenario',
        'scenario.description': 'Choose a mode: with friends, as a couple, or solo movie picking for tonight.',
        'scenario.legend': 'Choose a usage scenario',
        'guides.sectionTitle': 'Guides: movie picking and Movie Match',
        'guides.sectionDescription':
            'Dedicated pages for narrow intents: lobby, couples, groups, solo picking, and Google Play. All in one app.',
        'guides.sectionAria': 'Topical guides about movie picking and the app',
        'guides.readMore': 'Read ->',
        'guides.allGuides': 'All materials on one page ->',
        'guides.allGuidesAria': 'All guides on one page',
        'faq.title': 'Questions and answers',
        'faq.description': 'Lobby, invites, shared matching, and solo picking - and how all of it connects to Google Play.',
        'reviews.title': 'Reviews',
        'reviews.description': 'A quick look at how it feels in real life, not in a pitch deck.',
        'cta.title': 'Ready to remove the chaos from picking a movie?',
        'cta.description':
            'On the web you can start fast with an account; on Android you get the same Movie Match from Google Play: shared picking in a lobby or solo selection for your own evening.',
        'cta.web': 'Start in browser',
        'cta.webAria': 'Start in browser: create a Movie Match account',
        'cta.play': 'Open on Google Play',
        'cta.playAria': 'Open Movie Match on Google Play in a new tab',
        'guidesPage.breadcrumbHome': 'Home',
        'guidesPage.breadcrumbCurrent': 'Guides',
        'guidesPage.title': 'Guides: pick together or solo',
        'guidesPage.description':
            'Each page covers a separate topic with static generation. Movie Match on Google Play offers a lobby and invite flow for shared selection, plus a solo picker when you are choosing for yourself.',
        'guidesPage.backToHome': '<- Back to home: Google Play and web start',
        'guidesPage.footerHome': 'Home',
        'guidePage.breadcrumbHome': 'Home',
        'guidePage.breadcrumbGuides': 'Guides',
        'guidePage.allGuides': '<- All guides',
        'guidePage.backToStart': 'Google Play and web start',
    },
    ru: {
        'header.features': 'Возможности',
        'header.guides': 'Гайды',
        'header.download': 'Google Play',
        'header.faq': 'Вопросы',
        'header.reviews': 'Отзывы',
        'header.start': 'Начать',
        'header.startAria': 'Начать: открыть приложение в Google Play',
        'header.brandAria': 'Movie Match - перейти к началу страницы',
        'header.langAria': 'Язык',
        'hero.badge': 'Movie Match · развлечения · Google Play',
        'hero.title.before': 'Фильм для вечера -',
        'hero.title.highlight': 'без споров',
        'hero.title.after': 'с друзьями, парой или в соло',
        'hero.description':
            'Как в приложении в Google Play: лобби, приглашение и совместный выбор с друзьями или партнером - или соло-подбор, когда один человек подбирает себе кино на вечер без лобби и без второго участника.',
        'hero.webCta': 'Создать аккаунт (веб)',
        'hero.webCtaAria': 'Создать аккаунт Movie Match в браузере',
        'hero.playCta': 'Скачать в Google Play',
        'hero.playCtaAria': 'Скачать Movie Match в Google Play (откроется в новой вкладке)',
        'hero.marquee.1': 'Лобби',
        'hero.marquee.2': 'Приглашение друга',
        'hero.marquee.3': 'Соло-подбор',
        'hero.marquee.4': 'Компания друзей',
        'hero.marquee.5': 'Вдвоем с партнером',
        'hero.marquee.6': 'Драма',
        'hero.marquee.7': 'Комедия',
        'hero.marquee.8': 'Триллер',
        'hero.marquee.9': 'Совместный выбор',
        'hero.marquee.10': 'Без споров',
        'hero.marquee.11': 'Как в Google Play',
        'hero.appScenarioLabel': 'Сценарий из приложения',
        'hero.appScenarioTitle': 'Лобби -> приглашение -> совместный подбор - и отдельно соло-подбор для вечера одному.',
        'hero.playNote': 'приложение уже в каталоге Google Play (Entertainment)',
        'hero.playBullet.1': 'Лобби и приглашение друга',
        'hero.playBullet.2': 'Совместный выбор без споров',
        'hero.playBullet.3': 'Соло-подбор фильма на вечер',
        'download.badge': 'Google Play · Entertainment',
        'download.title.before': 'Скачай',
        'download.title.after': 'в Google Play',
        'download.description':
            'Официальное описание в магазине: приложение помогает выбрать фильм в компании друзей или супругов - больше никаких споров при совместном выборе. Плюс в приложении есть соло-подбор: один человек может подобрать себе кино на вечер. Лобби и приглашение - когда смотрите вместе.',
        'download.cardAria': 'Скачать Movie Match в Google Play. Откроется карточка приложения в новой вкладке.',
        'download.qrHint': 'Сканируй QR с телефона - откроется Google Play',
        'download.qrAlt': 'QR-код: открыть Movie Match в Google Play',
        'download.cardHint': 'Откроется карточка приложения в Google Play',
        'download.link': 'Открыть Movie Match в Google Play ->',
        'download.linkAria': 'Открыть Movie Match в Google Play в новой вкладке',
        'features.title': 'Совместно и в одиночку',
        'features.description':
            'В карточке приложения: лобби, приглашение и совместный выбор - и соло-подбор, когда фильм на вечер выбираете только вы.',
        'features.item.1.title': 'Лобби и приглашение',
        'features.item.1.desc':
            'Как в приложении в Google Play: создаешь комнату, приглашаешь человека и переходите к совместному выбору - без хаоса в чате. Нужен вечер один - открой соло-подбор без лобби.',
        'features.item.2.title': 'Друзья, пара или соло',
        'features.item.2.desc':
            'Компания, вдвоем с партнером или ты один: в приложении есть и совместный подбор с лобби, и соло-подбор фильма на вечер без второго участника.',
        'features.item.3.title': 'Меньше споров',
        'features.item.3.desc':
            'Вместе - к согласованному фильму без часовых дискуссий. В соло - быстрее сузить варианты и выбрать кино на свое настроение.',
        'features.item.4.title': 'Развлечения в Play',
        'features.item.4.desc':
            'Movie Match уже в каталоге Google Play (Entertainment) - скачай на телефон: лобби для компании или соло-подбор для вечера одному.',
        'scenario.title': 'Ваш сценарий',
        'scenario.description': 'Нажмите вариант - вечер с друзьями, вдвоем или соло-подбор фильма на вечер одному.',
        'scenario.legend': 'Выберите сценарий использования',
        'scenario.friends.label': 'С друзьями',
        'scenario.friends.body':
            'В компании чаще всего страдает синхронизация: кто-то в личке, кто-то в общем чате. Movie Match завязан на одном лобби и приглашении - вы заранее собираете состав, а потом идете в подбор, как в описании приложения в Google Play.',
        'scenario.friends.hint':
            'Дальше: создайте комнату в приложении и разошлите приглашение до того, как начнется "а у меня тут еще пять вариантов".',
        'scenario.couple.label': 'Вдвоем',
        'scenario.couple.body':
            'В паре больше эмоций вокруг "ты опять не угадал". Совместный подбор в Movie Match симметричен: не один тянет выбор, а оба участвуют в одном потоке - меньше ощущения, что ответственность лежит на одном человеке.',
        'scenario.couple.hint':
            'Если удобнее начать с телефона - карточка Movie Match в Google Play; если с браузера - кнопка создания аккаунта на этом сайте.',
        'scenario.solo.label': 'В соло',
        'scenario.solo.body':
            'Не всегда есть с кем согласовывать вечер: в приложении есть соло-подбор - один человек проходит подбор и выбирает себе фильм без лобби и без приглашения второго участника.',
        'scenario.solo.hint':
            'Откройте Movie Match в Google Play и выберите сценарий для вечера в одиночку; при желании позже всегда можно перейти к лобби для совместного просмотра.',
        'guides.sectionTitle': 'Гайды: выбор фильма и Movie Match',
        'guides.sectionDescription':
            'Отдельные страницы под узкие запросы - лобби, пара, компания, соло-подбор, Google Play. Все в одном приложении.',
        'guides.sectionAria': 'Тематические гайды по выбору фильма и приложению',
        'guides.readMore': 'Читать ->',
        'guides.allGuides': 'Все материалы на одной странице ->',
        'guides.allGuidesAria': 'Все гайды на одной странице',
        'faq.title': 'Вопросы и ответы',
        'faq.description': 'Лобби, приглашение, совместный и соло-подбор - и как это связано с Google Play.',
        'faq.item.1.question': 'Чем Movie Match отличается от списка в чате или голосования в мессенджере?',
        'faq.item.1.answer':
            'Фокус на одном потоке: лобби, приглашение и совместный подбор внутри приложения, как в карточке Google Play. Параллельно в приложении доступен и соло-подбор - один человек может подобрать себе фильм на вечер без лобби. Меньше хаоса из десятков сообщений - вы движетесь к согласованному варианту, когда смотрите вместе.',
        'faq.item.2.question': 'Нужен ли всем участникам аккаунт в вебе?',
        'faq.item.2.answer':
            'В вебе вы можете начать с создания аккаунта на лендинге и перейти к сценарию из приложения. Для полного цикла в Android используйте Movie Match из Google Play - там тот же смысл: комната, приглашение и выбор вместе.',
        'faq.item.3.question': 'Это только для пар или и для компании друзей?',
        'faq.item.3.answer':
            'Совместно - да: вечер вдвоем и посиделки с друзьями, с лобби и приглашением. Отдельно в приложении есть соло-подбор: один человек может выбрать себе фильм на вечер без второго участника.',
        'faq.item.4.question': 'Можно ли пользоваться Movie Match одному, без компании?',
        'faq.item.4.answer':
            'Да. В приложении есть соло-подбор: вы подбираете себе фильм на вечер в одиночку, без лобби и без приглашения кого-то еще. Если позже захотите посмотреть вместе - тот же Movie Match предлагает знакомый сценарий с комнатой и совместным выбором.',
        'faq.item.5.question': 'Где скачать приложение и как устроена категория в Google Play?',
        'faq.item.5.answer':
            'Movie Match доступен в Google Play в категории развлечений (Entertainment). Ссылку на карточку приложения можно задать переменной окружения NEXT_PUBLIC_GOOGLE_PLAY_URL на деплое.',
        'faq.item.6.question': 'Платный ли Movie Match?',
        'faq.item.6.answer':
            'На лендинге мы не продаем подписку: описание и сценарий соответствуют бесплатной установке из магазина с типичной моделью магазина приложений. Актуальные условия - в карточке Google Play.',
        'faq.item.7.question': 'Работает ли выбор фильма, если у всех разные вкусы?',
        'faq.item.7.answer':
            'Именно для этого и заточен совместный подбор: вы не обязаны заранее сходиться во мнении - цель дойти до варианта, который устраивает участников лобби, без бесконечного круга обсуждений.',
        'reviews.title': 'Отзывы',
        'reviews.description': 'Коротко - как это ощущается в жизни, а не в презентации.',
        'reviews.item.1.quote': 'Раньше убивали вечер на "ну выбери ты". Теперь лобби, приглашение - и мы уже в подборе.',
        'reviews.item.1.name': 'Алина',
        'reviews.item.1.role': 'вечера с друзьями',
        'reviews.item.2.quote': 'Как в описании приложения: без споров при выборе фильма. Вдвоем наконец смотрим, а не обсуждаем.',
        'reviews.item.2.name': 'Макс и Катя',
        'reviews.item.2.role': 'пара, Google Play',
        'reviews.item.3.quote': 'Скачали из Play, создали комнату за минуту. Для компании идеально.',
        'reviews.item.3.name': 'Илья',
        'reviews.item.3.role': 'развлечения на выходных',
        'cta.title': 'Готов убрать хаос из выбора фильма?',
        'cta.description':
            'В вебе - быстрый старт с аккаунтом; в Android - то же Movie Match из Google Play: совместный выбор в лобби или соло-подбор фильма на вечер одному.',
        'cta.web': 'Начать в браузере',
        'cta.webAria': 'Начать в браузере: создать аккаунт Movie Match',
        'cta.play': 'Открыть в Google Play',
        'cta.playAria': 'Открыть Movie Match в Google Play в новой вкладке',
        'guidesPage.breadcrumbHome': 'Главная',
        'guidesPage.breadcrumbCurrent': 'Гайды',
        'guidesPage.title': 'Гайды: выбрать вместе или в соло',
        'guidesPage.description':
            'Каждая страница - отдельная тема со статической генерацией (SSG). Movie Match в Google Play: сценарий лобби и приглашения для выбора вместе, плюс соло-подбор, когда фильм выбираете только для себя.',
        'guidesPage.backToHome': '<- Назад на главную: Google Play и веб-старт',
        'guidesPage.footerHome': 'Главная',
        'guidePage.breadcrumbHome': 'Главная',
        'guidePage.breadcrumbGuides': 'Гайды',
        'guidePage.allGuides': '<- Все гайды',
        'guidePage.backToStart': 'Google Play и веб-старт',
    },
    es: {
        'header.features': 'Funciones',
        'header.guides': 'Guias',
        'header.download': 'Google Play',
        'header.faq': 'Preguntas',
        'header.reviews': 'Resenas',
        'header.start': 'Empezar',
        'header.startAria': 'Empezar: abrir la app en Google Play',
        'header.brandAria': 'Movie Match - ir al inicio',
        'header.langAria': 'Idioma',
        'hero.badge': 'Movie Match · entretenimiento · Google Play',
        'hero.title.before': 'Peliculas para la noche -',
        'hero.title.highlight': 'sin discusiones',
        'hero.title.after': 'con amigos, en pareja o en solitario',
        'hero.description':
            'Como en la ficha de Google Play: sala, invitacion y eleccion conjunta con amigos o pareja - o un selector en solitario cuando quieres elegir una pelicula para ti sin sala ni segundo participante.',
        'hero.webCta': 'Crear cuenta (web)',
        'hero.webCtaAria': 'Crear una cuenta de Movie Match en el navegador',
        'hero.playCta': 'Descargar en Google Play',
        'hero.playCtaAria': 'Descargar Movie Match en Google Play (se abre en una nueva pestana)',
        'features.title': 'Juntos o en solitario',
        'features.description':
            'La app incluye sala, invitaciones y eleccion compartida - ademas de un flujo en solitario cuando eliges la pelicula solo para ti.',
        'scenario.title': 'Tu escenario',
        'scenario.description': 'Elige una opcion: con amigos, en pareja o seleccion en solitario para esta noche.',
        'scenario.legend': 'Elige un escenario de uso',
        'guides.sectionTitle': 'Guias: elegir pelicula y Movie Match',
        'guides.sectionDescription':
            'Paginas separadas para intenciones concretas: sala, pareja, grupo, modo en solitario y Google Play. Todo en una sola app.',
        'guides.sectionAria': 'Guias tematicas sobre elegir pelicula y la app',
        'guides.readMore': 'Leer ->',
        'guides.allGuides': 'Todos los materiales en una pagina ->',
        'guides.allGuidesAria': 'Todas las guias en una pagina',
        'faq.title': 'Preguntas y respuestas',
        'faq.description': 'Sala, invitaciones, seleccion conjunta y modo en solitario - y como se relaciona con Google Play.',
        'reviews.title': 'Resenas',
        'reviews.description': 'Breve y real: como se siente en la vida diaria, no en una presentacion.',
        'cta.title': 'Listo para quitar el caos de elegir una pelicula?',
        'cta.description':
            'En la web puedes empezar rapido con una cuenta; en Android tienes el mismo Movie Match desde Google Play: eleccion compartida en una sala o seleccion en solitario para tu propia noche.',
        'cta.web': 'Empezar en navegador',
        'cta.webAria': 'Empezar en navegador: crear una cuenta de Movie Match',
        'cta.play': 'Abrir en Google Play',
        'cta.playAria': 'Abrir Movie Match en Google Play en una nueva pestana',
        'guidesPage.breadcrumbHome': 'Inicio',
        'guidesPage.breadcrumbCurrent': 'Guias',
        'guidesPage.title': 'Guias: elegir juntos o en solitario',
        'guidesPage.description':
            'Cada pagina cubre un tema especifico con generacion estatica. Movie Match en Google Play ofrece sala e invitaciones para elegir juntos, ademas de un selector en solitario.',
        'guidesPage.backToHome': '<- Volver al inicio: Google Play y comienzo web',
        'guidesPage.footerHome': 'Inicio',
        'guidePage.breadcrumbHome': 'Inicio',
        'guidePage.breadcrumbGuides': 'Guias',
        'guidePage.allGuides': '<- Todas las guias',
        'guidePage.backToStart': 'Google Play y comienzo web',
    },
    de: {
        'header.features': 'Funktionen',
        'header.guides': 'Guides',
        'header.download': 'Google Play',
        'header.faq': 'FAQ',
        'header.reviews': 'Bewertungen',
        'header.start': 'Starten',
        'header.startAria': 'Starten: App in Google Play offnen',
        'header.brandAria': 'Movie Match - zum Seitenanfang',
        'header.langAria': 'Sprache',
    },
    ja: {
        'header.features': 'Features',
        'header.guides': 'Guides',
        'header.download': 'Google Play',
        'header.faq': 'FAQ',
        'header.reviews': 'Reviews',
        'header.start': 'Start',
        'header.startAria': 'Start: Google Play de apuri o hiraku',
        'header.brandAria': 'Movie Match - top e idou',
        'header.langAria': 'Language',
    },
};

export type LandingDictionaryResponse = Readonly<{
    locale: LandingLocale;
    fallbackLocale: LandingLocale;
    namespace: string;
    switcherLocales: LandingLocale[];
    messages: Record<string, string>;
}>;

function isSupportedLocale(locale: string | undefined): locale is LandingLocale {
    if (!locale) return false;
    return SUPPORTED_LOCALES.includes(locale as LandingLocale);
}

@Injectable()
export class I18nService {
    constructor(
        @InjectRepository(I18nMessage)
        private readonly repo: Repository<I18nMessage>,
    ) {}

    async ensureDefaults(): Promise<void> {
        const entities: Omit<I18nMessage, 'id' | 'createdAt' | 'updatedAt'>[] = [];

        for (const locale of SUPPORTED_LOCALES) {
            const localeMessages = DEFAULT_MESSAGES[locale];
            for (const [key, value] of Object.entries(localeMessages)) {
                entities.push({
                    locale,
                    namespace: DEFAULT_NAMESPACE,
                    key,
                    value,
                });
            }
        }

        if (entities.length === 0) return;
        await this.repo.upsert(entities, ['locale', 'namespace', 'key']);
    }

    async getLandingDictionary(requestedLocale?: string): Promise<LandingDictionaryResponse> {
        await this.ensureDefaults();

        const locale: LandingLocale = isSupportedLocale(requestedLocale) ? requestedLocale : FALLBACK_LOCALE;

        const rows = await this.repo.find({
            where: [
                { namespace: DEFAULT_NAMESPACE, locale: FALLBACK_LOCALE },
                { namespace: DEFAULT_NAMESPACE, locale },
            ],
            select: { locale: true, key: true, value: true },
        });

        const messages: Record<string, string> = {};
        for (const row of rows) {
            if (row.locale === FALLBACK_LOCALE && messages[row.key] === undefined) {
                messages[row.key] = row.value;
                continue;
            }
            if (row.locale === locale) {
                messages[row.key] = row.value;
            }
        }

        const switcherLocales = locale === FALLBACK_LOCALE ? [FALLBACK_LOCALE] : [FALLBACK_LOCALE, locale];

        return {
            locale,
            fallbackLocale: FALLBACK_LOCALE,
            namespace: DEFAULT_NAMESPACE,
            switcherLocales,
            messages,
        };
    }
}
