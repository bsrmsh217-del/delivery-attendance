# خطوات النشر

1. انسخ محتويات هذه الحزمة إلى مستودع GitHub `bsrmsh217-del/delivery-attendance` وارفعها إلى الفرع `main`.
2. في Vercel، أعد Deploy للمشروع من آخر Commit.
3. في Firebase Console > Firestore Database > Rules، الصق محتوى `firestore.rules` ثم Publish.
4. تأكد أن Secret `FIREBASE_SERVICE_ACCOUNT` موجود في Vercel.
5. افتح الموقع، سجل دخول الأدمن الحالي، ثم الإدارة، واضغط «تهيئة حساب Owner» مرة واحدة.
6. بعد تهيئة Owner، ادخل بـ `owner123` / `123123` وغيّر الرمز.
7. عرّف مواقع الفروع من قسم «الموقع».
