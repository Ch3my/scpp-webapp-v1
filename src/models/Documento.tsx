export type Documento = {
    id: number;
    monto: number;
    proposito: string;
    fecha: string;
    fk_tipoDoc: number;
    fk_categoria: number | null;
}
