
CREATE POLICY "Authenticated users can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete order items"
ON public.order_items
FOR DELETE
TO authenticated
USING (true);
