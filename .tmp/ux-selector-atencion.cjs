const fs=require('fs');
const path='src/modules/chats/ChatControlPanel.tsx';
let s=fs.readFileSync(path,'utf8');
s=s.replace('import ModalHeading', 'import Select from "@/src/components/form/Select";\nimport ModalHeading');
const start=s.indexOf('                <div className="flex flex-wrap gap-2">');
const end=s.indexOf('                </div>',start)+ '                </div>'.length;
if(start<0 || end<start) throw Error('No se encontró grupo de acciones');
let actions=s.slice(start,end).replace('className="flex flex-wrap gap-2"','className="flex flex-wrap justify-end gap-2 px-5 py-4"');
actions=actions.replace('size="sm" onClick={() => abrir("humano")}','size="sm" startIcon={<Icon name="mdi:hand-back-right-outline" size={16} />} onClick={() => abrir("humano")}');
actions=actions.replace('size="sm" onClick={() => abrir("tomar")}','size="sm" startIcon={<Icon name="mdi:account-check-outline" size={16} />} onClick={() => abrir("tomar")}');
for(const [mode,icon] of [['bot','mdi:robot-outline'],['transferir','mdi:account-switch-outline'],['historial','mdi:history']]) actions=actions.replace(`onClick={() => abrir("${mode}")}`,`startIcon={<Icon name="${icon}" size={16} />}\n                      onClick={() => abrir("${mode}")}`);
s=s.slice(0,start)+s.slice(end);
s=s.replace('        ) : undefined}\n        className="max-w-xl"','        ) : modal === "detalle" && c && !query.isError ? (\n'+actions+'\n        ) : undefined}\n        className="max-w-xl"');
s=s.replace(/<label className="block">\s*Asesor\s*<select[\s\S]*?<\/select>\s*<\/label>/,`<div>
                    <label htmlFor="control-atencion-asesor" className="mb-2 block font-medium">Asesor</label>
                    <Select
                      id="control-atencion-asesor"
                      value={destino}
                      onChange={setDestino}
                      placeholder="Selecciona un asesor"
                      options={(asesores.data ?? []).map((p) => ({value: p.id, label: nombreControl(p)}))}
                      disabled={cambio.isPending}
                      required
                    />
                  </div>`);
fs.writeFileSync(path,s);
