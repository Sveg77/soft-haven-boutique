

## План: Supabase + защищённая админка для «Уютный Дом»

### Шаг 1. Подключить Supabase (Lovable Cloud)
Включить управляемую базу данных Supabase через Lovable Cloud (выбор региона).

### Шаг 2. Создать миграции для таблиц

**categories** — id, name, slug, image_url, sort_order, created_at
**products** — id, name, description, price, category_id (FK), image_url, images[], characteristics (jsonb), in_stock, created_at
**orders** — id, customer_name, phone, email, address, delivery_method, comment, status, total, created_at
**order_items** — id, order_id (FK), product_id (FK), quantity, price

RLS-политики:
- categories, products: SELECT для anon+authenticated; INSERT/UPDATE/DELETE только authenticated
- orders, order_items: INSERT для anon (оформление заявки); SELECT/UPDATE только authenticated (админ)

### Шаг 3. Supabase client + типы
Создать `src/integrations/supabase/client.ts` и типы таблиц.

### Шаг 4. Админ-авторизация
- `/admin/login` — форма входа по email+пароль через `supabase.auth.signInWithPassword()`
- Компонент `AdminRoute` — проверка сессии, редирект на логин если не авторизован
- Профили пользователей не нужны — используется только встроенный `auth.users`

### Шаг 5. Админ-панель
- Layout с боковой навигацией (Заявки / Товары / Категории / Выйти)
- `/admin/orders` — таблица заявок, фильтр по статусу, смена статуса
- `/admin/products` — список, добавление, редактирование, удаление товаров
- `/admin/categories` — CRUD категорий

### Шаг 6. Публичный фронтенд (подключение к БД)
- Каталог и карточки товаров загружают данные из Supabase
- Корзина в localStorage
- Оформление заявки пишет в orders + order_items
- Главная, каталог, карточка товара, корзина, чекаут, информационные страницы

### Шаг 7. Seed-данные
Добавить несколько тестовых категорий и товаров для демонстрации.

---

### Технические детали
- React Query хуки для всех CRUD-операций
- Warm/romantic дизайн: кремовый фон (#FDF6F0), пыльная роза (#D4A0A0), бежевый (#C9B99A)
- Адаптивная верстка
- Админ создаётся вручную через Supabase Auth dashboard после подключения

