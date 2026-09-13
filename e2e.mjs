import puppeteer from 'puppeteer';
const B='http://localhost:4699', DIR=process.argv[2];
const br=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
const p=await br.newPage(); await p.setViewport({width:1360,height:900,deviceScaleFactor:1.2});
const log=[];
// 1) экран входа
await p.goto(B+'/',{waitUntil:'networkidle2'}); await new Promise(r=>setTimeout(r,800));
await p.screenshot({path:DIR+'/e2e-1-login.png'});
log.push('вход: '+(await p.$eval('body',b=>b.innerText.includes('Вход в систему')?'OK':'нет')));
// логин админом
await p.type('input[type=email]','admin@sadovnicheskaya.ru'); await p.type('input[type=password]','test12345');
await p.click('button[type=submit]'); await new Promise(r=>setTimeout(r,2500));
await p.screenshot({path:DIR+'/e2e-2-dashboard.png'});
log.push('дашборд после логина: '+(await p.$eval('body',b=>b.innerText.includes('Обзор')||b.innerText.includes('Законтрактовано')?'OK':'нет')));
log.push('пункт «Компании платформы» (superadmin): '+(await p.$eval('body',b=>b.innerText.includes('Компании платформы')?'ВИДЕН':'нет')));
// 2) админка
await p.goto(B+'/#/admin',{waitUntil:'networkidle2'}); await new Promise(r=>setTimeout(r,1500));
await p.screenshot({path:DIR+'/e2e-3-admin.png'});
log.push('админка (Садовническая в списке): '+(await p.$eval('body',b=>b.innerText.includes('Садовническая')?'OK':'нет')));
// 3) регистрация (в новой вкладке, чистая сессия)
const p2=await br.newPage(); await p2.setViewport({width:1360,height:900,deviceScaleFactor:1.2});
await p2.evaluateOnNewDocument(()=>{localStorage.clear();});
await p2.goto(B+'/#/register?plan=start',{waitUntil:'networkidle2'}); await new Promise(r=>setTimeout(r,1200));
await p2.screenshot({path:DIR+'/e2e-4-register.png'});
log.push('регистрация (тариф Старт, форма): '+(await p2.$eval('body',b=>b.innerText.includes('Регистрация компании')&&b.innerText.includes('Старт')?'OK':'нет')));
// заполняем и регистрируем
await p2.type('input[placeholder="ООО «СтройГрад»"]','ООО Тест E2E');
await p2.type('input[type=email]','e2e@test.ru'); await p2.type('input[type=password]','e2epass123');
await p2.click('button[type=submit]'); await new Promise(r=>setTimeout(r,2500));
await p2.screenshot({path:DIR+'/e2e-5-afterreg.png'});
log.push('после регистрации start (пейволл ожидается): '+(await p2.$eval('body',b=>b.innerText.includes('ожидает активации')||b.innerText.includes('подписк')?'ПЕЙВОЛЛ OK':(b.innerText.includes('Обзор')?'приложение':'?'))));
await br.close();
console.log(log.map(l=>'  '+l).join('\n'));
