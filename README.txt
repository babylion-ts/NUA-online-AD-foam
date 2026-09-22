======================================================
 NUA 이미지 컨설팅 신청폼 — 프로젝트 인수인계 안내
======================================================

(마지막 정리: 2026-09-22 — 스모어식 전환·버튼·입력칸, 페이지 디자인 개편 반영)

[구성 파일]
- index.html          : 폼 본체 (이거 하나가 폼 전체)
- pages/ (폴더)       : 폼에 쓰이는 이미지들
    · 원본(지우지 말 것): p-1~p-9.jpg, process.jpg, done-base.jpg, done.jpg
    · 실제 사용: p-1n, p-2b, p-3x, p-4x, p-5n, p-6n, p-7q, p-8q, p-9q .jpg
                + 같은 이름의 m-*.png(넘어가는 애니메이션용 조각 마스크)
                + bg.jpg, done-48.jpg, proc-s1a/s1b/s2a/s2b.jpg, p-1.jpg(공유 미리보기)
- apps-script.gs      : 구글 시트 저장/이탈분석용 스크립트 (구글에 붙여넣는 용도)
- tools/ (폴더)       : 다시 작업할 때 쓰는 도구(미리보기 서버, 마스크 생성기, 배경판) — 사이트에 올릴 필요 없음
- CLAUDE_HANDOFF.md   : Claude로 이어서 작업할 때 먼저 읽힐 상세 인수인계 문서
- README.txt          : 이 파일

[현재 연결된 주소들]  ※ 인수인계 시 꼭 전달
- 실제 폼 주소(Vercel) : https://nua-online-ad-foam.vercel.app/
- 응답 저장 구글시트    : https://docs.google.com/spreadsheets/d/1hCSY5jYWKa0y7nh6fMzSMduKgbmQ7zZeknp94nbazFg/edit
- 구글 Apps Script URL : https://script.google.com/macros/s/AKfycbyeBHRAYjMFcgtU3xP1PNWtO2AZH27C-klJ8YFAHE2sJQZD66VTD95XWfcfwNU11-B8/exec
  (이 URL은 index.html 안 CONFIG.SCRIPT_URL 에 들어가 있음)

------------------------------------------------------
 1) 폼 수정 후 새로 올리기 (Vercel 반영)
------------------------------------------------------
1. index.html 또는 pages/ 이미지를 수정
2. GitHub 저장소 → Add file → Upload files
   → 수정한 index.html (그리고 이미지 바꿨으면 pages 폴더도) 드래그 → Commit
3. Vercel이 자동으로 다시 배포 (약 1분) → 주소 그대로 유지
※ 2026-09-22 작업분(새 이미지·마스크 다수)은 아직 안 올렸을 수 있음
   → index.html + pages 폴더 통째로 올리는 게 가장 확실함

[미리보기(내 컴퓨터)]
- 터미널에서:  python3 tools/preview-server.py   → 브라우저로 http://localhost:4190
- 미리보기에서는 구글시트로 전송하지 않음(눌러봐도 실제 응답/통계가 쌓이지 않음)

------------------------------------------------------
 2) 다른 계정으로 인수인계 하는 법
------------------------------------------------------
아래 4가지를 넘기면 새 담당자가 이어서 작업 가능합니다.

[A] 소스 파일
  - 이 폴더(zip) 통째로 전달 = 폼 전체. 이것만 있으면 새로 배포 가능.

[B] GitHub (코드 저장소)  — 둘 중 하나 선택
  (1) 협업자로 초대: 저장소 → Settings → Collaborators → 상대 GitHub 아이디 초대
  (2) 소유권 이전  : 저장소 → Settings → 맨아래 Danger Zone → Transfer ownership
  (3) 아니면 상대가 본인 계정에 새 저장소 만들고 zip 파일 업로드해도 됨

[C] Vercel (배포)  — 둘 중 하나
  (1) 상대가 자기 Vercel로 로그인 → 그 GitHub 저장소 Import → 배포 (새 주소 생김)
  (2) 기존 주소를 유지하려면 Vercel 팀으로 초대하거나 프로젝트 Transfer

[D] 구글 시트 + Apps Script (응답 데이터)  ★ 가장 중요
  - 지금 폼은 위 'Apps Script URL'로 데이터를 보냅니다. 이 스크립트는
    구글시트에 종속(연결)되어 있고, '내(원 소유자) 계정으로 실행'되도록 배포돼 있음.
  - 계속 같은 시트에 쌓이길 원하면:
      → 구글시트 [공유]에서 새 담당자 이메일을 '편집자'로 추가 (데이터 열람/관리 가능)
      → URL 그대로 두면 폼은 계속 잘 저장됨 (원 소유자 계정만 살아있으면 됨)
  - 새 담당자 계정이 '완전히' 넘겨받으려면:
      → 구글시트 [공유] → 소유권 이전  또는
      → 새 계정에서 apps-script.gs 를 새 시트에 붙여넣고 다시 '웹앱 배포' →
        새로 나온 URL을 index.html 의 CONFIG.SCRIPT_URL 에 교체 → 다시 업로드

[E] (선택) Claude로 계속 편집하려면
  - 새 Claude 계정에서 이 폴더(또는 zip 푼 폴더)를 열고 첫 메시지로
    "CLAUDE_HANDOFF.md 먼저 읽고 이어서 작업해줘" 라고 하면 됩니다.
    (지금까지의 구조·결정·사용자 선호·남은 일이 전부 정리돼 있음)
  - 예전 참고용 미리보기(아티팩트, 옛 버전): https://claude.ai/artifact/9kg4KeSab1cu1pQwkaHPd1

------------------------------------------------------
 3) 자주 만지는 부분 (index.html 상단)
------------------------------------------------------
- CONFIG.SCRIPT_URL : 구글 저장 주소 (시트 바꾸면 여기 교체)
- STEPS 배열        : 폼 페이지 순서/문항
- POLICY 상수       : 개인정보 동의 안내문
- ?edit=1 을 주소 뒤에 붙이면 : 탭 영역(버튼 위치) 확인 모드
- FX_PIECES         : 넘어가는 애니메이션 조각 좌표 (페이지 이미지를 바꾸면 tools/fx_mask.py로 마스크도 다시)
