"""Source/build checks. Browser, inbox and production checks remain separate."""
import json,re,sys,hashlib,base64,os
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

site={}
site_path=Path('content/site.json')
if site_path.exists():
 site=json.loads(site_path.read_text(encoding='utf-8'))
OPERATOR_NAME=os.environ.get('HEYDOCK_OPERATOR_NAME', site.get('operator_name','') or '').strip()

errors=[];files=list(Path('dist').rglob('*.html'));titles=set();faqs=0
headers=Path('dist/_headers').read_text(encoding='utf-8')
for f in files:
 t=f.read_text(encoding='utf-8');p=Page(t)
 if len(p.ids)!=len(set(p.ids)):errors.append(f'{f}: duplicate IDs')
 # Legacy parent-company marketing. Allow verified operator name, Microsoft Intune technology refs,
 # and the approved disclosure: "HeyDock is a trading name of {OPERATOR_NAME}".
 cleaned=t
 if OPERATOR_NAME:
  cleaned=re.sub(rf'HeyDock is a trading name of {re.escape(OPERATOR_NAME)}','',cleaned,flags=re.I)
 if re.search(r'trading\s+(as|name)', cleaned, re.I):
  errors.append(f'{f}: trading-as marketing copy')
 cleaned=re.sub(r'Microsoft\s+Intune','',cleaned,flags=re.I)
 if OPERATOR_NAME:
  cleaned=cleaned.replace(OPERATOR_NAME,'')
 if re.search(r'\bIntune\b', cleaned):
  errors.append(f'{f}: legacy Intune branding')
 if re.search(r'HeyDock Ltd', t) and 'HeyDock Ltd' != OPERATOR_NAME:
  errors.append(f'{f}: invented HeyDock Ltd identity')
 if os.environ.get('HEYDOCK_PUBLIC')=='1' and re.search(r'pending confirmation|Preview: operator disclosures incomplete|Incomplete disclosures:', t, re.I):
  errors.append(f'{f}: pending/preview disclosure language on public build')
 if f.name=='contact.html' and 'id="company-details"' not in t:
  errors.append(f'{f}: missing company-details section')
 if 'href="/contact.html#company-details"' not in t:
  errors.append(f'{f}: missing Company details footer link')
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
required_docs=['documents.html','cookies.html','complaints.html','support-and-escalation.html','security-and-data-handling.html','vendor-onboarding.html']
for name in required_docs:
 if not (Path('dist')/name).exists():
  errors.append(f'missing required page: {name}')
for f in Path('.').rglob('*'):
 if not f.is_file() or '.git' in f.parts or f.suffix=='.png' or f.name=='audit.py':continue
 try:t=f.read_text(encoding='utf-8')
 except UnicodeError:continue
 if re.search(r'-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}',t):errors.append(f'{f}: possible secret')
print(json.dumps({'html_pages':len(files),'faq_answers':faqs,'errors':errors,'status':'PASS' if not errors else 'FAIL'},indent=2))
sys.exit(bool(errors))
