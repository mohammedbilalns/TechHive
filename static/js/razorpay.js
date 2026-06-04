function openRazorpayCheckout({
  key,
  amount,
  currency = "INR",
  name,
  description,
  orderId,
  prefill = {},
  themeColor = "#DA0037",
  onSuccess,
  onDismiss,
}) {
  const razorpay = new Razorpay({
    key,
    amount,
    currency,
    name,
    description,
    order_id: orderId,
    handler: onSuccess,
    modal: onDismiss ? { ondismiss: onDismiss } : undefined,
    prefill,
    theme: { color: themeColor },
  });

  razorpay.open();
  return razorpay;
}

export { openRazorpayCheckout };
