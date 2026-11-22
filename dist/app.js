'use strict';
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#main-nav');
if(menu&&nav){menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');nav.classList.toggle('open',open)});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');menu.focus()}})}
const search=document.querySelector('#catalog-search'),category=document.querySelector('#catalog-category');
if(search&&category){const items=[...document.querySelectorAll('.product-card')];function filter(){const q=search.value.trim().toLowerCase(),cat=category.value;let count=0;items.forEach(el=>{const show=el.dataset.search.includes(q)&&(cat==='all'||el.dataset.category===cat);el.hidden=!show;if(show)count++});document.querySelector('#catalog-count').textContent=`${count} solution${count===1?'':'s'} found`;document.querySelector('#catalog-empty').hidden=count!==0}search.addEventListener('input',filter);category.addEventListener('change',filter);document.querySelector('#reset-filters').addEventListener('click',()=>{search.value='';category.value='all';filter();search.focus()});filter()}
const cov=document.querySelector('#coverage-form');if(cov){cov.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(cov);const q=new URLSearchParams({service:'coverage',location:String(data.get('location')||''),task:String(data.get('task')||'')});location.href='/contact.html?'+q.toString()})}
const form=document.querySelector('#enquiry-form');
const statusEl=document.querySelector('#enquiry-status');
const successEl=document.querySelector('#enquiry-success');
const submitBtn=form?form.querySelector('[type="submit"]'):null;
const defaultSubmitLabel=submitBtn?submitBtn.innerHTML:'Send enquiry';

function setStatus(kind,message){
  if(!statusEl)return;
  statusEl.hidden=!message;
  statusEl.className='form-status'+(kind?' '+kind:'');
  statusEl.textContent=message||'';
  statusEl.setAttribute('role',kind==='error'?'alert':'status');
}

function setSending(on){
  if(!form||!submitBtn)return;
  form.dataset.sending=on?'1':'0';
  submitBtn.disabled=!!on;
  submitBtn.setAttribute('aria-busy',on?'true':'false');
  submitBtn.innerHTML=on?'Sending…':defaultSubmitLabel;
}

if(form){
  const params=new URLSearchParams(location.search);
  const srv=params.get('service');
  const allowed=[...form.elements.service.options].map(o=>o.value);
  if(allowed.includes(srv))form.elements.service.value=srv;
  else if(srv){form.elements.service.value='software';form.elements.scope.value='Interested in '+srv.replaceAll('-',' ')+'. '}
  if(params.get('audience')==='partner')form.elements.audience.value='partner';
  if(params.get('location'))form.elements.location.value=params.get('location');
  if(params.get('task'))form.elements.scope.value='Coverage enquiry for '+params.get('task')+'. ';

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(form.dataset.sending==='1')return;
    if(!form.reportValidity())return;
    setSending(true);
    setStatus('sending','Sending your enquiry…');
    if(successEl)successEl.hidden=true;

    const raw=new FormData(form);
    const payload={
      audience:String(raw.get('audience')||''),
      service:String(raw.get('service')||''),
      company:String(raw.get('company')||''),
      name:String(raw.get('name')||''),
      email:String(raw.get('email')||''),
      location:String(raw.get('location')||''),
      timing:String(raw.get('timing')||''),
      budget:String(raw.get('budget')||''),
      scope:String(raw.get('scope')||''),
      consent:raw.get('consent')!=null,
      website:String(raw.get('website')||'')
    };

    try{
      const res=await fetch('/api/enquiry',{
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify(payload)
      });
      let data={};
      try{data=await res.json()}catch(_){data={}}
      if(!res.ok){
        const message=data.error||'We could not send your enquiry. Please try again.';
        throw Object.assign(new Error(message),{status:res.status,fields:data.fields||{}});
      }
      form.hidden=true;
      setStatus('','');
      if(successEl){
        successEl.hidden=false;
        successEl.focus();
      }
    }catch(err){
      setStatus('error',err&&err.message?err.message:'We could not send your enquiry. Please try again.');
      setSending(false);
      const firstField=err&&err.fields?Object.keys(err.fields)[0]:null;
      if(firstField&&form.elements[firstField])form.elements[firstField].focus();
      else if(submitBtn)submitBtn.focus();
    }
  });

  const retry=document.querySelector('#retry-enquiry');
  if(retry){
    retry.addEventListener('click',()=>{
      if(successEl)successEl.hidden=true;
      form.hidden=false;
      setSending(false);
      setStatus('','');
      form.elements.company.focus();
    });
  }
}

// Close mobile navigation after selection, outside interaction, or desktop resize.
if(menu&&nav){const closeMenu=()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation')};nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu()});document.addEventListener('click',e=>{if(!nav.contains(e.target)&&!menu.contains(e.target))closeMenu()});document.addEventListener('focusin',e=>{if(!nav.contains(e.target)&&e.target!==menu)closeMenu()});matchMedia('(min-width:781px)').addEventListener('change',closeMenu)}
// Progressive enhancement: retain native select as the accessible no-JS fallback.
document.querySelectorAll('select').forEach((select)=>{const shell=document.createElement('details');shell.className='select-disclosure';const summary=document.createElement('summary');summary.setAttribute('aria-label',select.closest('label').childNodes[0].textContent.trim());const panel=document.createElement('div');panel.className='select-options';const sync=()=>{summary.textContent=select.selectedOptions[0].textContent};sync();[...select.options].forEach(option=>{const button=document.createElement('button');button.type='button';button.textContent=option.textContent;button.addEventListener('click',()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));shell.open=false;summary.focus()});panel.append(button)});shell.append(summary,panel);select.after(shell);select.hidden=true;select.addEventListener('change',sync);select.form?.addEventListener('reset',()=>setTimeout(sync));shell.addEventListener('keydown',e=>{if(e.key==='Escape'){shell.open=false;summary.focus()}});document.addEventListener('click',e=>{if(!shell.contains(e.target))shell.open=false});document.addEventListener('focusin',e=>{if(!shell.contains(e.target))shell.open=false})});
