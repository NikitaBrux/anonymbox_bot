# AnonymBox

Анонимные вопросы с живым голосованием — Telegram Mini App для спикеров и ведущих мероприятий.

## Возможности

- Аудитория задаёт анонимные вопросы (имя автора не сохраняется)
- Голосование за вопросы — один голос на вопрос, защита на стороне сервера
- Спикер видит живой лидерборд с обновлением в реальном времени через WebSocket
- Сессия автоматически закрывается по времени; организатор может открыть заново вручную
- Экран «Поделиться» с QR-кодом и deep link
- Три языка интерфейса: English, Русский, 中文
- Готово к деплою на Railway

## Структура проекта

```
anonymbox/
├── bot/          # Telegraf-бот (точка входа в Telegram)
├── backend/      # Fastify REST API + WebSocket
├── frontend/     # React + Telegram Mini App
└── docker-compose.yml
```

## Локальный запуск

### Требования

- Docker + Docker Compose
- Node 20+
- Токен Telegram-бота от [@BotFather](https://t.me/BotFather)

### 1. Настройка переменных окружения

```bash
cp .env.example .env
# Открой .env и пропиши BOT_TOKEN
```

### 2. Запуск через Docker Compose

```bash
docker-compose up --build
```

Сервисы после запуска:

| Сервис    | Адрес                 |
|-----------|-----------------------|
| Фронтенд  | http://localhost:5173 |
| Бэкенд    | http://localhost:3001 |
| PostgreSQL | localhost:5432       |
| Redis     | localhost:6379        |

### 3. Локальная разработка без Docker

Сначала подними Postgres и Redis:

```bash
docker-compose up -d postgres redis
```

Затем в трёх терминалах:

```bash
# Бэкенд
cd backend && npm install && npm run dev

# Бот
cd bot && npm install && npm run dev

# Фронтенд
cd frontend && npm install && npm run dev
```

## Переменные окружения

| Переменная     | Описание                                              |
|----------------|-------------------------------------------------------|
| `BOT_TOKEN`    | Токен Telegram-бота от BotFather                     |
| `DATABASE_URL` | Строка подключения к PostgreSQL                      |
| `REDIS_URL`    | Строка подключения к Redis                           |
| `FRONTEND_URL` | Публичный URL фронтенда (для deep link в боте)       |
| `BACKEND_URL`  | Публичный URL бэкенда                                |
| `JWT_SECRET`   | Секрет для соления анонимных отпечатков              |

Фронтенд дополнительно читает:

| Переменная            | Описание                                    |
|-----------------------|---------------------------------------------|
| `VITE_BACKEND_URL`    | URL бэкенда (по умолчанию `/api`)           |
| `VITE_BOT_USERNAME`   | Username бота для генерации deep link       |

## Деплой на Railway

Каждая папка (`backend/`, `bot/`, `frontend/`) — отдельный Railway-сервис со своим `railway.toml` и `Dockerfile`.

1. Создай проект на Railway
2. Добавь сервисы из папок репозитория
3. Подключи плагины Postgres и Redis
4. Пропиши переменные окружения в каждом сервисе
5. После первого деплоя обнови `FRONTEND_URL` и `BACKEND_URL`

## API

| Метод  | Путь | Описание |
|--------|------|----------|
| POST   | `/sessions` | Создать сессию |
| GET    | `/sessions?telegramUserId=` | Список сессий пользователя |
| GET    | `/sessions/:id` | Получить сессию |
| PATCH  | `/sessions/:id/toggle` | Открыть / закрыть сессию |
| POST   | `/sessions/:id/questions` | Отправить вопрос |
| GET    | `/sessions/:id/questions` | Список вопросов |
| POST   | `/sessions/:id/questions/:qid/vote` | Проголосовать / снять голос |
| PATCH  | `/sessions/:id/questions/:qid/answered` | Отметить отвеченным |
| PATCH  | `/sessions/:id/questions/:qid/hide` | Скрыть вопрос |
| WS     | `/ws/:sessionId` | Обновления в реальном времени |

## Модель анонимности

- Вопросы не содержат имени автора
- Голоса отслеживаются по `sha256(telegramUserId + sessionId + JWT_SECRET)` — односторонний хеш
- Даже сервер не может связать голос с конкретным пользователем
