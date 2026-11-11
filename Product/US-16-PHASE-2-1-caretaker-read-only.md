# US-16 Ã¢â‚¬â€ Caretaker xem hÃ¡Â»â€œ sÃ†Â¡ thÃƒÂº cÃ†Â°ng (Phase 2.1)

**TrÃ¡ÂºÂ¡ng thÃƒÂ¡i:** Ready for review, chÃ†Â°a ÃƒÂ¡p dÃ¡Â»Â¥ng production.

LÃƒÂ  Owner, tÃƒÂ´i cÃƒÂ³ thÃ¡Â»Æ’ mÃ¡Â»Âi mÃ¡Â»â„¢t email xem Ã„â€˜ÃƒÂºng hÃ¡Â»â€œ sÃ†Â¡ thÃƒÂº cÃ†Â°ng cÃ¡Â»Â§a mÃƒÂ¬nh Ã„â€˜Ã¡ÂºÂ¿n mÃ¡Â»â„¢t
ngÃƒÂ y hÃ¡ÂºÂ¿t hÃ¡ÂºÂ¡n. NgÃ†Â°Ã¡Â»Âi nhÃ¡ÂºÂ­n phÃ¡ÂºÂ£i Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p bÃ¡ÂºÂ±ng Ã„â€˜ÃƒÂºng email Ã„â€˜ÃƒÂ£ xÃƒÂ¡c minh vÃƒÂ  tÃ¡Â»Â±
chÃ¡ÂºÂ¥p nhÃ¡ÂºÂ­n lÃ¡Â»Âi mÃ¡Â»Âi trÃ†Â°Ã¡Â»â€ºc khi nhÃƒÂ¬n thÃ¡ÂºÂ¥y hÃ¡Â»â€œ sÃ†Â¡.

Acceptance criteria:

- LÃ¡Â»Âi mÃ¡Â»Âi lÃ†Â°u Ã¡Â»Å¸ trÃ¡ÂºÂ¡ng thÃƒÂ¡i `Pending`; email Ã„â€˜Ã†Â°Ã¡Â»Â£c trim/lowercase vÃƒÂ  khÃƒÂ´ng lÃƒÂ m
  lÃ¡Â»â„¢ viÃ¡Â»â€¡c tÃƒÂ i khoÃ¡ÂºÂ£n Ã„â€˜ÃƒÂ£ tÃ¡Â»â€œn tÃ¡ÂºÂ¡i.
- Owner chÃ¡Â»â€° Ã„â€˜Ã†Â°Ã¡Â»Â£c tÃ¡ÂºÂ¡o, xem vÃƒÂ  thu hÃ¡Â»â€œi lÃ¡Â»Âi mÃ¡Â»Âi cho pet mÃƒÂ¬nh sÃ¡Â»Å¸ hÃ¡Â»Â¯u. LÃ¡Â»Âi mÃ¡Â»Âi
  trÃƒÂ¹ng cÃƒÂ²n `Pending`/`Active` bÃ¡Â»â€¹ chÃ¡ÂºÂ·n bÃ¡Â»Å¸i unique index.
- Caretaker chÃ¡Â»â€° thÃ¡ÂºÂ¥y lÃ¡Â»Âi mÃ¡Â»Âi cÃ¡Â»Â§a chÃƒÂ­nh email trong phiÃƒÂªn, chÃ¡ÂºÂ¥p nhÃ¡ÂºÂ­n mÃ¡Â»â„¢t lÃ¡ÂºÂ§n
  khi cÃƒÂ²n hÃ¡ÂºÂ¡n, rÃ¡Â»â€œi nhÃ¡ÂºÂ­n quyÃ¡Â»Ân `Active` cho Ã„â€˜ÃƒÂºng `pet_id`.
- Caretaker chÃ¡Â»â€° Ã„â€˜Ã¡Â»Âc thÃƒÂ´ng tin cÃ†Â¡ bÃ¡ÂºÂ£n vÃƒÂ  lÃ¡Â»â€¹ch sÃ¡Â»Â­ Vaccine/Medical dÃ¡ÂºÂ¡ng vÃ„Æ’n bÃ¡ÂºÂ£n;
  khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c Ã„â€˜Ã¡Â»Âc Ã¡ÂºÂ£nh riÃƒÂªng tÃ†Â°, attachment, Health Log, Reminder, Notification
  hay thÃƒÂ´ng tin tÃƒÂ i khoÃ¡ÂºÂ£n Owner.
- Caretaker khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c thÃƒÂªm/sÃ¡Â»Â­a/xÃƒÂ³a dÃ¡Â»Â¯ liÃ¡Â»â€¡u hoÃ¡ÂºÂ·c chia sÃ¡ÂºÂ» tiÃ¡ÂºÂ¿p. Thu hÃ¡Â»â€œi vÃƒÂ  hÃ¡ÂºÂ¿t
  hÃ¡ÂºÂ¡n cÃƒÂ³ hiÃ¡Â»â€¡u lÃ¡Â»Â±c Ã¡Â»Å¸ request Ã„â€˜Ã¡Â»Âc tiÃ¡ÂºÂ¿p theo, kÃ¡Â»Æ’ cÃ¡ÂºÂ£ khi URL cÃ…Â© cÃƒÂ²n mÃ¡Â»Å¸.
- Account cÃƒÂ³ thÃ¡Â»Æ’ vÃ¡Â»Â«a sÃ¡Â»Å¸ hÃ¡Â»Â¯u pet cÃ¡Â»Â§a mÃƒÂ¬nh vÃ¡Â»Â«a lÃƒÂ  Caretaker cÃ¡Â»Â§a pet khÃƒÂ¡c.

Phase nÃƒÂ y khÃƒÂ´ng cÃ¡ÂºÂ¥p quyÃ¡Â»Ân ghi hÃ¡Â»â€œ sÃ†Â¡ tiÃƒÂªm/khÃƒÂ¡m. QuyÃ¡Â»Ân thÃƒÂªm dÃ¡Â»Â¯ liÃ¡Â»â€¡u Caretaker
Ã„â€˜Ã†Â°Ã¡Â»Â£c xem xÃƒÂ©t Ã¡Â»Å¸ Phase sau vÃ¡Â»â€ºi acceptance criteria riÃƒÂªng.



