# Mobile Wedding Invitation

GitHub Pages에 배포할 수 있는 모바일 청첩장입니다. Supabase를 연결하면 방명록을 저장하고 최신순으로 보여줍니다.

## Supabase 설정

1. Supabase 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase-schema.sql` 내용을 실행합니다.
3. Project Settings > API에서 Project URL과 anon public key를 확인합니다.

## 관리자 계정

방명록 수정/삭제는 `/admin.html`에서 합니다.

1. Supabase Dashboard > Authentication > Users에서 관리자 계정을 만듭니다.
2. 생성된 User UID를 복사합니다.
3. SQL Editor에서 아래 SQL을 실행합니다.

```sql
insert into public.admin_users (user_id, email)
values ('USER_UID_HERE', 'admin@example.com')
on conflict (user_id) do update set email = excluded.email;
```

`USER_UID_HERE`와 이메일은 실제 관리자 계정 값으로 바꾸세요.

## GitHub Secrets

이 저장소는 `config.js`를 커밋하지 않습니다. GitHub Actions가 배포할 때 Secrets 값으로 `config.js`를 생성합니다.

저장소에서 아래 위치로 이동하세요.

`Settings > Secrets and variables > Actions > New repository secret`

추가할 Secrets:

- `SUPABASE_URL`: Supabase Project URL
- `SUPABASE_ANON_KEY`: Supabase anon public key

값을 넣은 뒤 `Actions > Deploy GitHub Pages > Run workflow`를 실행하거나, 아무 파일이나 수정해서 `main`에 push하면 다시 배포됩니다.

주의: Supabase anon key는 브라우저에서 동작하는 공개 키입니다. public repo에는 남기지 않도록 했지만, 배포된 웹사이트의 JavaScript에서는 볼 수 있습니다. 보안은 `supabase-schema.sql`의 RLS 정책으로 보호합니다. `service_role` key는 절대 넣으면 안 됩니다.

## 로컬 확인

로컬에서 실제 Supabase 연결을 테스트하려면 `config.example.js`를 `config.js`로 복사한 뒤 값을 채워 넣으세요. `config.js`는 `.gitignore`에 들어 있어 커밋되지 않습니다.

## 사진 테스트 이미지

현재 `site-data.js`에는 앨범 테스트용 외부 이미지 URL 4개가 들어 있습니다.

```js
albumImages: [
  {
    src: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=82",
    alt: "손을 맞잡은 신랑 신부",
  },
]
```

실제 사진을 올릴 때는 `src`만 실제 이미지 URL로 바꾸면 됩니다. 개인 사진은 GitHub repo에 직접 넣기보다 Supabase Storage, Cloudinary, S3/R2 같은 이미지 호스팅에 올리고 URL로 연결하는 방식을 권장합니다.

## 수정할 곳

- 이름, 날짜, 장소: `index.html`
- 앨범 사진 URL, 계좌번호: `site-data.js`
- 대표 이미지: `index.html`의 `.hero__image` `src`
- 색상과 여백: `styles.css`의 `:root`
- 지도 링크: `index.html`의 카카오맵/네이버지도 링크

## Todo

- [ ] 신랑/신부 이름을 실제 이름으로 변경: `index.html`
- [ ] 결혼 날짜, 시간, 장소 변경: `index.html`
- [ ] 부모님 성함과 연락처 변경: `index.html`
- [ ] 카카오맵/네이버지도 링크 변경: `index.html`
- [ ] 대표 이미지 변경: `index.html`의 `.hero__image`
- [ ] 앨범 사진 URL 변경: `site-data.js`의 `albumImages`
- [ ] 계좌번호, 은행, 예금주 변경: `site-data.js`의 `accounts`
- [ ] Supabase SQL 실행: `supabase-schema.sql`
- [ ] GitHub Secrets 등록: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- [ ] 관리자 계정 생성 후 `admin_users`에 UID 등록
- [ ] 메인 페이지에서 방명록 작성 테스트
- [ ] `/admin.html`에서 방명록 수정/삭제 테스트
