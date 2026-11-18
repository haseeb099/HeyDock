"""Release preparation; no network calls or third-party dependencies."""
import re,os,json,hashlib,base64
from pathlib import Path
from html import escape

def prepare(ns):
 ns['icons'].update({
 'network':'<circle cx="12" cy="5" r="3"/><path d="M12 8v5M4 13h16M4 13v4m8-4v4m8-4v4"/><path d="M2 17h4v4H2zm8 0h4v4h-4zm8 0h4v4h-4z"/>',
 'backup':'<path d="M4 8a8 8 0 1 1-1 8M4 3v5h5M12 7v6l4 2"/>',
 'server':'<rect x="3" y="2" width="18" height="8" rx="2"/><rect x="3" y="14" width="18" height="8" rx="2"/><path d="M6 6h1m3 0h8M6 18h1m3 0h8"/>',
 'tools':'<path d="m14 6 4-4a6 6 0 0 1-7 8L4 21l-3-3 10-7a6 6 0 0 1 3-9v4z"/>',
 'deploy':'<rect x="2" y="3" width="13" height="11" rx="1"/><path d="M8 14v4m-4 0h8m5-8h5m-2-3 3 3-3 3m-4 5h6m-3-3 3 3-3 3"/>',
 'phone':'<path d="m5 2 4 5-3 3a17 17 0 0 0 8 8l3-3 5 4-2 3C10 23 1 14 2 4z"/>',
 'recycle':'<path d="m8 7 4-6 4 6m-5-1 5 1 1-5m3 10 3 7h-8m4-3-4 3 3 4M8 20H1l4-7m-1 5 1-5-5 1"/>',
 'compass':'<circle cx="12" cy="12" r="10"/><path d="m16 8-2 6-6 2 2-6z"/>'})


def finalize():
 origin=os.environ.get('HEYDOCK_ORIGIN','https://nexorvanta-business-preview.sproutingbadge2.chatgpt.site').rstrip('/')
 hashes=set()
 for file in Path('dist').rglob('*.html'):
  text=file.read_text()
  for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>',text,re.S):
   hashes.add("'sha256-"+base64.b64encode(hashlib.sha256(block.encode()).digest()).decode()+"'")
  tags='<meta property="og:image" content="'+escape(origin)+'/social-preview.png"><meta property="og:image:alt" content="HeyDock — IT Services, Software and AI Automation"><meta name="twitter:card" content="summary_large_image">'
  text=text.replace('</head>',tags+'</head>')
  file.write_text(text)
 csp="default-src 'none'; script-src 'self' "+' '.join(sorted(hashes))+"; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'; upgrade-insecure-requests"
 Path('dist/_headers').write_text('/*\n  Content-Security-Policy: '+csp+'\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()\n  Strict-Transport-Security: max-age=31536000\n')
 Path('dist/social-preview.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#142a35"/><circle cx="1030" cy="130" r="270" fill="none" stroke="#daf47c" stroke-width="2"/><text x="85" y="270" font-family="Arial,sans-serif" font-size="140" font-weight="bold" fill="#daf47c">HeyDock.</text><text x="90" y="365" font-family="Arial,sans-serif" font-size="42" fill="white">Your IT team. One hello away.</text><text x="90" y="510" font-family="Arial,sans-serif" font-size="27" fill="#d2dcd8">IT Services · Software · AI Automation</text></svg>')
 # Social SVG is a source asset; some crawlers require raster previews. Record this in the audit.
