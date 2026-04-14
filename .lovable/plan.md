

## План: Telegram-бот для уведомлений о заказах

### Подход

Создать edge function `notify-telegram`, которая отправляет сообщение в Telegram-чат при новом заказе. Вызывать её из двух мест: `CheckoutPage.tsx` (заказы с сайта) и `chat-bot/index.ts` (заказы через чат-бот).

### 1. Подключить Telegram-коннектор

Использовать `standard_connectors--connect` с `connector_id: telegram` для получения `TELEGRAM_API_KEY` и `LOVABLE_API_KEY`.

Перед подключением нужно создать бота через [@BotFather](https://t.me/BotFather) в Telegram и получить токен. Также нужно узнать `chat_id` администратора (можно через бота [@userinfobot](https://t.me/userinfobot) или группу).

### 2. Edge Function `notify-telegram`

Файл: `supabase/functions/notify-telegram/index.ts`

- Принимает `{ order_id, customer_name, phone, total, items, delivery_method, comment }`.
- Формирует красивое сообщение с эмодзи и деталями заказа.
- Отправляет через connector gateway (`https://connector-gateway.lovable.dev/telegram/sendMessage`).
- `chat_id` хранится как секрет `TELEGRAM_CHAT_ID`.

### 3. Вызов из CheckoutPage

После успешного создания заказа и order_items — вызвать `supabase.functions.invoke("notify-telegram", { body: {...} })`. Fire-and-forget (не блокирует пользователя).

### 4. Вызов из chat-bot

В `place_order` хендлере — аналогичный вызов notify-telegram после создания заказа.

### Файлы

| Действие | Файл |
|----------|------|
| Создать | `supabase/functions/notify-telegram/index.ts` |
| Изменить | `src/pages/CheckoutPage.tsx` — вызов notify-telegram |
| Изменить | `supabase/functions/chat-bot/index.ts` — вызов notify-telegram |
| Секрет | `TELEGRAM_CHAT_ID` — ID чата/группы для уведомлений |

