# فعال‌سازی کُد شش‌رقمی ایمیل در Supabase

رابط افغان‌چت از `signInWithOtp({ email })` و `verifyOtp({ email, token, type: "email" })` استفاده می‌کند.

## ۱. قالب ایمیل

در Supabase Dashboard پروژهٔ Afghan Chat برو به:

Authentication → Email Templates → Magic Link

Subject:
`کُد ورود افغان چت: {{ .Token }}`

Body را با این قالب جایگزین کن:

```html
<div style="font-family:Arial,sans-serif;max-width:480px;margin:24px auto;padding:28px;border:1px solid #e5eee7;border-radius:18px;color:#183426">
  <div style="font-size:22px;font-weight:700;color:#176238">افغان چت | Afghan Chat</div>
  <h2 style="font-size:20px">کُد تأیید ورود</h2>
  <p>برای ورود به حساب افغان چت، کُد زیر را در برنامه وارد کن:</p>
  <div style="font-size:32px;letter-spacing:8px;font-weight:700;background:#f0f7f1;padding:18px;text-align:center;border-radius:12px;color:#176238">{{ .Token }}</div>
  <p style="font-size:13px;color:#66776c">این کُد یک‌بارمصرف است. آن را با هیچ‌کس شریک نساز. اگر خودت درخواست ورود نداده‌ای، این پیام را نادیده بگیر.</p>
</div>
```

مهم: در قالب باید `{{ .Token }}` باشد، نه `{{ .ConfirmationURL }}`؛ در غیر این صورت لینک ورود فرستاده می‌شود، نه کُد قابل واردکردن.

## ۲. ارسال ایمیل واقعی

SMTP پیش‌فرض Supabase فقط برای آزمایش محدود است و برای کاربران عمومی مناسب نیست. برای انتشار افغان‌چت باید SMTP سفارشی تنظیم شود.

در حال حاضر در حساب Resend هیچ دامنهٔ فرستندهٔ تأییدشده و هیچ API key پیدا نشد. برای استفاده از Resend، ابتدا باید یک دامنهٔ اینترنتی متعلق به خودت را در Resend ثبت و DNS آن را تأیید کنی؛ سپس API key را به‌صورت امن بسازی و SMTP را در Supabase تنظیم کنی.

هرگز API key یا رمز ایمیل را داخل کُد برنامه یا GitHub قرار نده.
