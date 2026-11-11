# US-16 â€” Caretaker xem há»“ sÆ¡ thÃº cÆ°ng (Phase 2.1)

**Tráº¡ng thÃ¡i:** Ready for review, chÆ°a Ã¡p dá»¥ng production.

LÃ  Owner, tÃ´i cÃ³ thá»ƒ má»i má»™t email xem Ä‘Ãºng há»“ sÆ¡ thÃº cÆ°ng cá»§a mÃ¬nh Ä‘áº¿n má»™t
ngÃ y háº¿t háº¡n. NgÆ°á»i nháº­n pháº£i Ä‘Äƒng nháº­p báº±ng Ä‘Ãºng email Ä‘Ã£ xÃ¡c minh vÃ  tá»±
cháº¥p nháº­n lá»i má»i trÆ°á»›c khi nhÃ¬n tháº¥y há»“ sÆ¡.

Acceptance criteria:

- Lá»i má»i lÆ°u á»Ÿ tráº¡ng thÃ¡i `Pending`; email Ä‘Æ°á»£c trim/lowercase vÃ  khÃ´ng lÃ m
  lá»™ viá»‡c tÃ i khoáº£n Ä‘Ã£ tá»“n táº¡i.
- Owner chá»‰ Ä‘Æ°á»£c táº¡o, xem vÃ  thu há»“i lá»i má»i cho pet mÃ¬nh sá»Ÿ há»¯u. Lá»i má»i
  trÃ¹ng cÃ²n `Pending`/`Active` bá»‹ cháº·n bá»Ÿi unique index.
- Caretaker chá»‰ tháº¥y lá»i má»i cá»§a chÃ­nh email trong phiÃªn, cháº¥p nháº­n má»™t láº§n
  khi cÃ²n háº¡n, rá»“i nháº­n quyá»n `Active` cho Ä‘Ãºng `pet_id`.
- Caretaker chá»‰ Ä‘á»c thÃ´ng tin cÆ¡ báº£n vÃ  lá»‹ch sá»­ Vaccine/Medical dáº¡ng vÄƒn báº£n;
  khÃ´ng Ä‘Æ°á»£c Ä‘á»c áº£nh riÃªng tÆ°, attachment, Health Log, Reminder, Notification
  hay thÃ´ng tin tÃ i khoáº£n Owner.
- Caretaker khÃ´ng Ä‘Æ°á»£c thÃªm/sá»­a/xÃ³a dá»¯ liá»‡u hoáº·c chia sáº» tiáº¿p. Thu há»“i vÃ  háº¿t
  háº¡n cÃ³ hiá»‡u lá»±c á»Ÿ request Ä‘á»c tiáº¿p theo, ká»ƒ cáº£ khi URL cÅ© cÃ²n má»Ÿ.
- Account cÃ³ thá»ƒ vá»«a sá»Ÿ há»¯u pet cá»§a mÃ¬nh vá»«a lÃ  Caretaker cá»§a pet khÃ¡c.

Phase nÃ y khÃ´ng cáº¥p quyá»n ghi há»“ sÆ¡ tiÃªm/khÃ¡m. Quyá»n thÃªm dá»¯ liá»‡u Caretaker
Ä‘Æ°á»£c xem xÃ©t á»Ÿ Phase sau vá»›i acceptance criteria riÃªng.

