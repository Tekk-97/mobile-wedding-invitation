# Mobile Wedding Invitation

GitHub Pages에 바로 배포할 수 있는 모바일 청첩장입니다. Supabase를 연결하면 방명록을 저장하고 최신순으로 보여줍니다.

## 파일 구성

- `index.html`: 청첩장 화면
- `styles.css`: 모바일 중심 스타일
- `app.js`: Supabase 방명록 연동
- `config.js`: Supabase URL과 anon key 설정
- `supabase-schema.sql`: Supabase 테이블과 RLS 정책

## Supabase 설정

1. Supabase 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase-schema.sql` 내용을 실행합니다.
3. Project Settings > API에서 Project URL과 anon public key를 복사합니다.
4. `config.js`에 값을 입력합니다.

```js
window.WEDDING_CONFIG = {
  supabaseUrl: "https://xxxx.supabase.co",
  supabaseAnonKey: "eyJ...",
};
```

anon key는 프론트엔드에 들어가는 공개 키입니다. 대신 `supabase-schema.sql`의 RLS 정책을 꼭 켜 둬야 합니다.

## GitHub Pages 배포

1. GitHub에 public 저장소를 만듭니다.
2. 이 폴더를 push합니다.
3. 저장소 Settings > Pages에서 `Deploy from a branch`를 선택합니다.
4. Branch는 `main`, folder는 `/root`로 설정합니다.

## 수정할 곳

- 이름, 날짜, 장소: `index.html`
- 대표 이미지: `index.html`의 `.hero__image` `src`
- 색상과 여백: `styles.css`의 `:root`
- 지도 링크: `index.html`의 카카오맵/네이버지도 링크
