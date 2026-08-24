#!/bin/bash
# src/ 모듈들을 game.html 단일 파일로 합칩니다.
set -e
cd "$(dirname "$0")"
npx --yes esbuild@0.23.0 src/js/main.js --bundle --format=iife --outfile=/tmp/bundle.js --charset=utf8 >/dev/null 2>&1
python3 - <<'PY'
import pathlib, re
root = pathlib.Path('.')
html = (root/'src/index.html').read_text(encoding='utf-8')
reset = (root/'src/css/reset.css').read_text(encoding='utf-8')
game  = (root/'src/css/game.css').read_text(encoding='utf-8')
bundle = pathlib.Path('/tmp/bundle.js').read_text(encoding='utf-8')
html = html.replace('  <link rel="stylesheet" href="./css/reset.css" />\n  <link rel="stylesheet" href="./css/game.css" />',
                    '  <style>\n' + reset + '\n' + game + '\n  </style>')
html = html.replace('  <script type="module" src="./js/main.js"></script>',
                    '  <script>\n' + bundle + '\n  </script>')
assert '<style>' in html and 'type="module"' not in html, '치환 실패'
banner = ('<!--\n  랜덤 타워 디펜스 — 단일 파일 빌드 (더블클릭으로 실행 가능)\n'
          '  이 파일은 src/ 폴더의 모듈들을 하나로 합친 결과물입니다.\n'
          '  코드를 수정할 때는 src/ 를 고친 뒤 build.md 안내대로 다시 빌드하세요.\n-->\n')
html = html.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n' + banner, 1)
(root/'game.html').write_text(html, encoding='utf-8')
style = re.search(r'<style>.*?</style>', html, re.S).group(0)
body  = re.search(r'<body>(.*?)</body>', html, re.S).group(1)
pathlib.Path('/home/claude/artifact-game.html').write_text(
    '<title>랜덤 타워 디펜스 프로토타입</title>\n' + style + '\n' + body.strip() + '\n', encoding='utf-8')
print('빌드 완료:', len(html), 'bytes')
PY
