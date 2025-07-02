/* === Инициализация GrapesJS === */
const messages = {
  ru: {
    assetManager: {
      addButton: 'Добавить изображение',
      inputPlh: 'http://path/to/the/image.jpg',
      modalTitle: 'Выбрать изображение',
      uploadTitle: 'Перетащите файлы сюда или нажмите, чтобы загрузить',
    },
    deviceManager: {
      device: 'Устройство',
      devices: {
        desktop: 'Десктоп',
        tablet: 'Планшет',
        mobileLandscape: 'Мобильный горизонтально',
        mobilePortrait: 'Мобильный вертикально',
      },
    },
    panels: {
      buttons: {
        titles: {
          preview: 'Предварительный просмотр',
          fullscreen: 'Полноэкранный режим',
          'sw-visibility': 'Просмотр компонентов',
          'export-template': 'Просмотреть код',
          'open-sm': 'Открыть диспетчер стилей',
          'open-tm': 'Настройки',
          'open-layers': 'Открыть диспетчер слоев',
          'open-blocks': 'Открытые блоки',
        },
      },
    },
    styleManager: {
      empty: 'Выберите элемент перед использованием Диспетчера стилей',
      layer: 'Слой',
      fileButton: 'Изображения',
      sectors: {
        general: 'Общее',
        layout: 'Макет',
        typography: 'Шрифты',
        decorations: 'Оформление',
        extra: 'Дополнительно',
        flex: 'Flex-атрибуты',
        dimension: 'Измерение',
      },
    },
  },
};

const editor = grapesjs.init({
  container : '#canvas',
  height    : '100%',
  openBlocksOnLoad:true,

  plugins:['gjs-preset-webpage','grapesjs-plugin-absolute'],
  pluginOpts:{
    'grapesjs-plugin-absolute':{grid:true,gridChars:20,snap:true}
  },

  assetManager:{
    assets:[
      'https://via.placeholder.com/600x400/92c952',
      'https://via.placeholder.com/400x300/771796',
      'https://via.placeholder.com/300x400/24f355',
      'https://via.placeholder.com/300/56a8c2'
    ]
  },

  i18n:{ locale:'ru', messages },

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
      chkRight=document.getElementById('anchorRight'),
      chkBottom=document.getElementById('anchorBottom');

const panel=editor.Panels.addPanel({id:'inline',el:bar,visible:false});

function addBtn(id, icon, title, run){
  editor.Commands.add(id,{run});
  editor.Panels.addButton('inline',{id,className:`fa ${icon}`,command:id,attributes:{title}});
}

addBtn('bold','fa-bold','Жирный',ed=>ed.runCommand('core:exec-command',{command:'bold'}));
addBtn('italic','fa-italic','Курсив',ed=>ed.runCommand('core:exec-command',{command:'italic'}));
addBtn('h1','fa-heading','H1',ed=>ed.runCommand('core:exec-command',{command:'h1'}));
addBtn('h2','fa-heading','H2',ed=>ed.runCommand('core:exec-command',{command:'h2'}));
addBtn('align-left','fa-align-left','Выровнять слева',ed=>{const s=ed.getSelected();s&&s.addStyle({'text-align':'left'});});
addBtn('align-center','fa-align-center','Выровнять по центру',ed=>{const s=ed.getSelected();s&&s.addStyle({'text-align':'center'});});
addBtn('align-right','fa-align-right','Выровнять справа',ed=>{const s=ed.getSelected();s&&s.addStyle({'text-align':'right'});});
addBtn('font-inc','fa-plus','Крупнее',ed=>{const s=ed.getSelected();if(!s)return;const fs=parseInt(s.getStyle()['font-size'])||16;s.addStyle({'font-size':(fs+2)+'px'});});
addBtn('font-dec','fa-minus','Мельче',ed=>{const s=ed.getSelected();if(!s)return;const fs=parseInt(s.getStyle()['font-size'])||16;s.addStyle({'font-size':Math.max(8,fs-2)+'px'});});
addBtn('link','fa-link','Ссылка',ed=>{const s=ed.getSelected();if(!s)return;const u=prompt('URL','https://');u&&s.addAttributes({href:u});});
addBtn('img-replace','fa-image','Картинка',ed=>{
  ed.runCommand('open-assets');
});

const imgBtn=panel.get('buttons').find(b=>b.id==='img-replace');

editor.on('component:selected', sel=>{
  if(!sel||sel.is('wrapper')) return bar.hidden=true;
  bar.hidden=false;
  imgBtn&&imgBtn.set('visible',sel.get('type')==='image');
  chkRight.checked=!!sel.getAttributes()['data-anchor-right'];
  chkBottom.checked=!!sel.getAttributes()['data-anchor-bottom'];
});

pick.oninput=e=>{const s=editor.getSelected();s&&s.addStyle({color:e.target.value});};

function normalizePos(sel){
  const frame=editor.Canvas.getFrameEl();
  const cw=frame.offsetWidth,ch=frame.offsetHeight;
  const fr=frame.getBoundingClientRect();
  const r=sel.view.el.getBoundingClientRect();
  const left=r.left-fr.left,top=r.top-fr.top;
  const w=r.width,h=r.height;
  const attr=sel.getAttributes();
  const st={width:(w/cw*100)+'%',height:(h/ch*100)+'%'};
  if(attr['data-anchor-right']){
    st.right=((cw-(left+w))/cw*100)+'%';
    st.left='';
  }else{
    st.left=(left/cw*100)+'%';
    st.right='';
  }
  if(attr['data-anchor-bottom']){
    st.bottom=((ch-(top+h))/ch*100)+'%';
    st.top='';
  }else{
    st.top=(top/ch*100)+'%';
    st.bottom='';
  }
  sel.addStyle(st);
}

chkRight.onchange=e=>{
  const s=editor.getSelected();if(!s)return;
  if(e.target.checked) s.addAttributes({'data-anchor-right':'1'});
  else s.removeAttributes('data-anchor-right');
  normalizePos(s);
};

chkBottom.onchange=e=>{
  const s=editor.getSelected();if(!s)return;
  if(e.target.checked) s.addAttributes({'data-anchor-bottom':'1'});
  else s.removeAttributes('data-anchor-bottom');
  normalizePos(s);
};

editor.on('component:drag:end', normalizePos);
editor.on('component:resize:end', normalizePos);

/* ───────────────────────────  API helpers  ─────────────────────────── */
async function api(m,p,b){
  const r=await fetch(p,{method:m,headers:{'Content-Type':'application/json'},
                         body:b?JSON.stringify(b):undefined});
  if(!r.ok) throw await r.text();
  return r.json();
}

/* ───────────────────────  CRUD проекта  ─────────────────────── */
let curPid = null;

async function listProjects(){
  const lst = await api('GET','/projects/');
  return lst.map(p=>`${p.id}: ${p.name}`).join('\n');
}

async function chooseId(msg){
  const list = await listProjects();
  const promptMsg = (list?list+'\n':'') + msg;
  const id = prompt(promptMsg, curPid||'1');
  return id?parseInt(id):null;
}

btnCreate.onclick = async ()=>{
  alert(await listProjects()||'Нет проектов');
  const name = prompt('Название проекта','Сайт');
  if(!name) return;
  const pr = await api('POST','/projects/',{name,data:{}});
  curPid = pr.id;
  // новый проект должен начинаться с чистого состояния
  editor.loadProjectData({pages: []});
  Pages.add({id:'index',name:'index',component:'<h1>Главная</h1>'});
  Pages.select('index');
  alert(`Создано (#${curPid})`);
};

btnLoad.onclick = async ()=>{
  const id = await chooseId('ID проекта для загрузки:');
  if(!id) return;
  curPid = id;
  try{
    const {data} = await api('GET',`/projects/${id}`);
    editor.loadProjectData(data.project || {pages: []});
    if(!Pages.getAll().length){
      Pages.add({id:'index',name:'index',component:'<h1>Главная</h1>'});
      Pages.select('index');
    }
  }catch{alert('Нет проекта');}
};

btnSave.onclick = async ()=>{
  if(!curPid){
    const id = await chooseId('Сохранить в проект ID:');
    if(!id) return; curPid=id;
  }
  await saveAll(curPid);
  alert('Сохранено');
};

btnExport.onclick = async ()=>{
  if(!curPid){alert('Сначала сохраните');return;}
  try{
    const blob = await (await fetch(`/projects/${curPid}/export`)).blob();
    const u = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'),{href:u,download:'site.zip'}).click();
    URL.revokeObjectURL(u);
  }catch{alert('Ошибка экспорта');}
};

/* сохраняем ВСЕ страницы проекта */
async function saveAll(pid){
  const proj={};                    // одна таблица с html/css каждой страницы
  for(const pg of Pages.getAll()){
    Pages.select(pg);
    proj[pg.getId()]={ html:editor.getHtml(), css:editor.getCss() };
  }
  await api('PUT',`/projects/${pid}`,{name:'Сайт '+pid,data:{project:editor.getProjectData(),pages:proj}});
}

/* fallback-блоки, если preset не подгрузился */
if(!grapesjs.plugins.get('gjs-preset-webpage')){
  const bm=editor.BlockManager;
  bm.add('txt',{label:'Текст',content:'<p>Введите текст</p>'});
  bm.add('img',{label:'Картинка',content:{type:'image'}});
  bm.add('hdr',{label:'Заголовок',category:'Базовые',
    content:'<h1>Заголовок</h1>'});
  bm.add('btn',{label:'Кнопка',category:'Базовые',
    content:{type:'link',content:'Кнопка',classes:['btn']}});
  bm.add('list',{label:'Список',category:'Базовые',
    content:'<ul><li>Пункт 1</li><li>Пункт 2</li></ul>'});
  bm.add('form',{label:'Форма',category:'Базовые',
    content:'<form><input placeholder="Имя"><br/><input type="email" placeholder="Email"><br/><textarea placeholder="Сообщение"></textarea><br/><button type="submit">Отправить</button></form>'});
}
