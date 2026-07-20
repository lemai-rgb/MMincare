# MMinCare — Figma Design Handoff cho Codex

**Phiên bản:** 2.0 — đo trực tiếp từ Figma  
**Phạm vi:** Home, Login Page Design - 1, Register Page Design - 2  
**Target project:** Next.js 16 App Router, React 19, TypeScript  
**Figma file:** https://www.figma.com/design/s21SYuVWawEJlHIcg8njuI/MMin-Care-UL-design?node-id=6-5  
**Page:** `Hi-fi Screens` — node `6:5`

> Đây là nguồn triển khai giao diện. Codex không được tự thay đổi bố cục, màu sắc, nội dung, typography hoặc hành vi nghiệp vụ nếu chưa có yêu cầu mới.

---

## 1. Node nguồn và kích thước chuẩn

| Màn | Node ID | Link trực tiếp | Frame |
|---|---:|---|---:|
| Home | `18:16` | https://www.figma.com/design/s21SYuVWawEJlHIcg8njuI/MMin-Care-UL-design?node-id=18-16 | `1440 × 1024` |
| Login Page Design - 1 | `25:56` | https://www.figma.com/design/s21SYuVWawEJlHIcg8njuI/MMin-Care-UL-design?node-id=25-56 | `1449 × 1024` |
| Register Page Design - 2 | `45:7` | https://www.figma.com/design/s21SYuVWawEJlHIcg8njuI/MMin-Care-UL-design?node-id=45-7 | `1449 × 1024` |

### Quy tắc đối chiếu

1. Desktop tại viewport thiết kế phải khớp screenshot Figma.
2. Sai số mục tiêu:
   - Vị trí/kích thước: tối đa `±2px`.
   - Font size/radius: `0px`.
   - Màu: đúng mã HEX.
3. Không dùng ảnh chụp nguyên màn làm UI.
4. Mọi text, input và button phải là phần tử HTML thật.
5. Asset SVG/PNG phải tải về `public/assets/mmincare/...`; không hotlink URL tạm của Figma trong production.

---

# 2. Design tokens

## 2.1. Color tokens

```css
:root {
  --mm-primary: #6e8b6b;
  --mm-primary-dark: #4f6f52;

  --mm-canvas: #faf8f5;
  --mm-surface: #ffffff;
  --mm-surface-soft: #fcfbf9;
  --mm-auth-green-wash: #ddeBDD;

  --mm-text: #333333;
  --mm-text-home: #2d2d2d;
  --mm-text-secondary: #7c7c7c;
  --mm-placeholder: #bfbfbf;
  --mm-gray-2: #aeaeb2;

  --mm-border: #e8e2da;
  --mm-auth-border: #727272;
  --mm-elevated-subtle: #f2f2f7;
}
```

> CSS không phân biệt hoa/thường trong HEX; dùng `#DDEBDD` trong source để dễ đọc.

## 2.2. Typography

| Token | Font | Size | Weight | Line height | Dùng cho |
|---|---|---:|---:|---:|---|
| H1 Home | Inter | 40px | 700 | normal | Logo MMinCare |
| Auth page title | Inter | 48px | 600 | normal | Đăng nhập / Đăng ký |
| Title | Inter | 20px | 600 | normal | Section title |
| Body | Inter | 16px | 400 | normal | Label, body, button |
| Caption | Inter | 14px | 400 | normal | Tagline, card caption |
| Placeholder | Inter | 13px | 400 | normal | Placeholder input |
| Home description | Intel One Mono | 20px | 400 | 32px | Mô tả trung tâm Home |

### Cấu hình Next.js đề xuất

```ts
import { Inter, Intel_One_Mono } from "next/font/google";

export const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const intelOneMono = Intel_One_Mono({
  subsets: ["latin"],
  variable: "--font-intel-one-mono",
  display: "swap",
});
```

Nếu phiên bản `next/font/google` hiện tại không cung cấp Intel One Mono, dùng fallback:

```css
font-family: "Intel One Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
```

## 2.3. Radius

```css
--radius-home-shell: 32px;
--radius-auth-shell: 28px;
--radius-auth-card: 24px;
--radius-card: 24px;
--radius-button: 14px;
--radius-input: 4px;
--radius-pill: 999px;
```

## 2.4. Border và shadow

```css
--border-default: 1px solid #e8e2da;
--border-auth-shell: 1px solid #727272;

--shadow-home-shell: inset 0 12px 32px rgba(0, 0, 0, 0.06);
--shadow-card: 0 8px 24px rgba(0, 0, 0, 0.08);
--shadow-feature-strip: 0 8px 12px rgba(0, 0, 0, 0.06);
--shadow-auth-card: 0 12px 32px rgba(0, 0, 0, 0.08);
```

---

# 3. Component architecture Codex nên dùng

```text
src/
├─ app/
│  ├─ page.tsx
│  ├─ login/page.tsx
│  └─ register/page.tsx
├─ components/
│  ├─ brand/
│  │  └─ MMinCareBrand.tsx
│  ├─ buttons/
│  │  ├─ PrimaryButton.tsx
│  │  └─ SecondaryButton.tsx
│  ├─ auth/
│  │  ├─ AuthShell.tsx
│  │  ├─ AuthFormCard.tsx
│  │  ├─ AuthInput.tsx
│  │  ├─ PasswordInput.tsx
│  │  └─ GoogleAuthButton.tsx
│  └─ home/
│     ├─ SpeciesCard.tsx
│     ├─ SpeciesSelector.tsx
│     ├─ FeatureStrip.tsx
│     └─ HomeDecorations.tsx
├─ styles/
│  ├─ tokens.css
│  ├─ home.module.css
│  └─ auth.module.css
└─ public/assets/mmincare/
   ├─ home/
   └─ auth/
```

### Không được làm

- Không tạo ba bản button riêng có CSS khác nhau.
- Không copy/paste toàn bộ Login để tạo Register.
- Không cài Tailwind chỉ vì Figma MCP trả reference code dạng Tailwind.
- Không để absolute positioning cho mọi phần tử ở breakpoint mobile.

### Được phép

- Desktop dùng `position:absolute` ở các decoration để đạt pixel accuracy.
- Nội dung chính dùng flex/grid.
- Login và Register dùng chung `AuthShell` và `AuthFormCard`.

---

# 4. Màn Home — node `18:16`

## 4.1. Canvas

| Thuộc tính | Giá trị |
|---|---:|
| Frame | `1440 × 1024` |
| Background | `#FAF8F5` |
| Overflow | hidden |
| Position | relative |

## 4.2. Header và page shell

### Header background — node `18:17`

| X | Y | W | H | Fill | Border |
|---:|---:|---:|---:|---|---|
| 0 | 0 | 1440 | 80 | `#FFFFFF` | `1px #E8E2DA` |

### Main shell — node `18:19`

| X | Y | W | H | Radius | Fill | Border | Shadow |
|---:|---:|---:|---:|---:|---|---|---|
| 34 | 30 | 1354 | 968 | 32 | white | `1px #E8E2DA` | `inset 0 12px 32px rgba(0,0,0,.06)` |

> Shell nằm đè lên header; đây là chủ ý thiết kế.

## 4.3. Brand

### Logo — node `18:18`

| X | Y | Box | Font | Color |
|---:|---:|---|---|---|
| 77 | 23 | `202 × 48` | Inter 40/700 | `#6E8B6B` |

Text: `MMinCare`

### Tagline — node `19:33`

| X | Y | Box | Font | Color |
|---:|---:|---|---|---|
| 96 | 62 | `145 × 17` | Inter 14/400 | `#7C7C7C` |

Text: `Care more, worry less`

## 4.4. Login CTA trong header

### Prompt — node `20:131`

| X | Y | Box | Font | Color |
|---:|---:|---|---|---|
| 1022 | 56 | `126 × 19` | Inter 16/400 | `#6E8B6B` |

Text: `Đã có tài khoản?`

### Secondary button — instance `20:132`

| X | Y | W | H | Radius | Fill | Border |
|---:|---:|---:|---:|---:|---|---|
| 1168 | 40 | 140 | 48 | 14 | `#FCFBF9` | `1px #E8E2DA` |

Text:
- `Đăng nhập`
- Inter 16/400
- `#5D775B`

Interaction:
- click → `/login`
- hover: nền `#F5F3EF`, border `#CFC8BE`
- focus-visible: outline `2px #6E8B6B`, offset `2px`
- active: translateY(1px)

## 4.5. Hero description

### Description — node `20:135`

| X | Y | W | H | Font | Line height | Color | Align |
|---:|---:|---:|---:|---|---:|---|---|
| 390 | 210 | 660 | 27 | Intel One Mono 20/400 | 32 | `#2D2D2D` | center |

Text chính xác:

```text
MMinCare giúp bạn lưu trữ hồ sơ sức khỏe, nhắc lịch tiêm và theo dõi tình trạng của thú cưng tại một nơi.
```

### Section title — node `21:230`

| X | Y | Box | Font | Align |
|---:|---:|---|---|---|
| 611 | 372 | `233 × 24` | Inter 20/600 | center |

Text: `Bắt đầu dùng MMinCare`

### Subtitle — node `20:138`

| X | Y | Box | Font | Color |
|---:|---:|---|---|---|
| 506 | 420 | `448 × 19` | Inter 16/400 | `#7C7C7C` |

Text: `Chọn loại thú cưng của bạn để tạo hồ sơ đầu tiên`

## 4.6. Species cards

### Cat card — node `19:20`

| X | Y | W | H | Radius | Fill | Border | Shadow |
|---:|---:|---:|---:|---:|---|---|---|
| 349 | 470 | 341 | 180 | 24 | white | `1px #E8E2DA` | `0 8px 12px rgba(0,0,0,.08)` |

Internal:
- layout: vertical flex
- align: center
- justify: center
- gap: 16
- padding: 24
- icon: `84 × 84`
- caption: Inter 14/400, `#6E8B6B`
- text: `Dành cho bé Mèo`
- arrow asset: `48.75 × 5.33`, ở đáy card

### Dog card — node `19:26`

| X | Y | W | H | Radius | Fill | Border | Shadow |
|---:|---:|---:|---:|---:|---|---|---|
| 750 | 470 | 341 | 180 | 24 | white | `1px #E8E2DA` | `0 8px 24px rgba(0,0,0,.08)` |

Internal:
- icon wrapper: `136 × 106`
- dog icon: `84 × 84`
- caption: `Dành cho bé Chó`
- caption font: Inter 14/400, `#6E8B6B`
- arrow: `49 × 6`

### Interaction cả card

- Toàn card là `<Link>`/button, không chỉ mũi tên.
- Cat → `/register?species=cat`
- Dog → `/register?species=dog`
- Giữ query `species` qua đăng ký; sau đăng ký chuyển `/pets/new?species=...`.
- Hover:
  - translateY(-3px)
  - shadow `0 12px 32px rgba(0,0,0,.11)`
  - border `#C9D8C7`
- Focus-visible rõ ràng.
- `aria-label="Tạo hồ sơ cho bé mèo"` / chó.

## 4.7. Divider “hoặc”

### Circle — node `20:139`

| X | Y | Size |
|---:|---:|---:|
| 692 | 530 | 56 |

Asset có shadow vượt box; dùng asset đúng Figma.

### Text — node `20:142`

- center tại x ≈ 720.5
- y 550
- Inter 16/400
- `#AEAEB2`
- text `hoặc`

## 4.8. Helper pill

| Node | X | Y | W | H | Radius |
|---|---:|---:|---:|---:|---:|
| `20:146` | 590 | 685 | 260 | 36 | 999 |

- fill `#FAF8F5`
- border `1px #F2F2F7`
- text `Hiện tại chỉ hỗ trợ chó mèo`
- Inter 16/400, black

## 4.9. Feature strip — node `20:162`

| X | Y | W | H | Radius | Padding | Gap |
|---:|---:|---:|---:|---:|---|---:|
| 160 | 760 | 1120 | 150 | 32 | `28px 40px` | 24 |

Style:
- white
- border `1px #E8E2DA`
- shadow `0 8px 12px rgba(0,0,0,.06)`
- horizontal flex
- 4 equal columns

| Cột | Title | Body |
|---|---|---|
| 1 | Hồ sơ sức khỏe tập trung | Lưu trữ lịch sử khám, tiêm và dùng thuốc. |
| 2 | Nhắc lịch thông minh | Không bỏ lỡ lịch tiêm hay tái khám |
| 3 | Theo dõi dễ dàng | Cập nhật tình trạng sức khỏe theo thời gian |
| 4 | Chia sẻ chăm sóc | Kết nối với người chăm sóc một cách an toàn. |

Typography:
- title: Inter 20/600
- body: Figma đang có cột 1 là 18px, các cột còn lại 16px. **Triển khai nên giữ đúng Figma**; không tự đồng nhất nếu mục tiêu là pixel-perfect.
- body line-height: 20px
- center

## 4.10. Decoration map

| Node | Vị trí/kích thước | Asset |
|---|---|---|
| `21:109` | x53 y710, 1335×260 | bottom wave |
| `21:10` | x≈-23 y182, 579×248; rotation 14.36° | thread line |
| `21:105`, `21:106` | 14×14 | beige dots |
| `21:107`, `21:108` | 14×14 | green dots |
| `21:86`, `21:97` | 28×28 | small stars/leaves |
| `21:104` | 26×26 | bone |
| `21:101` | 24×24 | fish |
| `21:94`, `21:98` | decorative leaves | leaf assets |

Decoration:
- `pointer-events:none`
- `aria-hidden:true`
- không ảnh hưởng layout
- tắt bớt ở mobile

---

# 5. Login Page Design - 1 — node `25:56`

## 5.1. Canvas

| Thuộc tính | Giá trị |
|---|---:|
| Frame | `1449 × 1024` |
| Layout | relative |
| Content padding ở Figma | horizontal 277, vertical 156 |

### Background gradient

Mục tiêu thị giác: xanh rất nhạt ở vùng ngoài, kem sáng ở trung tâm.

```css
.authPage {
  background:
    conic-gradient(
      from 90deg at 50% 50%,
      #ddeBDD 0%,
      #faf8f5 53.72%,
      #ddeBDD 100%
    );
}
```

Nếu gradient native không khớp screenshot, dùng pseudo-element lớn, rotate/scale đến khi khớp Figma; không thay bằng màu phẳng.

## 5.2. Back icon — node `29:170`

| X | Y | Size |
|---:|---:|---:|
| 303 | 182 | 26×26 |

- icon trong Figma được rotate 180°.
- Click → `/`
- vùng bấm tối thiểu `44×44`, dù icon chỉ 26px.

## 5.3. Auth shell — node `25:58`

| X | Y | W | H | Radius | Fill | Border |
|---:|---:|---:|---:|---:|---|---|
| 161 | 122 | 1127 | 774 | 28 | white | `1px #727272` |

- overflow hidden
- shell không có padding global; children đo tương đối theo shell.

## 5.4. Illustration

Asset: `login.petIllustration`

Figma placement theo % shell:
- left: `44.48%`
- top: `9.55%`
- width: `55.5%`
- height: `80.82%`
- opacity: `.95`
- object-fit: contain

Tương đương gần đúng:
- x trong shell ≈ 501px
- y trong shell ≈ 74px
- w ≈ 626px
- h ≈ 626px

## 5.5. Glass form card — node `25:61`

Tọa độ theo auth shell:

| X | Y | W | H | Radius | Fill | Blur |
|---:|---:|---:|---:|---:|---|---:|
| 59 | 84 | 470 | 600 | 24 | rgba(255,255,255,.30) | 10.672px |

Thêm shadow để khớp screenshot:
`0 12px 32px rgba(0,0,0,.08)`.

## 5.6. Brand và title

### Brand — node `25:66`

| X | Y center | Box | Font | Color |
|---:|---:|---|---|---|
| 116 | 142 | 200 wide | Inter 20/600 | `#4F6F52` |

Text: `MMinCare`

### Page title — node `25:67`

| X | Y center | W | Font | Color |
|---:|---:|---:|---|---|
| 115 | 192 | 250 | Inter 48/600 | `#333333` |

Text: `Đăng nhập`

## 5.7. Form fields

### Email group — node `25:68`

| X | Y | W | Gap |
|---:|---:|---:|---:|
| 120.98 | 237 | 346.044 | 8 |

Label:
- `Email`
- Inter 16/400
- `#333`

Input:
- `346.044 × 40`
- background white
- radius 4
- padding 16
- placeholder `username@gmail.com`
- placeholder Inter 13/400, `#BFBFBF`

### Password group — node `25:75`

| X | Y | W |
|---:|---:|---:|
| 120.98 | 317 | 346.044 |

Input:
- `346.044 × 40`
- radius 4
- padding 16
- right icon 16×16
- placeholder `Password`

### Quên mật khẩu — node `25:72`

- y center ≈ 405.5
- Inter 16/400
- letter spacing `0.8px`
- `#4F6F52`
- link → route/reset flow hiện có

## 5.8. Primary button

Visual button:
- `160 × 48`
- radius 14
- fill `#6E8B6B`
- centered in 470px form card
- actual top ≈ `449px` trong shell
- label `Tiếp tục`
- Inter 16/400, white

States:
- disabled khi đang submit hoặc validation chưa đạt
- loading: spinner + `Đang đăng nhập...`
- hover `#5D775B`
- active `#4F6F52`

## 5.9. Alternative login

Text — node `25:62`:
- center x ≈ 281
- y center ≈ 528.5
- 250px wide
- Inter 16/400
- `Hoặc đăng nhập với`

Google button — nodes `25:83–85`:
- x 154.03
- y 547
- w 258.242
- visual h 35
- radius ≈ 28.458
- border `1px #727272`
- white
- Google icon 17.075×17.075
- entire button clickable

## 5.10. Register prompt

Node `25:63`:
- x149
- y617
- w300.593
- Inter 16/400

Text:
- `Chưa có tài khoản?`
- link `Đăng ký miễn phí` màu `#4F6F52`
- sửa typo trong Figma `tài khoàn` thành `tài khoản` trong code.
- click → `/register`

## 5.11. Validation và error state

Không thêm Name vào form.

Email:
- required
- trim đầu/cuối
- lowercase trước so khớp
- invalid: message ngay dưới input

Password:
- required

Sai thông tin đăng nhập:
- chỉ dùng thông báo chung:
  `Email hoặc mật khẩu không đúng`
- không highlight riêng email hay password như thể biết trường nào sai.

Error UI:
```css
.authInputError {
  outline: 1px solid #d9776a;
}
.fieldError {
  margin-top: 6px;
  color: #c85f52;
  font-size: 13px;
}
.formError {
  color: #c85f52;
  font-size: 14px;
  text-align: center;
}
```

---

# 6. Register Page Design - 2 — node `45:7`

## 6.1. Shared layout

Giữ **100%** các thông số sau giống Login:
- canvas `1449×1024`
- gradient
- back icon
- auth shell `1127×774`, x161 y122, radius28
- illustration placement
- glass form card `470×600`, x59, radius24
- typography/color system

Dùng chung component, đổi nội dung và số field.

## 6.2. Brand và title

Brand:
- node `45:16`
- `MMinCare`
- Inter 20/600
- `#4F6F52`

Title:
- node `45:17`
- `Đăng ký`
- Inter 48/600
- `#333`

## 6.3. Fields

### Email — node `45:19`

- x120.98, y237
- w346.044
- label `Email`
- input `346.044×40`
- placeholder `username@gmail.com`

### Mật khẩu — node `45:24`

- x120.98, y317
- w346.044
- input `346.044×40`
- eye icon 16×16
- sửa placeholder typo thành `Mật khẩu`

### Xác nhận mật khẩu — node `45:48`

- x125, y396
- w346.044
- input `346.044×40`
- eye icon 16×16
- placeholder `Nhập lại mật khẩu`

> Chênh x 4.02px của field xác nhận là số đo Figma hiện tại. Giữ nếu cần pixel-perfect; khi refactor responsive có thể căn cùng x với hai field trên.

## 6.4. Submit button — node `45:18`

Visual:
- `160×48`
- radius 14
- fill `#6E8B6B`
- top visual ≈ 493px trong shell
- label `Đăng ký`
- Figma label đang 20/600; giữ đúng:
  - Inter 20/600
  - white

## 6.5. Alternative signup

Text — node `45:12`:
- `Hoặc đăng ký với`
- center x ≈ 290
- y center ≈ 564.5
- Inter 16/400

Google button — nodes `45:32–34`:
- x116
- y580
- w342
- h57
- radius 24 outer; inner radius 28.458
- white
- border `1px #727272`
- Google icon 17.075×17.075

## 6.6. Login prompt

Node `68:253`:
- x145
- y652
- w300.593

Text:
- `Đã có tài khoản?`
- link `Đăng nhập`
- link color `#4F6F52`
- click → `/login`
- sửa typo `tài khoàn` → `tài khoản`.

## 6.7. Register validation

Form gửi:
```ts
type RegisterForm = {
  email: string;
  password: string;
  confirmPassword: string;
};
```

Không hiển thị hoặc gửi `name`.

Rules:
- email required, valid, trim, lowercase
- password ≥ 8 ký tự
- password có ít nhất 1 chữ số
- confirmPassword phải khớp
- email tồn tại: `Email đã tồn tại`
- chặn submit khi invalid

Sau đăng ký thành công:
1. Backend tạo `name` từ phần trước `@`.
2. Giữ session đăng nhập.
3. Nếu Home đã chọn species, redirect `/pets/new?species=cat|dog`.
4. Nếu không có species, redirect `/pets/new`.

Google:
- Google OAuth thành công → lấy tên Google.
- Nếu Google không trả tên → fallback local-part email.

---

# 7. Auth shared responsive behavior

Figma chỉ có desktop. Các quy tắc dưới đây là **implementation specification**, không phải kích thước đo từ frame mobile.

## ≥ 1200px

- Giữ desktop gần như tuyệt đối.
- `authShell` dùng:
  ```css
  width: min(1127px, calc(100vw - 80px));
  aspect-ratio: 1127 / 774;
  ```
- Max height không vượt viewport trừ browser zoom.

## 768–1199px

- shell width `calc(100vw - 48px)`
- illustration chiếm 48–52%
- form card width 44–48%
- giảm title auth 48 → 40px
- input giữ ít nhất 44px height để dễ dùng

## < 768px

- nền gradient giữ nguyên
- shell:
  - width `calc(100vw - 32px)`
  - min-height theo content
  - margin `24px auto`
- ẩn illustration hoặc đưa thành watermark opacity ≤ .12
- form card full width
- card padding 24px
- title 36px
- input 48px
- button full width
- Google button full width
- không dùng desktop absolute coordinates cho form fields
- back icon fixed 16px/20px từ top-left an toàn

---

# 8. Home responsive behavior

## ≥ 1200px
Giữ tọa độ desktop.

## 768–1199px
- shell margin 24px
- description max-width 660
- species cards grid 2 cột
- feature strip 2×2
- decoration giảm opacity hoặc ẩn các asset sát mép

## < 768px
- header logo trái; chỉ button đăng nhập, ẩn prompt nếu thiếu chỗ
- description font 18px, line-height 28
- species cards xếp dọc, width 100%, max 360
- bỏ circle “hoặc”, thay text separator
- feature strip xếp dọc
- shell radius 24
- shell không fixed height
- wave và thread decoration ẩn để tránh overflow

---

# 9. Accessibility

- Contrast text chính trên trắng phải đạt WCAG AA.
- Button, link, species card có focus-visible.
- Vùng bấm tối thiểu 44×44.
- Input có `<label htmlFor>`.
- Icon mắt có `aria-label="Hiện mật khẩu"` / `Ẩn mật khẩu`.
- Decorative SVG: `aria-hidden`.
- Illustration auth:
  - `alt=""` nếu thuần trang trí.
- Form có `aria-live="polite"` cho lỗi server.
- Khi submit lỗi, focus field đầu tiên invalid.
- Không dùng màu là tín hiệu lỗi duy nhất.

---

# 10. Route và hành vi

| Action | Route/behavior |
|---|---|
| Home → Đăng nhập | `/login` |
| Home → Mèo | `/register?species=cat` |
| Home → Chó | `/register?species=dog` |
| Login → Đăng ký miễn phí | `/register` |
| Register → Đăng nhập | `/login` |
| Login thành công Owner | `/pets` |
| Login thành công Caretaker | `/shared-pets` hoặc landing type backend trả |
| Register thành công | `/pets/new` và giữ species query |
| Google auth | dùng endpoint/provider hiện có |
| Back auth | `/` |

---

# 11. API mapping

```ts
POST /api/v1/auth/register
{
  email,
  password
}
```

Frontend không gửi `name`.

```ts
POST /api/v1/auth/login
{
  email,
  password
}
```

```ts
POST /api/v1/auth/google
{
  redirect_url?: string
}
```

Login success đọc:
```ts
{
  access_token: string;
  user: User;
  landing_type: "owner_pet_list" | "shared_pet_list";
}
```

---

# 12. Visual QA checklist cho Codex

## Home

- [ ] Frame ở 1440×1024.
- [ ] Shell x34 y30, 1354×968.
- [ ] Logo đúng 40px.
- [ ] Mô tả đúng Intel One Mono 20/32.
- [ ] Card Mèo x349, Card Chó x750.
- [ ] Cả hai card 341×180, radius24.
- [ ] Feature strip 1120×150 tại x160 y760.
- [ ] Header login CTA đúng vị trí.
- [ ] Decoration không che content.
- [ ] Không có horizontal scrollbar.

## Login

- [ ] Frame 1449×1024.
- [ ] Shell x161 y122, 1127×774.
- [ ] Form card 470×600.
- [ ] Illustration không bị crop đầu/tai/chân.
- [ ] Title 48px.
- [ ] Inputs 346.044×40.
- [ ] Primary button 160×48.
- [ ] Google button đúng kích thước Login.
- [ ] Lỗi login dùng message chung.
- [ ] Link đăng ký hoạt động.

## Register

- [ ] Shared shell/illustration khớp Login.
- [ ] Có 3 field, không có Name.
- [ ] Password rules hoạt động.
- [ ] Confirm password hoạt động.
- [ ] Google button đúng kích thước Register.
- [ ] Link đăng nhập hoạt động.
- [ ] Redirect sang Add Pet sau thành công.

---

# 13. Asset manifest

Các URL dưới đây được Figma MCP tạo và **có thể hết hạn sau khoảng 7 ngày**. Codex phải tải chúng vào `public/assets/mmincare` ngay khi triển khai. Không để URL tạm trong code production.

Xem file kèm:
- `figma-assets-manifest.json`
- `design-tokens.json`

---

# 14. Prompt đề xuất để đưa cho Codex

```text
Hãy triển khai pixel-accurate 3 màn Home, Login và Register của MMinCare theo file
MMinCare_Figma_Design_Handoff_v2.md.

Figma source:
- Home node 18:16
- Login node 25:56
- Register node 45:7
- File key s21SYuVWawEJlHIcg8njuI

Yêu cầu:
1. Trước tiên phân tích codebase hiện tại: Next.js App Router, styling đang dùng, route và auth hiện có.
2. Không cài Tailwind nếu project chưa dùng Tailwind.
3. Dùng component dùng chung; Login và Register không được copy/paste độc lập.
4. Tải toàn bộ asset từ figma-assets-manifest.json vào public/assets/mmincare.
5. Triển khai desktop sát Figma, sau đó thêm responsive theo handoff.
6. Không thêm Name vào Register.
7. Email trim/lowercase; password tối thiểu 8 ký tự và có ít nhất 1 số.
8. Login thất bại chỉ hiển thị “Email hoặc mật khẩu không đúng”.
9. Google OAuth phải nối vào flow hiện có.
10. Chạy lint, typecheck và build.
11. Sau khi code xong, mở từng route ở đúng viewport và đối chiếu với Figma.
12. Báo rõ file đã tạo/sửa và mọi khác biệt còn tồn tại.
```
