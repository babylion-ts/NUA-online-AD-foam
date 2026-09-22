# NUA 이미지 컨설팅 신청폼 미리보기 서버  (실행: python3 tools/preview-server.py → http://localhost:4190)
#  - /          → image-consulting-form/index.html (저장하면 자동 새로고침)
#  - 그 외 경로 → image-consulting-form/ 폴더 파일 (pages/ 이미지 등)
#  원본 HTML은 수정하지 않고, 응답에만 아래 두 스크립트를 끼워 넣음.
#   1) 시트 전송 차단: 미리보기에서 누른 기록이 실제 구글시트(로그/분석)에 쌓이지 않도록
#      script.google.com 으로 가는 요청을 막고 콘솔에만 출력
#   2) 라이브 리로드: index.html 이나 pages/ 이미지가 바뀌면 자동 새로고침
import http.server, socketserver, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # tools/의 한 단계 위 = 폼 폴더
HTML = os.path.join(ROOT, "index.html")
PAGES = os.path.join(ROOT, "pages")
PORT = 4190

BLOCK = b"""<script>(function(){var G=/script\\.google\\.com/;
var f=window.fetch;window.fetch=function(u,o){if(G.test(String(u&&u.url||u))){
try{console.info('[\xeb\xaf\xb8\xeb\xa6\xac\xeb\xb3\xb4\xea\xb8\xb0] \xec\x8b\x9c\xed\x8a\xb8 \xec\xa0\x84\xec\x86\xa1 \xec\xb0\xa8\xeb\x8b\xa8',JSON.parse(o&&o.body||'{}'));}catch(e){}
return Promise.resolve(new Response('{"ok":true}',{status:200}));}return f.apply(this,arguments);};
if(navigator.sendBeacon){var b=navigator.sendBeacon.bind(navigator);navigator.sendBeacon=function(u,d){
if(G.test(String(u)))return true;return b(u,d);};}})();</script>"""

RELOAD = b"""<script>(function(){var m=null;setInterval(function(){
fetch('/__mtime',{cache:'no-store'}).then(function(r){return r.text()}).then(function(t){
if(m===null)m=t;else if(t!==m)location.reload();}).catch(function(){});},600);})();</script>"""


def mtime():
    ts = [os.path.getmtime(HTML)]
    if os.path.isdir(PAGES):
        ts += [os.path.getmtime(os.path.join(PAGES, n)) for n in os.listdir(PAGES)]
    return str(max(ts))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        super().end_headers()

    def log_message(self, *a):
        pass

    def do_GET(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]
        if path == "/__mtime":
            return self._send(mtime().encode(), "text/plain")
        if path in ("/", "/index.html"):
            with open(HTML, "rb") as f:
                body = f.read()
            i = body.find(b"<head>")
            body = body[:i + 6] + BLOCK + body[i + 6:] if i != -1 else BLOCK + body
            i = body.rfind(b"</body>")
            body = body[:i] + RELOAD + body[i:] if i != -1 else body + RELOAD
            return self._send(body, "text/html; charset=utf-8")
        return super().do_GET()

    def _send(self, body, ctype):
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


socketserver.ThreadingTCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
