"""Source/build checks. Browser, inbox and production checks remain separate."""
import json,re,sys,hashlib,base64
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__();self.links=[];self.ids=[];self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag in ('a','link','script','img'):
   for key in ('href','src'):
    if key in a:self.links.append(a[key])
errors=[];files=list(Path('dist').rglob('*.html'));titles=set();faqs=0
headers=Path('dist/_headers').read_text(encoding='utf-8')
for f in files:
 t=f.read_text(encoding='utf-8');p=Page(t)
 if len(p.ids)!=len(set(p.ids)):errors.append(f'{f}: duplicate IDs')
 if 'Intune' in t:errors.append(f'{f}: old branding')
 title=re.search('<title>(.*?)</title>',t).group(1)
 if title in titles:errors.append(f'{f}: duplicate title')
 titles.add(title)
 for link in p.links:
  u=urlsplit(link)
  if u.scheme or u.netloc:continue
  target=Path('dist')/unquote(u.path.lstrip('/')) if u.path.startswith('/') else f.parent/unquote(u.path)
  if not u.path:target=f
  if target.is_dir():target=target/'index.html'
  if not target.exists():errors.append(f'{f}: broken {link}')
 for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>',t,re.S):
  data=json.loads(block)
  faqs+=sum(len(x.get('mainEntity',[])) for x in data['@graph'] if x['@type']=='FAQPage')
  token="sha256-"+base64.b64encode(hashlib.sha256(block.encode()).digest()).decode()
  if token not in headers:errors.append(f'{f}: missing CSP hash')
 if '<meta name="robots"' not in t or '<link rel="canonical"' not in t:errors.append(f'{f}: missing SEO metadata')
 if 'og:image' not in t:errors.append(f'{f}: missing social image')
for f in Path('.').rglob('*'):
 if not f.is_file() or '.git' in f.parts or f.suffix=='.png' or f.name=='audit.py':continue
 try:t=f.read_text(encoding='utf-8')
 except UnicodeError:continue
 if re.search(r'-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}',t):errors.append(f'{f}: possible secret')
print(json.dumps({'html_pages':len(files),'faq_answers':faqs,'errors':errors,'status':'PASS' if not errors else 'FAIL'},indent=2))
sys.exit(bool(errors))
