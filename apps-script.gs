/**
 * NUA 이미지 컨설팅 신청폼 → 구글 시트 저장 + 이탈 분석 대시보드
 *
 * [업데이트 방법]
 * 1) Apps Script 편집기에서 기존 코드 전체 삭제 → 이 코드 붙여넣기 → 저장(💾)
 * 2) (분석 시트 바로 만들기) 편집기 상단 함수 목록에서 'updateDashboard' 선택 → ▶ 실행
 *      - 권한 승인 창이 뜨면 본인 계정으로 허용
 * 3) (폼에 반영) 배포 → 배포 관리 → 연필(편집) → 버전 '새 버전' → 배포  (URL은 그대로 유지됨)
 * 4) 시트를 새로고침(F5) → 상단에 '📊 이탈 분석' 메뉴 생성 → 언제든 '지금 새로고침' 클릭
 *
 * 생기는 시트 3개
 *   신청 : 최종 제출된 신청서(깔끔한 목록)
 *   로그 : 모든 행동 원본 기록
 *   분석 : 단계별 도달/이탈 퍼널 (제출될 때마다 자동 갱신 + 메뉴로 수동 갱신)
 */

var SUBMIT_SHEET = '신청';
var LOG_SHEET = '로그';
var DASH_SHEET = '분석';

var COLUMNS = [
  '제출시각', '성함', '출생연도', '연락처', '가까운 역',
  '성별', '추구 이미지', '스타일링 고민', '무드 인지도(0-10)', '개인정보 동의',
  '소요시간(초)', 'sid'
];

// 폼 단계 순서(로그의 '단계' 값 → 보기 좋은 이름)
var STEPS = [
  ['intro',   '① 시작(첫 화면)'],
  ['gender',  '② 성별 선택'],
  ['pursuit', '③ 추구 이미지'],
  ['concern', '④ 스타일링 고민'],
  ['mood',    '⑤ 무드 인지도'],
  ['profile', '⑥ 성함·나이'],
  ['phone',   '⑦ 연락처'],
  ['station', '⑧ 가까운 역'],
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    logEvent_(ss, data);

    if (data.event === 'submit') {
      var sh = ss.getSheetByName(SUBMIT_SHEET) || ss.insertSheet(SUBMIT_SHEET);
      if (sh.getLastRow() === 0) sh.appendRow(COLUMNS);
      var a = data.answers || {};
      sh.appendRow([
        new Date(),
        a['성함'] || '', a['출생연도'] || '', a['연락처'] || '', a['가까운 역'] || '',
        a['성별'] || '', a['추구 이미지'] || '', a['스타일링 고민'] || '',
        (a['무드 인지도'] === undefined ? '' : a['무드 인지도']),
        data.consent ? '동의' : '미동의',
        data.elapsed || '', data.sid || ''
      ]);
      try { updateDashboard(); } catch (err) {}   // 제출 때마다 분석 자동 갱신
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function logEvent_(ss, data) {
  try {
    var sh = ss.getSheetByName(LOG_SHEET) || ss.insertSheet(LOG_SHEET);
    if (sh.getLastRow() === 0) sh.appendRow(['시각', '이벤트', '단계', 'sid', '항목', '답변']);
    sh.appendRow([
      new Date(),
      data.event || '', data.step || '', data.sid || '', data.col || '',
      data.answer !== undefined ? data.answer : (data.answers ? JSON.stringify(data.answers) : '')
    ]);
  } catch (e) {}
}

/** 로그를 읽어 '분석' 시트에 단계별 도달/이탈 퍼널을 그린다 */
function updateDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var log = ss.getSheetByName(LOG_SHEET);
  var dash = ss.getSheetByName(DASH_SHEET) || ss.insertSheet(DASH_SHEET);
  dash.clear();

  if (!log || log.getLastRow() < 2) {
    dash.getRange(1, 1).setValue('아직 데이터가 없습니다. 폼이 제출되면 채워집니다.');
    return;
  }

  var rows = log.getRange(2, 1, log.getLastRow() - 1, 6).getValues();
  var reached = {};
  STEPS.forEach(function (s) { reached[s[0]] = Object.create(null); });
  var submitted = Object.create(null);

  rows.forEach(function (r) {
    var ev = r[1], step = r[2], sid = String(r[3] || '');
    if (!sid) return;
    if (/test|diag|vercel|check/i.test(sid)) return;   // 테스트 데이터 제외
    if (reached[step]) reached[step][sid] = 1;
    if (ev === 'submit') submitted[sid] = 1;
  });

  var cnt = function (o) { return Object.keys(o).length; };
  var counts = STEPS.map(function (s) { return cnt(reached[s[0]]); });
  var submitCount = cnt(submitted);
  var maxN = Math.max.apply(null, counts.concat([submitCount, 1]));
  var startCount = counts[0] || 0;

  var out = [];
  out.push(['📊 참여자 이탈 분석', '', '', '', '']);
  out.push(['총 시작 ' + startCount + '명   →   최종 제출 ' + submitCount + '명   (전체 전환율 ' +
            (startCount ? Math.round(submitCount / startCount * 100) : 0) + '%)', '', '', '', '']);
  out.push(['업데이트: ' + Utilities.formatDate(new Date(), 'GMT+9', 'yyyy-MM-dd HH:mm'), '', '', '', '']);
  out.push(['', '', '', '', '']);
  out.push(['단계', '도달 인원', '직전 대비 유지율', '이탈(중도포기)', '퍼널 그래프']);

  var prev = null;
  STEPS.forEach(function (s, i) {
    var n = counts[i];
    var keep = (prev === null) ? '-' : (prev === 0 ? '-' : Math.round(n / prev * 100) + '%');
    var drop = (prev === null) ? '-' : (prev - n) + '명';
    out.push([s[1], n + '명', keep, drop, bar_(n, maxN)]);
    prev = n;
  });
  var keepS = (prev && prev > 0) ? Math.round(submitCount / prev * 100) + '%' : '-';
  var dropS = (prev !== null) ? (prev - submitCount) + '명' : '-';
  out.push(['✅ 제출 완료', submitCount + '명', keepS, dropS, bar_(submitCount, maxN)]);

  dash.getRange(1, 1, out.length, 5).setValues(out);

  // 서식
  dash.getRange(1, 1).setFontSize(15).setFontWeight('bold');
  dash.getRange(2, 1).setFontWeight('bold').setFontColor('#c0451c');
  dash.getRange(3, 1).setFontColor('#999999');
  dash.getRange(5, 1, 1, 5).setFontWeight('bold').setBackground('#efece6');
  dash.getRange(6, 5, out.length - 5, 1).setFontColor('#f1541f');
  dash.getRange(out.length, 1, 1, 5).setFontWeight('bold').setBackground('#eaf5ea');
  dash.setColumnWidth(1, 160);
  dash.setColumnWidth(2, 90);
  dash.setColumnWidth(3, 120);
  dash.setColumnWidth(4, 110);
  dash.setColumnWidth(5, 260);
}

function bar_(n, maxN) {
  var len = maxN > 0 ? Math.round(n / maxN * 22) : 0;
  var s = '';
  for (var i = 0; i < len; i++) s += '■';
  return s || '·';
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('📊 이탈 분석')
    .addItem('지금 새로고침', 'updateDashboard')
    .addToUi();
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json_({ ok: true, msg: 'NUA form endpoint ready' });
}
