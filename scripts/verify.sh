#!/usr/bin/env bash
# Headless-Chrome checks for the static site. Usage: scripts/verify.sh [outdir]
set -uo pipefail
cd "$(dirname "$0")/.."
OUT=${1:-/tmp/aaronrama-verify}; rm -rf "$OUT"; mkdir -p "$OUT"
CHROME=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
PORT=${PORT:-8777}
python3 -m http.server "$PORT" >/dev/null 2>&1 & SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
sleep 1
URL="http://localhost:$PORT/"
G=(--headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars --virtual-time-budget=5000 --enable-logging=stderr --v=0)
NOGL=(--disable-webgl --disable-3d-apis)

shot() { local name=$1 size=$2 url=$3; shift 3
  "$CHROME" "${G[@]}" --window-size="$size" "$@" --screenshot="$OUT/$name.png" "$url" 2>"$OUT/$name.log" >/dev/null; }
dom() { local url=$1; shift; "$CHROME" "${G[@]}" "$@" --dump-dom "$url" 2>/dev/null; }

# Phone sizes go through tests/frame.html (exact-size iframe) because headless windows can't be narrower than ~500px.
shot desktop   1440,900 "$URL"
shot mobile    500,860  "${URL}tests/frame.html?w=390&h=844"
shot small     500,660  "${URL}tests/frame.html?w=360&h=640"
shot landscape 844,390  "$URL"
shot reduced   1440,900 "$URL" --force-prefers-reduced-motion
shot nowebgl   1440,900 "$URL" "${NOGL[@]}"

fail=0
check() { if eval "$2"; then echo "ok   $1"; else echo "FAIL $1"; fail=1; fi; }

for f in "$OUT"/*.log; do
  check "no console errors ($(basename "$f" .log))" "! grep -E 'CONSOLE.*(Uncaught|Error)' '$f' | grep -v 'WebGL' | grep -q ."
done
check "page reaches ready"            "dom '$URL' | grep -q 'class=\"ready\"'"
check "animation on by default"       "dom '$URL' | grep -q 'data-anim=\"on\"'"
check "reduced motion is static"      "dom '$URL' --force-prefers-reduced-motion | grep -q 'data-anim=\"off\"'"
check "no-webgl fallback applied"     "dom '$URL' ${NOGL[*]} | grep -q 'no-webgl'"
check "text becomes visible"         "dom '${URL}tests/reveal.html' | grep -q '>PASS<'"
check "network unit tests pass"       "dom '${URL}tests/network.test.html' | grep -q '>PASS<'"

echo "screenshots: $OUT"
exit $fail
