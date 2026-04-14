

## План: ИИ-чат-бот + админка чатов

Большая фича из нескольких частей: база данных для чатов, edge function для ИИ, виджет на сайте, страница чатов в админке.

---

### 1. База данных — 2 новые таблицы

**`chat_sessions`** — сессии чата:
- `id` uuid PK
- `customer_name` text NOT NULL
- `phone` text NOT NULL
- `status` text DEFAULT 'active' (active / needs_operator / closed)
- `created_at` timestamptz DEFAULT now()
- `updated_at` timestamptz DEFAULT now()

**`chat_messages`** — сообщения:
- `id` uuid PK
- `session_id` uuid FK → chat_sessions
- `role` text NOT NULL (user / assistant / operator)
- `content` text NOT NULL
- `created_at` timestamptz DEFAULT now()

RLS: публичный INSERT/SELECT на обе таблицы (пользователи без авторизации); authenticated — полный доступ. Realtime включён для обеих таблиц.

---

### 2. Edge Function `chat-bot`

- Получает `{ session_id, message }`.
- Загружает каталог товаров из БД (названия, цены, характеристики, наличие).
- Загружает историю сообщений сессии.
- Вызывает Lovable AI (`google/gemini-3-flash-preview`) с системным промптом:
  - «Ты консультант магазина "Уютный Дом". Помогаешь выбрать товары, считаешь итог. Когда клиент готов — вызови функцию `place_order`. Если не можешь помочь — вызови `request_operator`.»
- Tool calling: `place_order(items, delivery_method, ...)` и `request_operator(reason)`.
- При `place_order` — создаёт запись в `orders` + `order_items`, обновляет статус сессии.
- При `request_operator` — обновляет `chat_sessions.status = 'needs_operator'`.
- Сохраняет сообщения в `chat_messages`.

---

### 3. Виджет чата на сайте

Новый компонент `src/components/ChatWidget.tsx`:
- Плавающая кнопка в правом нижнем углу (иконка `MessageCircle`).
- По клику — всплывающее окно чата.
- Первый экран: форма «Имя + Телефон + согласие с политикой конфиденциальности».
- После отправки — создаётся `chat_session`, открывается чат.
- Сообщения отправляются через edge function, ответ ИИ стримится.
- Realtime-подписка на `chat_messages` для получения сообщений оператора.
- Сессия сохраняется в `localStorage` для возобновления.
- Добавляется в `App.tsx` глобально (вне Routes, только на публичных страницах).

---

### 4. Админка — страница «Чаты» `/admin/chats`

Новый файл `src/pages/admin/Chats.tsx`:
- Список всех `chat_sessions` с фильтрацией по статусу (active / needs_operator / closed).
- Сессии с `needs_operator` выделены визуально (бейдж, цвет).
- При клике — диалог с полной историей сообщений.
- Возможность оператору написать ответ (сохраняется как `role: 'operator'`).
- Возможность закрыть сессию.
- Realtime-обновление списка и сообщений.

Навигация: добавить ссылку «Чаты» с иконкой `MessageSquare` в `AdminLayout.tsx`. Роут в `App.tsx`.

---

### Файлы

| Действие | Файл |
|----------|------|
| Миграция | Таблицы `chat_sessions`, `chat_messages` + RLS + realtime |
| Создать | `supabase/functions/chat-bot/index.ts` |
| Создать | `src/components/ChatWidget.tsx` |
| Создать | `src/pages/admin/Chats.tsx` |
| Изменить | `src/App.tsx` — добавить ChatWidget + роут /admin/chats |
| Изменить | `src/components/AdminLayout.tsx` — ссылка «Чаты» |

