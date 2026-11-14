/** Uygulama kökünden bir dosya yolu: oyun sitenin alt klasöründe (örn. /kayip-pilot/) yayınlansa da doğru çalışır. */
export const yol = (p: string) => import.meta.env.BASE_URL + p.replace(/^\//, '')
