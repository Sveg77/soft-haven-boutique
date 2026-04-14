

## План: Supabase + защищённая админка

### 1. Создание таблиц в Supabase (миграции)

**Таблица `categories`:**
- `id` (uuid, PK), `name` (text), `slug` (text, unique), `image_url` (text), `sort_order` (int), `created_at`

**Таблица `products`:**
- `id` (uuid, PK), `name` (text), `description` (text), `price` (numeric), `category_id` (FK → categories), `image_url` (text), `images` (text[]), `characteristics` (jsonb — состав, размер, цвет), `in_stock` (boolean), `created_at`

**Таблица `orders`:**
- `id` (uuid, PK), `customer_name` (text), `phone` (text), `email` (text), `address` (text), `delivery_method` (text), `comment` (text), `status` (text — новая/в работе/выполнена), `total` (numeric), `created_at`

**Таблица `order_items`:**
- `id` (uuid, PK), `order_id` (FK → orders), `product_id` (FK → products), `quantity` (int), `price` (numeric)

**RLS-политики:**
- `categories`, `products` — SELECT для всех (anon), INSERT/UPDATE/DELETE только для authenticated
- `orders`, `order_items` — INSERT для всех (anon может оформить заявку), SELECT/UPDATE только для authenticated (админ)

### 2. Админ-авторизация

Создать пользователя-админа через Supabase Auth. Страница `/admin/login` — вход по email + пароль через `supabase.auth.signInWithPassword()`. Все `/admin/*` маршруты защищены проверкой авторизации — если не залогинен, редирект на логин.

Без регистрации новых пользователей — только вход. Администратор создаётся вручную через Supabase dashboard или через начальный seed.

### 3. Админ-панель (страницы)

- `/admin/login` — форма входа
- `/admin/orders` — список заявок, фильтр по статусу, просмотр деталей, смена статуса
- `/admin/products` — список товаров, кнопки добавить/редактировать/удалить
- `/admin/products/new` и `/admin/products/:id/edit` — форма товара (название, описание, цена, категория, URL фото, характеристики, наличие)
- `/admin/categories` — управление категориями

Простой layout с боковой навигацией: Заявки / Товары / Категории / Выйти.

### 4. Интеграция фронтенда с Supabase

- Supabase client (`src/integrations/supabase/client.ts`)
- React Query хуки для товаров, категорий, заявок
- Корзина — localStorage, при оформлении заявки данные пишутся в `orders` + `order_items` через Supabase
- Каталог и карточки товаров загружают данные из БД

### 5. Порядок реализации

1. Подключить Lovable Cloud Supabase, создать миграции для таблиц
2. Настроить RLS-политики
3. Создать Supabase client и типы
4. Реализовать админ-логин и защищённые маршруты
5. Реализовать страницы админки (заявки, товары, категории)
6. Подключить публичный фронтенд к БД (каталог, карточка товара, оформление заявки)

