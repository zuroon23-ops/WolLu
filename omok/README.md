# 오목 · 한 판 (V1.0)

15×15 자유룰 오목. 5개 이상 승리, 금수 없음. 한 기기 2인 및 온라인 2인 대전, 방 번호/초대 링크, 양측 동의 재대결. 같은 브라우저 프로필에서는 익명 계정이 공유되므로 온라인 테스트는 서로 다른 기기나 일반 창과 시크릿 창으로 하세요.

## 즉시 로컬 테스트
압축을 풀고 index.html을 브라우저로 열면 한 기기 대전이 가능합니다. 로컬에는 Firebase나 인터넷이 필요 없습니다.

## 온라인 설정
1. https://console.firebase.google.com/ 에서 프로젝트를 만들고 웹 앱을 등록합니다. Analytics는 선택 사항입니다.
2. Authentication > Sign-in method에서 Anonymous(익명)를 활성화합니다.
3. Realtime Database를 생성합니다. 잠금 모드를 선택한 뒤 Rules 탭에 database.rules.json 내용 전체를 붙여넣고 게시합니다. 공개 테스트 모드는 사용하지 마세요.
4. 프로젝트 설정의 웹 앱 Firebase 설정 객체를 firebase-config.js의 window.FIREBASE_CONFIG에 붙여넣습니다. databaseURL이 없다면 Realtime Database 화면의 URL을 추가합니다. 관리자 서비스 계정 JSON이나 비밀 키를 올리지 마세요.
5. Authentication > Settings > Authorized domains에 자신의 GitHub Pages 호스트(예: username.github.io)를 추가합니다. 로컬 HTTP 테스트가 필요하면 localhost도 추가합니다.
6. GitHub에 공개 저장소(예: omok)를 생성하고 이 폴더 내부 파일을 저장소 루트에 업로드합니다. Settings > Pages > Deploy from a branch > main > /(root) > Save를 선택합니다. 배포된 주소는 Pages 화면에서 확인합니다.
7. 서로 다른 브라우저/기기로 접속하여 한 명이 방을 만들고 상대가 초대 링크 또는 8자리 방 번호로 참가합니다.

## 제한 사항
친구끼리 하는 프로토타입입니다. 익명 인증 및 방 단위 쓰기 권한 규칙을 사용하지만, 참가자의 개발자 도구 조작을 완전히 막지는 못합니다. 서버 권위형 착수/승패 검증, 접속 상태 표시, 자동 방 삭제, 타이머, 관전, 자동 매칭은 미구현입니다. 방 나가기는 화면에서만 나가며 기존 익명 계정으로 동일 방에 재접속할 수 있습니다. 신뢰할 수 없는 사용자 대상 서비스로 공개 운영하기 전 서버 검증, 남용 방지 및 규칙 검증이 필요합니다. Firebase 실제 프로젝트 및 두 기기 간 연동 테스트는 아직 수행하지 않았습니다.

공식 설명: https://firebase.google.com/docs/database/web/start 및 https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
