#!/usr/bin/env bash
# Rebuild static/js/vendor/three-hero.min.js: a tree-shaken ES-module build of
# just the three.js classes the homepage hero (assets/js/archive-hero.js) uses.
# Only needed when the hero starts importing a class that isn't exported below,
# or to bump the three.js version. Requires Node/npx; the Hugo build does not.
set -euo pipefail

THREE_VERSION="0.170.0"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$PROJECT_DIR/static/js/vendor/three-hero.min.js"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

cd "$WORK"
npm init -y >/dev/null
npm install --silent "three@$THREE_VERSION" esbuild@0.24.0

cat > entry.js <<'EOF'
export {
  WebGLRenderer, Scene, PerspectiveCamera, BoxGeometry, InstancedMesh,
  InstancedBufferAttribute, BufferGeometry, BufferAttribute, ShaderMaterial,
  Points, Object3D, Vector2, Vector3, Color, Plane, Raycaster,
  AdditiveBlending, SRGBColorSpace, Mesh, MeshBasicMaterial, CanvasTexture,
  Quaternion, Group, LinearMipmapLinearFilter,
} from 'three';
EOF

mkdir -p "$(dirname "$OUT")"
npx esbuild entry.js --bundle --format=esm --minify --legal-comments=none \
  --banner:js="/* three.js ${THREE_VERSION} (MIT, https://threejs.org) — subset for the homepage hero */" \
  --outfile="$OUT"
echo "Wrote $OUT ($(wc -c <"$OUT") bytes)"
