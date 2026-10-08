import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/responsive-dialog"
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
import { resizeImage } from "@/lib/resize-image";
import { toast } from "sonner";
import { useCreateAsset } from "@/api/hooks";
import { getApiErrorMessage } from "@/lib/api-errors";

export function NewAsset({ onAssetSaved }: { onAssetSaved?: () => void }) {
  const createAsset = useCreateAsset();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState<DateTime>(DateTime.now());
  const [categoria, setCategoria] = useState<number>(0);
  const [image, setImage] = useState<string>("");
  const { categorias } = useAppState();

  const handleImageUpload = async (file: File) => {
    // The accept list below lets non-images through, so check the real type
    // before handing anything to createImageBitmap.
    if (!file.type.startsWith("image/")) {
      toast.error("Ese archivo no es una imagen");
      return;
    }
    try {
      const uri = await resizeImage(file, 1920, 0.9);
      setImage(uri);
    } catch {
      toast.error("No se pudo leer la imagen");
    }
  };

  const handleSubmit = async () => {
    setBusy(true)
    if (!descripcion || !categoria || !image) {
      toast("Faltan Datos");
      setBusy(false)
      return;
    }

    try {
      // The API wants an ISO string. This used to pass the DateTime object and
      // rely on JSON.stringify calling toJSON(); toISO() is the same value, said out loud.
      await createAsset.mutateAsync({
        descripcion,
        fecha: fecha.toISO() ?? "",
        fk_categoria: categoria,
        assetData: image,
      });
      toast('Asset guardado');
      setOpen(false);
      onAssetSaved?.()
    } catch (error) {
      // Previously only logged, leaving the dialog open with no explanation
      toast.error('Error al guardar el asset: ' + getApiErrorMessage(error));
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
      <DialogContent className="sm:max-w-106.25">
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
          {/*
            * accept is "image/*,text/plain", not plain "image/*": Android hides
            * the Camera entry from the picker for a single-type image accept,
            * and a second, unrelated type brings the full chooser back. The
            * cost is that a text file can be selected, which handleImageUpload
            * rejects.
            */}
          <Input
            type="file"
            accept="image/*,text/plain"
            className="min-h-11 sm:min-h-0"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                await handleImageUpload(file)
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