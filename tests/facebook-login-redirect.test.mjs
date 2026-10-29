import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(fs.readFileSync(new URL('../src/modules/settings/whatsapp/facebook-login-redirect.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function fixture() {
 const calls=[]; const timers=new Map(); let counter=0;
 class Form { constructor(action,values=[]) {this.action=action;this.values=values;} submit() {calls.push(['submit',this.action]);} }
 class FormData {constructor(form){this.form=form;} entries(){return this.form.values[Symbol.iterator]();}}
 const window={location:{href:'https://crm.example.test/settings/whatsapp'},open:(...args)=>{calls.push(['open',...args]);return 'popup';},setTimeout:fn=>{timers.set(++counter,fn);return counter;},clearTimeout:id=>timers.delete(id)};
 const exports={}; vm.runInNewContext(source,{exports,window,HTMLFormElement:Form,FormData,URL});
 return {capture:exports.captureFacebookLoginRedirect,window,Form,calls,timers};
}
const uri='https://staticxx.facebook.com/x/connect/xd_arbiter/?version=46#cb=synthetic&origin=https%3A%2F%2Fcrm.example.test';
function url({app='123',config='456',redirect=uri,host='www.facebook.com'}={}) {const u=new URL('https://'+host+'/v26.0/dialog/oauth');u.searchParams.set('app_id',app);u.searchParams.set('config_id',config);u.searchParams.set('redirect_uri',redirect);return u.toString();}

test('captura URI exacta GET y conserva URL, retorno y restaura window.open',()=>{
 const f=fixture(),original=f.window.open,seen=[];f.capture('123','456',x=>seen.push(x));const request=url();
 assert.equal(f.window.open(request,'popup','width=500'),'popup');assert.deepEqual(seen,[uri]);
 assert.deepEqual(f.calls,[['open',request,'popup','width=500']]);assert.equal(f.window.open,original);assert.equal(f.timers.size,0);
});
test('captura formulario POST después de about:blank y mantiene el submit nativo',()=>{
 const f=fixture(),original=f.Form.prototype.submit,seen=[];f.capture('123','456',x=>seen.push(x));f.window.open('about:blank');
 new f.Form('https://www.facebook.com/v26.0/dialog/oauth',[['client_id','123'],['config_id','456'],['redirect_uri',uri]]).submit();
 assert.deepEqual(seen,[uri]);assert.equal(f.Form.prototype.submit,original);assert.equal(f.calls.at(-1)[0],'submit');
});
test('ignora otros dominios, otras aplicaciones, otras configuraciones y otras rutas',()=>{
 const f=fixture(),seen=[];const stop=f.capture('123','456',x=>seen.push(x));
 for(const request of [url({host:'facebook.com.evil.test'}),url({app:'999'}),url({config:'999'}),'https://www.facebook.com/other'])f.window.open(request);
 assert.deepEqual(seen,[]);assert.equal(f.calls.length,4);stop();
});
test('restaura los métodos al vencer el plazo sin impedir abrir el popup',()=>{
 const f=fixture(),open=f.window.open,submit=f.Form.prototype.submit;f.capture('123','456',()=>{});[...f.timers.values()][0]();
 assert.equal(f.window.open,open);assert.equal(f.Form.prototype.submit,submit);assert.equal(f.window.open(url()),'popup');
});
test('cancelar restaura ambos métodos y elimina el temporizador',()=>{
 const f=fixture(),open=f.window.open,submit=f.Form.prototype.submit;const stop=f.capture('123','456',()=>{});stop();stop();
 assert.equal(f.window.open,open);assert.equal(f.Form.prototype.submit,submit);assert.equal(f.timers.size,0);
});
