/* === Инициализация GrapesJS === */
const editor = grapesjs.init({
  container : '#gjs',
  height    : '100%',
  openBlocksOnLoad:true,

  plugins:['gjs-preset-webpage','grapesjs-plugin-absolute'],
  pluginOpts:{
    'grapesjs-plugin-absolute':{grid:true,gridChars:20,snap:true}
  },

  i18n:{ locale:'ru', /* … оставьте здесь ваши переводы … */ },

  storageManager:{autoload:false,autosave:false},
});

/* ────────────────────────────────  ПАНЕЛЬ СТРАНИЦ  ───────────────────────────── */
const Pages   = editor.Pages;
const selBox  = document.getElementById('pageSelect');
const btnAdd  = document.getElementById('pageAdd');
const btnDel  = document.getElementById('pageDel');

function fillSelect(){
  selBox.innerHTML='';
  Pages.getAll().forEach(p=>{
    const o=document.createElement('option');
    o.value=p.getId();
    o.textContent=p.getName();
    if(Pages.getSelected()===p) o.selected=true;
    selBox.appendChild(o);
  });
}

/* первая страница, если пусто */
if(!Pages.getAll().length){
  Pages.add({id:'index',name:'index',component:'<h1>Главная</h1>'});
  Pages.select('index');
}
fillSelect();

/* события */
editor.on('page:add page:remove page:update', fillSelect);
editor.on('page', fillSelect);

selBox.onchange = ()=> Pages.select(selBox.value);

btnAdd.onclick = ()=>{
  const id = prompt('Имя новой страницы (без .html):','about');
  if(!id) return;
  if(Pages.get(id)){alert('Уже есть');return;}
  Pages.add({id,name:id,component:'<h1>'+id+'</h1>'});
  Pages.select(id);
};

btnDel.onclick = ()=>{
  const cur=Pages.getSelected();
  if(!cur){alert('Не выбрано');return;}
  if(cur.getId()==='index'){alert('index удалять нельзя');return;}
  if(confirm('Удалить '+cur.getName()+'?')) Pages.remove(cur);
};

/* ───── dropdown pages для href ───── */
const pageOptions = ()=> Pages.getAll().map(p=>({value:p.getId()+'.html',name:p.getName()}));

editor.TraitManager.addType('link-pages',{
  extends:'href',
  onEvent(){ this.model.set('options',pageOptions()); }
});

/* блок «Ссылка» */
editor.BlockManager.add('int-link',{
  label:'Ссылка',
  category:'Базовые',
  content:{type:'link',content:'перейти',traits:[
    {type:'text',label:'Текст',name:'content'},
    {type:'link-pages',label:'Страница',name:'href'}
  ]}
});

/* ─────────────────────────────  МИНИ-ПАНЕЛЬ  ───────────────────────────── */
const bar=document.getElementById('inlineToolbar'),
      pick=document.getElementById('colorPick'),
      imgBtn=document.getElementById('imgReplace');

editor.on('component:selected', sel=>{
  if(!sel||sel.is('wrapper')) return bar.hidden=true;
  const r=sel.view.el.getBoundingClientRect();
  bar.style.top =(r.top-50)+'px';
  bar.style.left=(r.left+r.width/2)+'px';
  bar.hidden=false;
  imgBtn.hidden=sel.get('type')!=='image';
});
bar.onclick = e=>{
  const cmd=e.target.dataset.cmd;
  cmd && editor.Commands.run('core:exec-command',{command:cmd});
};
pick.oninput=e=>{
  const s=editor.getSelected();
  s && s.addStyle({color:e.target.value});
};
imgBtn.onclick=()=>{
  const s=editor.getSelected();if(!s)return;
  const i=document.createElement('input');
  i.type='file';i.accept='image/*';
  i.onchange=ev=>{
    const f=ev.target.files[0],r=new FileReader();
    r.onload=e2=>s.set('src',e2.target.result);
    r.readAsDataURL(f);
  };
  i.click();
};

/* ───────────────────────────  API helpers  ─────────────────────────── */
async function api(m,p,b){
  const r=await fetch(p,{method:m,headers:{'Content-Type':'application/json'},
                         body:b?JSON.stringify(b):undefined});
  if(!r.ok) throw await r.text();
  return r.json();
}

/* ───────────────────────  CRUD проекта  ─────────────────────── */
btnCreate.onclick=async()=>{try{await api('POST','/projects/',{name:'Сайт',data:{}});alert('Создано (#1)');}catch{alert('Уже есть');}};
btnLoad.onclick  =async()=>{try{const {data}=await api('GET','/projects/1');data.project&&editor.loadProjectData(data.project);}catch{alert('Нет проекта');}};
btnSave.onclick  =async()=>{await saveAll();alert('Сохранено');};
btnExport.onclick=async()=>{try{const blob=await (await fetch('/projects/1/export')).blob();
  const u=URL.createObjectURL(blob);Object.assign(document.createElement('a'),{href:u,download:'site.zip'}).click();
  URL.revokeObjectURL(u);}catch{alert('Сначала сохраните');}};

/* сохраняем ВСЕ страницы проекта */
async function saveAll(){
  const proj={};                    // одна таблица с html/css каждой страницы
  for(const pg of Pages.getAll()){
    Pages.select(pg);
    proj[pg.getId()]={ html:editor.getHtml(), css:editor.getCss() };
  }
  await api('PUT','/projects/1',{name:'Сайт',data:{project:editor.getProjectData(),pages:proj}});
}

/* fallback-блоки, если preset не подгрузился */
if(!grapesjs.plugins.get('gjs-preset-webpage')){
  const bm=editor.BlockManager;
  bm.add('txt',{label:'Текст',content:'<p>Введите текст</p>'});
  bm.add('img',{label:'Картинка',content:{type:'image'}});
}
