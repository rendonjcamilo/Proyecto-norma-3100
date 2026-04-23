"""
Extrae los criterios transversales de la Norma 3100 (texto UTF-8)
y genera SQL UPDATE para corregir los nombres truncados en la BD.
"""

import re

TXT_FILE = "norma3100_utf8.txt"
OUT_FILE = "update_criteria_names.sql"

# Rangos de líneas (1-indexed) de cada estándar transversal en el TXT
STANDARDS = [
    ("TSTH",  5928, 5967),   # Talento Humano
    ("TSINF", 5968, 6145),   # Infraestructura
    ("TSDOT", 6146, 6207),   # Dotación
    ("TSMD",  6208, 6255),   # Medicamentos, Dispositivos Médicos e Insumos
    ("TSPP",  6256, 6408),   # Procesos Prioritarios
    ("TSHCR", 6409, 6505),   # Historia Clínica y Registros
    ("TSID",  6506, 6537),   # Interdependencia
]

# Encabezados de página que deben eliminarse del texto
PAGE_NOISE = [
    r"RESOLUCIÓN NÚMERO",
    r"DE 2019",
    r"Página \d+ de 230",
    r"Continuación de la resolución:.*",
]

def clean_line(line):
    line = line.strip()
    for pattern in PAGE_NOISE:
        if re.match(pattern, line):
            return ""
    return line

def load_section(lines, start, end):
    """Carga líneas de un rango (1-indexed) y limpia ruido de página."""
    section_lines = []
    for i in range(start - 1, min(end, len(lines))):
        cleaned = clean_line(lines[i])
        if cleaned:
            section_lines.append(cleaned)
    return " ".join(section_lines)

def parse_criteria(text, prefix):
    """
    Extrae criterios numerados del bloque de texto.
    Busca patrones como: "1. Texto..." "2. Texto..." etc.
    Ignora la primera línea del encabezado del estándar.
    """
    # Eliminar encabezado del estándar (e.g., "11.1.1. Estándar de talento humano")
    text = re.sub(r"11\.\d+\.\d+\. Estándar de[^0-9]+", "", text, flags=re.IGNORECASE)

    # Buscar criterios numerados
    pattern = r"(?<!\d)(\d+)\.\s+([^0-9].*?)(?=\s+(?<!\d)\d+\.\s+[^0-9]|$)"
    matches = re.findall(pattern, text, re.DOTALL)

    criteria = {}
    for num_str, text_body in matches:
        num = int(num_str)
        code = f"{prefix}-{num:03d}"
        # Limpiar texto: colapsar espacios múltiples
        clean_text = re.sub(r"\s+", " ", text_body).strip()
        # Eliminar el número del criterio si quedó al inicio del texto
        clean_text = re.sub(r"^\d+\.\s*", "", clean_text)
        criteria[code] = clean_text

    return criteria

def main():
    with open(TXT_FILE, encoding="utf-8", errors="replace") as f:
        lines = f.readlines()

    all_criteria = {}

    for prefix, start, end in STANDARDS:
        text = load_section(lines, start, end)
        criteria = parse_criteria(text, prefix)
        print(f"{prefix}: encontrados {len(criteria)} criterios")
        all_criteria.update(criteria)

    # Generar SQL
    sql_lines = [
        "-- Actualización de nombres de criterios truncados (Norma 3100)",
        "-- Generado automáticamente desde RESOLUCION_3100_EDITABLE.pdf",
        "",
    ]

    count = 0
    for code, name in sorted(all_criteria.items()):
        if len(name) > 255 or True:  # Actualizamos todos para tener el texto completo
            escaped = name.replace("'", "''")
            sql_lines.append(
                f"UPDATE evaluation_criteria SET name = '{escaped}' WHERE code = '{code}';"
            )
            count += 1

    sql_lines.append(f"\n-- Total: {count} criterios actualizados")

    with open(OUT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))

    print(f"\nGenerado {OUT_FILE} con {count} UPDATEs")

if __name__ == "__main__":
    main()
