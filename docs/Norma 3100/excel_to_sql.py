"""
Lee el Excel de la Resolucion 3100 y genera SQL UPDATE para los criterios truncados.
Estructura del Excel: fila 3 en adelante = criterios (col0=prefijo, col1=texto completo)
Los codigos en BD son PREFIX-NNN donde NNN = posicion secuencial de la fila (1-based).
"""

import openpyxl

EXCEL = "Archivo_Consolidaddo_Resolucion_3100-2019.xlsx"
OUT   = "update_from_excel.sql"

# Hoja -> prefijo de codigo en BD
SHEETS = [
    ("11.1.1TH",   "TSTH"),
    ("11.1.2.INF",  "TSINF"),
    ("11.1.3.DOT",  "TSDOT"),
    ("11.1.4MD",    "TSMD"),
    ("11.1.5.PP",   "TSPP"),
    ("11.1.6.HCR",  "TSHCR"),
    ("11.1.7INT",   "TSID"),
]

# Codigos truncados que necesitan correccion (los 68 identificados)
NEEDS_FIX = {
    "TSDOT-009","TSDOT-014","TSDOT-027","TSDOT-028","TSDOT-032","TSDOT-034",
    "TSDOT-038","TSDOT-053","TSDOT-056","TSDOT-063","TSHCR-002","TSHCR-003",
    "TSHCR-009","TSHCR-010","TSHCR-027","TSHCR-049","TSINF-004","TSINF-005",
    "TSINF-006","TSINF-013","TSINF-015","TSINF-022","TSINF-025","TSINF-028",
    "TSINF-033","TSINF-038","TSINF-039","TSINF-145","TSINF-151","TSINF-153",
    "TSINF-154","TSINF-182","TSINF-188","TSINF-193","TSINF-195","TSMD-038",
    "TSMD-039","TSMD-040","TSMD-041","TSMD-044","TSMD-045","TSMD-047",
    "TSPP-003","TSPP-019","TSPP-021","TSPP-044","TSPP-046","TSPP-048",
    "TSPP-080","TSPP-082","TSPP-083","TSPP-088","TSPP-104","TSPP-109",
    "TSTH-001","TSTH-003","TSTH-007","TSTH-008","TSTH-010","TSTH-011",
    "TSTH-013","TSTH-014","TSTH-015","TSTH-018","TSTH-021","TSTH-022",
    "TSTH-023","TSTH-025",
}

def main():
    wb = openpyxl.load_workbook(EXCEL, read_only=True, data_only=True)
    sql = [
        "-- UPDATE de criterios desde Excel Resolucion 3100-2019",
        "-- Solo los 68 criterios con nombre truncado a 255 chars",
        "",
    ]
    updated = 0
    not_in_excel = list(NEEDS_FIX)  # los que no se encuentren

    for sheet_name, prefix in SHEETS:
        ws = wb[sheet_name]
        row_num = 0
        for row in ws.iter_rows(values_only=True):
            # Saltar las 3 filas de encabezado
            col0 = row[0] if row[0] else ""
            col1 = row[1] if row[1] else ""

            # Fila de datos: col0 debe ser el prefijo del estandar
            if str(col0).strip().upper() != prefix.upper():
                continue

            row_num += 1
            code = f"{prefix}-{row_num:03d}"
            text = str(col1).strip()

            if not text or text == "None":
                continue

            if code in NEEDS_FIX:
                escaped = text.replace("'", "''")
                sql.append(f"UPDATE evaluation_criteria SET name = '{escaped}' WHERE code = '{code}';")
                updated += 1
                if code in not_in_excel:
                    not_in_excel.remove(code)

    sql.append(f"\n-- Total actualizados: {updated}")
    if not_in_excel:
        sql.append(f"-- Codigos no encontrados en Excel: {', '.join(sorted(not_in_excel))}")

    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(sql))

    print(f"Generado {OUT}: {updated} UPDATEs")
    if not_in_excel:
        print(f"No encontrados: {sorted(not_in_excel)}")

if __name__ == "__main__":
    main()
