import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/modules/settings/whatsapp/signup-event.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL});
const parse=exports.parseSignupEvent;
const data={type:'WA_EMBEDDED_SIGNUP',event:'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING',data:{waba_id:'123'}};
test('acepta evento de coexistencia sin teléfono desde www y business.facebook.com',()=>{
 for(const origin of ['https://www.facebook.com','https://business.facebook.com']){const result=parse(origin,JSON.stringify(data));assert.equal(result.wabaId,'123');assert.equal(result.phoneNumberId,undefined);}
});
test('también analiza FINISH normal para que el servidor compruebe coexistencia',()=>{const result=parse('https://business.facebook.com',{...data,event:'FINISH',data:{waba_id:'123',phone_number_id:'456'}});assert.equal(result.event,'FINISH');assert.equal(result.phoneNumberId,'456');});
test('rechaza dominios suplantados, HTTP y mensajes ajenos',()=>{
 for(const origin of ['https://evilfacebook.com','https://facebook.com.evil.test','http://www.facebook.com','https://www.facebook.com:444'])assert.equal(parse(origin,data),null);
 for(const payload of ['bad JSON',null,{type:'OTHER',event:'FINISH'}, {type:'WA_EMBEDDED_SIGNUP'}])assert.equal(parse('https://www.facebook.com',payload),null);
});
test('preserva cancelación, error y finalización sin teléfono',()=>{for(const event of ['CANCEL','ERROR','FINISH_ONLY_WABA'])assert.equal(parse('https://www.facebook.com',{type:'WA_EMBEDDED_SIGNUP',event}).event,event);});
