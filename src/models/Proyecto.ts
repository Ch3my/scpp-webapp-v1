export type Proyecto = {
    id: number;
    nombre: string;
    descripcion: string | null;
    orden?: number;
    /** Reference-only status flag, never restricts any action */
    activo: boolean;
    /** 'yyyy-MM-dd' - earliest fecha among linked gastos. Server-computed, read-only. */
    initialDate: string | null;
    /** 'yyyy-MM-dd' - latest fecha among linked gastos. Server-computed, read-only. */
    finalDate: string | null;
}

export type CreateProyecto = {
    nombre: string;
    descripcion?: string | null;
    orden?: number;
    /** Defaults to true on the backend if omitted */
    activo?: boolean;
}

export type UpdateProyecto = {
    id: number;
    nombre: string;
    descripcion?: string | null;
    orden?: number;
    /** Required: PUT is a full replace, not a partial patch */
    activo: boolean;
}
