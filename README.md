# MyLodge

검은 모션 인트로와 20페이지 소개, 3D 공간 체험, 연간 일정 미리보기로 구성된 정적 웹사이트

## 운영 연결

- 홈페이지: https://mylodge-pied.vercel.app
- GitHub: https://github.com/myhanzcity-hub/mylodge-renewal
- Vercel: https://vercel.com/myhanzcity-hub/mylodge-renewal
- 소유 계정: myhanzcity-hub

## 실행

Node.js 20 이상에서 `npm ci` 후 `npm start`

- 로컬 시작: http://127.0.0.1:4183/
- 인트로: /intro.html
- 첫 페이지: /index.html#page=1
- 공간 체험: /villa.html
- 일정 미리보기: /schedule.html

## 빌드와 배포

`npm run build` 명령으로 `dist`를 생성합니다
Vercel은 저장소의 `vercel.json` 설정을 사용합니다
환경변수와 서버 데이터베이스는 필요하지 않습니다
`main` 브랜치가 Vercel의 운영 배포 기준입니다

## 편집

- 문구·사진: `deck-data.js`
- 페이지 스타일: `presentation.css`
- 인터랙션: `presentation.js`, `presentation-extras.js`, `presentation-motion.js`
- HTML 생성: `scripts/render-presentation.mjs`, `scripts/render-experiences.mjs`
- 이미지 최적화: `python scripts/prepare-responsive-images.py` 실행 후 빌드 (Pillow 필요)

추가한 파일은 명시적인 `.gitignore` 및 `.vercelignore` 허용 목록에도 등록합니다
원본 기획 자료·내부 검토 기록·미사용 이미지는 저장소와 배포에 포함하지 않습니다

## 검증

`npm run check`는 원본 자료가 있는 로컬 작업 폴더에서 수행하는 전체 대조 검사입니다
저장소에 포함되지 않은 내부 검토 자료와 사용자 원본 사진 폴더가 필요합니다
새 체크아웃에서는 `npm run build`와 다음 독립 실행 검사를 사용할 수 있습니다

`node --test scripts/navigation.test.mjs scripts/motion.test.mjs scripts/schedule-ui.test.mjs scripts/intro.test.mjs`

## 서비스 안내

회원가입 버튼은 https://hanzcity.com/auth/sign-in 으로 연결됩니다
상품 신청·계약·예약은 별도이며 일정 화면은 실제 예약이 아닌 미리보기입니다
AI 이미지는 공간 콘셉트이며 실제 제공 시설은 상품별로 안내합니다
3D는 기존 MyLodge 약 27평의 개념 모델입니다
