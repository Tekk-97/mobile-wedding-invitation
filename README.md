# Mobile Wedding Invitation

GitHub Pages에 배포할 수 있는 모바일 청첩장입니다. Supabase를 연결하면 방명록과 참석 의사 응답을 각각 분리해 저장합니다.

## Supabase 설정

1. Supabase 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase-schema.sql` 내용을 실행합니다.
3. Project Settings > API에서 Project URL과 anon public key를 확인합니다.

이전에 SQL을 실행했더라도 스키마 파일이 변경된 경우에는 전체 내용을 다시 실행하세요. RSVP가 동작하려면 `rsvp_responses` 테이블과 `submit_rsvp_response` 함수가 모두 생성되어 있어야 합니다.

## 관리자 계정

참석 의사 확인과 방명록 수정/삭제는 `/admin.html`에서 합니다.

1. Supabase Dashboard > Authentication > Users에서 관리자 계정을 만듭니다.
2. 생성된 User UID를 복사합니다.
3. SQL Editor에서 아래 SQL을 실행합니다.

```sql
insert into public.admin_users (user_id, email)
values ('USER_UID_HERE', 'admin@example.com')
on conflict (user_id) do update set email = excluded.email;
```

`USER_UID_HERE`와 이메일은 실제 관리자 계정 값으로 바꾸세요.

## 방명록 수정/삭제

방명록 작성자는 별도 비밀번호 없이 같은 브라우저에서 자신이 작성한 글을 수정/삭제할 수 있습니다. 브라우저 `localStorage`에 저장한 임의 토큰을 사용하며, DB에는 토큰 원문이 아니라 해시만 저장합니다.

다른 기기나 다른 브라우저에서는 본인 글로 인식되지 않습니다. 브라우저 데이터를 삭제한 경우에도 직접 수정/삭제가 어려우며, 이때는 관리자가 `/admin.html`에서 처리하면 됩니다.

## GitHub Secrets

이 저장소는 `config.js`를 커밋하지 않습니다. GitHub Actions가 배포할 때 Secrets 값으로 `config.js`를 생성합니다.

저장소에서 아래 위치로 이동하세요.

`Settings > Secrets and variables > Actions > New repository secret`

추가할 Secrets:

- `SUPABASE_URL`: Supabase Project URL
- `SUPABASE_ANON_KEY`: Supabase anon public key

값을 넣은 뒤 `Actions > Deploy GitHub Pages > Run workflow`를 실행하거나, 아무 파일이나 수정해서 `main`에 push하면 다시 배포됩니다.

네이버 Web Dynamic Map의 Client ID는 브라우저 SDK 요청에서 공개되는 값이므로 배포 워크플로에 직접 설정되어 있습니다. Client Secret은 브라우저 코드나 GitHub Pages 설정에 넣지 않습니다.

주의: Supabase anon key는 브라우저에서 동작하는 공개 키입니다. public repo에는 남기지 않도록 했지만, 배포된 웹사이트의 JavaScript에서는 볼 수 있습니다. 보안은 `supabase-schema.sql`의 RLS 정책으로 보호합니다. `service_role` key는 절대 넣으면 안 됩니다.

## 로컬 확인

로컬에서 실제 Supabase 연결과 네이버 지도를 테스트하려면 `config.example.js`를 `config.js`로 복사한 뒤 값을 채워 넣으세요. `config.js`는 `.gitignore`에 들어 있어 커밋되지 않습니다. 네이버 지도 Client ID를 사용할 때는 NAVER Cloud Maps 애플리케이션의 Web 서비스 URL에 로컬 주소와 실제 배포 도메인도 등록해야 합니다. Client Secret은 브라우저 코드나 GitHub Pages 설정에 넣지 않습니다.

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
- [ ] 카카오페이 송금 링크 변경: `site-data.js`의 `kakaoPayUrl`
- [ ] 예식장 좌표와 지도 링크 변경: `site-data.js`의 `venue`
- [ ] Supabase SQL 실행: `supabase-schema.sql`
- [ ] SQL 실행 후 사이트를 새로고침해서 방명록 저장 테스트
- [ ] GitHub Secrets 등록: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- [ ] 관리자 계정 생성 후 `admin_users`에 UID 등록
- [ ] 메인 페이지에서 방명록 작성 테스트
- [ ] 메인 페이지에서 참석 의사 제출 및 `rsvp_responses` 저장 테스트
- [ ] 작성한 방명록을 같은 브라우저에서 수정/삭제 테스트
- [ ] `/admin.html`에서 참석 응답 확인과 방명록 수정/삭제 테스트
