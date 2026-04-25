import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { session_id, message } = await req.json();
    if (!session_id || !message) {
      return new Response(JSON.stringify({ error: "session_id and message required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Save user message
    await supabase.from("chat_messages").insert({ session_id, role: "user", content: message });

    // Load products catalog
    const { data: products } = await supabase
      .from("products")
      .select("id, name, price, description, characteristics, in_stock, category_id, categories(name), image_url, images")
      .eq("in_stock", true)
      .limit(200);

    const storageBase = `${supabaseUrl}/storage/v1/object/public/product-images/`;

    const normalizeUrl = (img: string): string =>
      img.startsWith("http") ? img : `${storageBase}${img}`;

    const getImagesList = (p: any): string[] => {
      if (Array.isArray(p.images) && p.images.length > 0) {
        return p.images.map(normalizeUrl);
      }
      if (p.image_url) return [normalizeUrl(p.image_url)];
      return [];
    };

    const catalogText = (products || []).map((p: any) => {
      const imgs = getImagesList(p);
      const colors: string[] = Array.isArray(p.characteristics?.["Цвет"]) ? p.characteristics["Цвет"] : [];
      let imgPart = "";
      if (colors.length && imgs.length) {
        const pairs = colors.map((c, i) => `${c}: ${imgs[i] || imgs[0]}`).join("; ");
        imgPart = ` | Фото по цветам: ${pairs}`;
      } else if (imgs.length) {
        imgPart = ` | Фото: ${imgs[0]}`;
      }
      return `- ${p.name} | ${p.price}₽ | ${p.description || ""} | ${JSON.stringify(p.characteristics || {})} | Категория: ${p.categories?.name || "—"}${imgPart}`;
    }).join("\n");

    // Load conversation history
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true })
      .limit(50);

    const messages = (history || []).map((m: any) => ({
      role: m.role === "operator" ? "user" : m.role,
      content: m.role === "operator" ? `[Оператор]: ${m.content}` : m.content,
    }));

    const systemPrompt = `Ты — консультант интернет-магазина "Уютный Дом". Помогаешь покупателям выбрать товары для дома, собрать наборы, считаешь итоговую сумму.

Каталог товаров:
${catalogText}

Правила:
1. Отвечай на русском языке, дружелюбно и кратко.
2. Рекомендуй товары из каталога. Называй точные цены.
3. Когда рекомендуешь товар — ОБЯЗАТЕЛЬНО вставляй фото товара в формате markdown: ![название](ссылка). Если у товара указано "Фото по цветам" — ВЫБИРАЙ ссылку, соответствующую цвету, о котором спросил покупатель. Если цвет не указан — бери первое фото.
4. Когда покупатель согласен с заказом — вызови функцию place_order с массивом товаров.
5. Если не можешь помочь или покупатель просит живого оператора — вызови request_operator.
6. Не выдумывай товары, которых нет в каталоге.
7. СКИДКА: при сумме заказа от 25 000 ₽ автоматически действует скидка 5%. Когда подсчитываешь стоимость заказа — всегда показывай покупателю: сумму товаров, размер скидки (если применима) и итоговую стоимость к оплате. Если до скидки не хватает — подскажи, сколько ещё нужно добрать до 25 000 ₽, чтобы получить 5%.
8. ДОСТАВКА. Условия:
   • По России — транспортными компаниями (СДЭК, Почта России и др.) по тарифам перевозчика. Сроки и стоимость рассчитываются индивидуально при оформлении.
   • Собственным транспортом в радиусе 50 км: бесплатно при заказе от 25 000 ₽, иначе 30 ₽ за км.
   • Самовывоз — бесплатно, адрес и время согласуются при подтверждении заказа.
   Оплата — при получении.
9. ПЕРЕД ОФОРМЛЕНИЕМ заказа ОБЯЗАТЕЛЬНО уточни у покупателя:
   - способ получения (самовывоз / доставка собственным транспортом / транспортная компания);
   - если выбрана доставка собственным транспортом — желаемую дату (в формате ГГГГ-ММ-ДД, не раньше завтрашнего дня) и время (в формате ЧЧ:ММ, с 10:00 до 20:00);
   - адрес доставки (если применимо).
   Эти данные передавай в place_order: delivery_method, delivery_date, delivery_time, address, comment.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "place_order",
          description: "Оформить заказ покупателю",
          parameters: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    product_id: { type: "string" },
                    product_name: { type: "string" },
                    price: { type: "number" },
                    quantity: { type: "number" },
                  },
                  required: ["product_id", "product_name", "price", "quantity"],
                },
              },
              delivery_method: { type: "string", enum: ["pickup", "delivery"] },
              delivery_date: { type: "string", description: "Дата доставки в формате YYYY-MM-DD (только для собственной доставки)" },
              delivery_time: { type: "string", description: "Время доставки в формате HH:MM (только для собственной доставки)" },
              address: { type: "string", description: "Адрес доставки (для собственной доставки или транспортной компании)" },
              comment: { type: "string" },
            },
            required: ["items"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "request_operator",
          description: "Позвать живого оператора для помощи клиенту",
          parameters: {
            type: "object",
            properties: {
              reason: { type: "string" },
            },
            required: ["reason"],
          },
        },
      },
    ];

    // Call AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        tools,
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов, попробуйте позже" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Необходимо пополнить баланс AI" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", status, errText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const choice = aiData.choices?.[0]?.message;

    // Handle tool calls
    if (choice?.tool_calls?.length) {
      for (const tc of choice.tool_calls) {
        const fn = tc.function.name;
        const args = JSON.parse(tc.function.arguments);

        if (fn === "place_order") {
          // Get session info for customer data
          const { data: session } = await supabase
            .from("chat_sessions")
            .select("customer_name, phone")
            .eq("id", session_id)
            .single();

          const subtotal = args.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
          const hasDiscount = subtotal >= 25000;
          const discount = hasDiscount ? Math.round(subtotal * 0.05) : 0;
          const total = subtotal - discount;

          const { data: order } = await supabase.from("orders").insert({
            customer_name: session?.customer_name || "Чат-клиент",
            phone: session?.phone || "",
            delivery_method: args.delivery_method || "pickup",
            address: args.address || null,
            delivery_date: args.delivery_date || null,
            delivery_time: args.delivery_time || null,
            comment: args.comment || "Заказ через чат-бота",
            total,
            status: "new",
          }).select("id").single();

          if (order) {
            const orderItems = args.items.map((i: any) => ({
              order_id: order.id,
              product_id: i.product_id,
              product_name: i.product_name,
              price: i.price,
              quantity: i.quantity,
              line_total: i.price * i.quantity,
            }));
            await supabase.from("order_items").insert(orderItems);

            // Telegram notification (fire-and-forget)
            fetch(`${supabaseUrl}/functions/v1/notify-telegram`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${serviceKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                order_id: order.id,
                customer_name: session?.customer_name || "Чат-клиент",
                phone: session?.phone || "",
                total,
                items: args.items,
                delivery_method: args.delivery_method || "pickup",
                address: args.address || "",
                delivery_date: args.delivery_date || "",
                delivery_time: args.delivery_time || "",
                comment: args.comment || "Заказ через чат-бота",
              }),
            }).catch((err) => console.error("Telegram notify error:", err));
          }

          const deliveryLine = (() => {
            if (args.delivery_method === "delivery") {
              const parts = ["Доставка собственным транспортом"];
              if (args.address) parts.push(`Адрес: ${args.address}`);
              if (args.delivery_date) parts.push(`Дата: ${args.delivery_date}`);
              if (args.delivery_time) parts.push(`Время: ${args.delivery_time}`);
              return `\n${parts.join("\n")}`;
            }
            if (args.delivery_method === "pickup") return `\nСамовывоз (адрес и время согласуем по телефону)`;
            return "";
          })();
          const discountLine = hasDiscount
            ? `\nСумма товаров: ${subtotal.toLocaleString("ru-RU")} ₽\nСкидка 5%: −${discount.toLocaleString("ru-RU")} ₽\nИтого к оплате: ${total.toLocaleString("ru-RU")} ₽`
            : `\nИтого к оплате: ${total.toLocaleString("ru-RU")} ₽`;
          const confirmMsg = `✅ Заказ оформлен! Номер: ${order?.id?.slice(0, 8)}.${deliveryLine}${discountLine}\n\nМы свяжемся с вами для подтверждения.`;
          await supabase.from("chat_messages").insert({ session_id, role: "assistant", content: confirmMsg });

          return new Response(JSON.stringify({ reply: confirmMsg }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (fn === "request_operator") {
          await supabase.from("chat_sessions").update({ status: "needs_operator" }).eq("id", session_id);
          const opMsg = `🔔 Я передал ваш запрос оператору. Причина: ${args.reason}. Оператор скоро подключится к чату.`;
          await supabase.from("chat_messages").insert({ session_id, role: "assistant", content: opMsg });

          return new Response(JSON.stringify({ reply: opMsg }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Regular text response
    const reply = choice?.content || "Извините, не удалось сгенерировать ответ.";
    await supabase.from("chat_messages").insert({ session_id, role: "assistant", content: reply });

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat-bot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
