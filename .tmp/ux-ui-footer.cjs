const fs=require('fs');
const path='src/modules/chats/ChatControlPanel.tsx';
let s=fs.readFileSync(path,'utf8');
s=s.replace(/\s*<Button\s+size="sm"\s+startIcon=\{<Icon name="mdi:check" size=\{16\} \/>\}[\s\S]*?<\/Button>/g,'');
s=s.replace(/footer=\{modal !== "detalle"[^\n]+/,`footer={modal === "humano" || modal === "tomar" || modal === "bot" || modal === "transferir" ? (
          <div className="flex flex-wrap justify-end gap-2 px-5 py-4">
            <Button size="sm" variant="outline" disabled={cambio.isPending} onClick={() => setModal(null)}>Cancelar</Button>
            <Button size="sm" startIcon={<Icon name="mdi:check" size={16} />} loading={cambio.isPending}
              disabled={query.isError || (modal === "humano" ? !puedeAsumirHumano : modal === "tomar" ? !puedeTomar : modal === "bot" ? !puedeBot : !destino || !puedeTransferir || asesores.isError)}
              onClick={() => cambio.mutate(modal)}>
              {modal === "humano" ? "Confirmar toma del chat" : modal === "tomar" ? "Confirmar atención humana" : modal === "bot" ? "Confirmar asignación al bot" : "Confirmar transferencia"}
            </Button>
          </div>
        ) : undefined}`);
fs.writeFileSync(path,s);
