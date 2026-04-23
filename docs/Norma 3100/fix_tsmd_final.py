"""
Genera SQL para:
1. Reparar TSMD-038..047 (textos incorrectos por update previo)
2. Insertar 3 criterios faltantes (Excel-005, 018, 022) como TSMD-057/058/059
3. Corregir Interdependencia: el Excel usa TSINT — verificar que BD coincide
"""
import openpyxl

EXCEL = "Archivo_Consolidaddo_Resolucion_3100-2019.xlsx"
OUT   = "fix_tsmd_final.sql"

def load_sheet(wb, sheet, prefix):
    ws = wb[sheet]
    rows = []
    for row in ws.iter_rows(values_only=True):
        col0 = str(row[0]).strip().upper() if row[0] else ''
        col1 = str(row[1]).strip() if row[1] else ''
        if col0 == prefix.upper() and col1:
            rows.append(col1)
    return rows

def main():
    wb = openpyxl.load_workbook(EXCEL, read_only=True, data_only=True)

    # --- TSMD: mapeo correcto (offset +3 a partir de Excel-038) ---
    tsmd = load_sheet(wb, '11.1.4MD', 'TSMD')
    # tsmd[0] = Excel-001, tsmd[37] = Excel-038, tsmd[40] = Excel-041...

    # DB TSMD-NNN = tsmd[NNN-1+offset] donde offset=3 a partir de DB-038
    # DB-001..037 = Excel-001..037 (sin offset, los 3 faltantes son 005,018,022)
    # DB-038..056 = Excel-041..059

    # Criterios dañados que necesitan corrección (DB-038 a DB-047)
    damaged = {
        38: tsmd[40],  # Excel-041: 4.13. Seguimiento...
        39: tsmd[41],  # Excel-042: 5. El prestador...control especial
        40: tsmd[42],  # Excel-043: 6. El prestador...farmacovigilancia
        41: tsmd[43],  # Excel-044: 7. El prestador...reservas
        44: tsmd[46],  # Excel-047: 10. El prestador...paquete derrames
        45: tsmd[47],  # Excel-048: 11. En los servicios...carro de paro
        47: tsmd[49],  # Excel-050: 13. Si el prestador...gestión pre transfusional
    }

    # 3 criterios faltantes en BD (Excel-005, 018, 022)
    missing = [
        ("TSMD-057", tsmd[4]),   # Excel-005: 1.4. Lote
        ("TSMD-058", tsmd[17]),  # Excel-018: 2.8. Lote
        ("TSMD-059", tsmd[21]),  # Excel-022: 3.2. Marca
    ]

    # --- TSINT: verificar que el prefijo en Excel coincide con BD ---
    tsint = load_sheet(wb, '11.1.7INT', 'TSINT')

    sql = [
        "-- FIX TSMD: reparar textos dañados por update previo y agregar faltantes",
        "-- FIX TSINT: verificar existencia",
        "",
        "-- 1. Reparar TSMD con textos incorrectos",
    ]

    for db_num, text in sorted(damaged.items()):
        code = f"TSMD-{db_num:03d}"
        escaped = text.replace("'", "''")
        sql.append(f"UPDATE evaluation_criteria SET name = '{escaped}' WHERE code = '{code}';")

    sql.append("")
    sql.append("-- 2. Insertar 3 criterios TSMD faltantes")
    sql.append("-- (requieren standard_id y service_id del estandar TSMD existente)")
    sql.append("""INSERT INTO evaluation_criteria (code, number, name, description, standard_id, service_id, is_transversal, complexity)
SELECT
  v.code,
  v.num,
  v.name,
  '',
  ec.standard_id,
  ec.service_id,
  TRUE,
  'simple'
FROM (VALUES""")

    vals = []
    for code, text in missing:
        num = code.split('-')[1]
        escaped = text.replace("'", "''")
        vals.append(f"  ('{code}', '{num}', '{escaped}')")
    sql.append(",\n".join(vals))
    sql.append(""") AS v(code, num, name)
JOIN evaluation_criteria ec ON ec.code = 'TSMD-001'
WHERE NOT EXISTS (SELECT 1 FROM evaluation_criteria WHERE code = v.code);""")

    sql.append("")
    sql.append("-- 3. TSINT: mostrar los 6 criterios del Excel para verificacion")
    for i, text in enumerate(tsint, 1):
        sql.append(f"-- Excel TSINT-{i:03d}: {text[:100]}")

    sql.append("")
    sql.append("-- Verificar que BD tiene TSINT:")
    sql.append("-- SELECT code, SUBSTRING(name,1,80) FROM evaluation_criteria WHERE code LIKE 'TSINT-%' ORDER BY code;")

    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(sql))

    print(f"Generado {OUT}")
    print(f"  - {len(damaged)} TSMD a reparar")
    print(f"  - {len(missing)} TSMD a insertar")
    print(f"  - {len(tsint)} TSINT en Excel")

if __name__ == "__main__":
    main()
