import { Input } from "../ui/Input";
import type { Client } from "../../types";

interface Props {
  clients: Client[];
  value: { name: string; cif: string; address: string };
  onChange: (value: { name: string; cif: string; address: string }) => void;
}

/** Cliente / C.I.F / Dirección con autocompletar nativo: al escribir un
 * nombre que coincide con un cliente guardado, rellena CIF y dirección solo
 * (siguen siendo editables). Para un cliente nuevo, esos dos campos se
 * escriben a mano y se guardan automáticamente para la próxima vez. */
export function ClientPicker({ clients, value, onChange }: Props) {
  function handleNameChange(name: string) {
    const match = clients.find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase());
    onChange(match ? { name: match.name, cif: match.cif, address: match.address } : { ...value, name });
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Input
          label="Cliente"
          list="clients-datalist"
          value={value.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Nombre del cliente"
          autoComplete="off"
        />
        <datalist id="clients-datalist">
          {clients.map((c) => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>
      </div>
      <Input
        label="C.I.F"
        value={value.cif}
        onChange={(e) => onChange({ ...value, cif: e.target.value })}
        placeholder="C.I.F / DNI"
      />
      <Input
        label="Dirección"
        value={value.address}
        onChange={(e) => onChange({ ...value, address: e.target.value })}
        placeholder="Dirección"
      />
    </div>
  );
}
