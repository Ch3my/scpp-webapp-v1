export type Documento = {
    id: number;
    monto: number;
    proposito: string;
    fecha: string;
    fk_tipoDoc: number;
    fk_categoria: number | null;
    fk_proyecto?: number | null;
    /** Resolved object, present in GET responses only */
    proyecto?: { id: number; nombre: string } | null;
}
