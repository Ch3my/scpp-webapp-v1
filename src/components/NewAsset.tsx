import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CirclePlus, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { DatePicker } from "./DatePicker"
import { DateTime } from "luxon";
import { useAppState } from "@/AppState"
import Resizer from "react-image-file-resizer";
import { toast } from "sonner";

export function NewAsset({ onAssetSaved }: { onAssetSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState<DateTime>(DateTime.now());
  const [categoria, setCategoria] = useState<number>(0);
  const [image, setImage] = useState<string>("");
  const { apiPrefix, sessionId, categorias } = useAppState();

  const handleImageUpload = (file: File) => {
    Resizer.imageFileResizer(
      file,
      1920,
      1920,
      "JPEG",
      90,
      0,
      (uri) => {
        setImage(uri as string)
        return uri
      },
      "base64"
    );
  };

  const handleSubmit = async () => {
    setBusy(true)
    if (!descripcion || !categoria || !image) {
      toast("Faltan Datos");
      setBusy(false)
      return;
    }

    try {
      await fetch(`${apiPrefix}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionHash: sessionId, descripcion, fecha, fk_categoria: categoria, assetData: image }),
      }).then(response => response.json())
      toast('Asset guardado');
      setOpen(false);
      onAssetSaved()
    } catch (error) {
      console.error(error);
    }
    setBusy(false)
  };

  useEffect(() => {
    if (!open) {
      setTimeout(()=>{
        setDescripcion("")
        setFecha(DateTime.now())
        setCategoria(0)
        setImage("")
       }, 100)
    }
  }, [open])

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button variant="outline"><CirclePlus /></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Asset</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 items-center" style={{ gridTemplateColumns: '1fr 3fr' }}>
          <Label>Descripcion</Label>
          <Input id="name" onChange={e => setDescripcion(e.target.value)} />
          <Label>Fecha</Label>
          <DatePicker
            value={fecha}
            onChange={(e) => e && setFecha(e)}
          />
          <Label>Categoria</Label>
          <Select value={String(categoria)} onValueChange={(e) => setCategoria(Number(e))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectGroup>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={String(categoria.id)}>
                    {categoria.descripcion}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Label>Imagen</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImageUpload(file)
              }
            }}
          />
        </div>
        {image && (
          <div className="mt-4">
            <Label>Preview</Label>
            <img src={image} alt="Preview" style={{ maxWidth: "100%", maxHeight: "150px" }} />
          </div>
        )}
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}