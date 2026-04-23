"""
Para cada criterio truncado en la BD, busca el texto completo en el PDF
y genera SQL UPDATE. Usa los primeros ~60 chars para localizar el match.
"""

import re
import unicodedata

TXT_FILE = "norma3100_utf8.txt"
OUT_FILE = "fix_truncated_criteria.sql"

# Criterios truncados: code -> primeros chars del texto en BD
TRUNCATED = {
"TSDOT-009": "2.1. Programa de mantenimiento preventivo de los equipos biomédicos, que incluya el cumplimiento de las recomendaciones establecidas por el fabricante o de acuerdo con el protocolo de mantenimiento",
"TSDOT-014": "6. El mantenimiento de los equipos biomédicps es ejecutado por el talento humano profesional",
"TSDOT-027": "9. Las instituciones prestadoras de servicios de salud con servicios de hospitalización",
"TSDOT-028": "10.Las instituciones prestadoras de servicios de salud con servicios de cuidado intensivo pediátrico y adulto que adicionalmente habiliten el servicio quirúrgico de neurocirugía",
"TSDOT-032": "13.1. Nevera o depósito frío para el almacenamiento de sangre o de sus componentes con sistema de control de temperatura",
"TSDOT-034": "13.3. Congelador para la conservación de plasma o crioprecipitados con registro y control de",
"TSDOT-038": "15.En los servicios de los grupos quirúrgico, internación y el servicio de urgencias, el prestador de servicios de salud cuenta con accesorios para garantizar empaque cerrado y transporte",
"TSDOT-053": "17.1.1.4. Si el prestador de servicios de salud realiza consulta dermatológica en la modalidad de telemedicina",
"TSDOT-056": "17.1.2.2. El software utilizado se adapta al cambio en la disponibilidad del ancho de banda sin perder conexión",
"TSDOT-063": "17.2.2. Las pantallas o monitores grado médico utilizados para el despliegue de imágenes cuentan con una distancia máxima de 0.19 milímetros",
"TSHCR-002": "2. El prestador de servicios de salud cuenta con procedimientos para utilizar una historia única y para el registro de entrada y salida de historias del archivo físico",
"TSHCR-003": "3. Los medios electrónicos para la gestión de la historia clínica garantizan la confidencialidad y seguridad",
"TSHCR-009": "9. El prestador de servicios de salud cuenta con un procedimiento de consentimiento informado que incluye mecanismos para verificar su aplicación",
"TSHCR-010": "10. Cuando el prestador de servicios de salud utilice mecanismos electrónicos, ópticos o similares para generar, recibir, almacenar, o disponer datos de la historia clínica",
"TSHCR-027": "13. Las instituciones prestadoras de servicios de salud con servicios en la modalidad intramural para hospitalización",
"TSHCR-049": "15.1. Los mecanismos que garanticen la custodia, seguridad confidencialidad y conservación integral",
"TSINF-004": "3. Cuando en una edificación de uso exclusivo de salud funcione más de un prestador de servicios de salud",
"TSINF-005": "4. Las edificaciones donde se presten servicios de salud de urgencias y del grupo de internación, cuentan con tanque de almacenamiento",
"TSINF-006": "5. Cuando el prestador de servicios de salud cuente con mas de una infraestructura y estas se puedan vincular funcionalmente entre si",
"TSINF-013": "7. En edificaciones de uso mixto pueden funsionar los prestadores de servicios de salud que oferten y presten servicios de los grupos de consulta externa",
"TSINF-015": "8. Los prestadores de servicios de salud ubicados en edificaciones de hasta tres (3) pisos o niveles",
"TSINF-022": "11. En edificaciones donde se presten servicios de los grupos de internación, atención del parto, quirurgicos o urgencias para la movilización de pacientes en camilla",
"TSINF-025": "14. En edificaciones donde se presten servicios de cirugía, atención del parto, laboratorio clínico, urgencias",
"TSINF-028": "17. Cada prestador de servicios de salud debe contar con el respectivo concepto sanitario",
"TSINF-033": "21. En los servicios del grupo quirúrgico, los ambientes y áreas clasificados como no restringidos, semirestringidos y restringidos",
"TSINF-038": "23. Si el prestador de servicios de salud no tiene habilitado el servicio de gestión pre-transfusional, pero realiza procedimientos de transfusión sanguínea",
"TSINF-039": "24. Cuando un prestador de servicios de salud realice procedimientos bajo sedación fuera de salas de cirugía",
"TSINF-145": "39. Bateria sanitaria, ambiente que cuenta con sanitarios en serie y lavamanos, discriminadas por sexo",
"TSINF-151": "42. En las edificaciones destinadas a la prestación de servicios de salud, los pisos deben ser resistentes a factores ambientales",
"TSINF-153": "44. En los servicios de cirugía, atención del parto, ambiente TPR, salas de procedimientos, consultorios donde se realicen procedimientos",
"TSINF-154": "45. En los servicios de cirugía, atención del parto, ambiente TPR y el ambiente de esterilización",
"TSINF-182": "51.2. Plataformas tecnológicas que garanticen la seguridad y privacidad de la información",
"TSINF-188": "52.2. Plataformas tecnológicas que garanticen la seguridad y privacidad de la información",
"TSINF-193": "53.1. Ambiente exclusivo para la realización de la atención a distancia que garantiza la privacidad",
"TSINF-195": "53.3. Plataformas tecnológicas que garantizan la seguridad y privacidad de la información",
"TSMD-038": "4.13. Seguimiento al uso de medicamentos, homeopáticos, fitoterapéuticos, medicamentos biológicos",
"TSMD-039": "5. El prestador de servicios de salud que realice algún tipo de actividad con medicamentos de control especial",
"TSMD-040": "6. El prestador de servicios de salud cuenta con información documentada de la planeación y ejecución de los programas de farmacovigilancia",
"TSMD-041": "7. El prestador de servicios de salud que cuente con reservas de medicamentos, homeopáticos, fititerapéuticos",
"TSMD-044": "10. El prestador de servicios de salud cuenta con paquete para el manejo de derrames y rupturas de medicamentos",
"TSMD-045": "11. En los servicios donde se requiera carro de paro, adicional a la dotación definida en el presente manual",
"TSMD-047": "13. Si el prestador de servicios de salud no tiene habilitado el servicio de gestión pre transfusional, pero realiza procedimientos de transfusión",
"TSPP-003": "3. El prestador de servicios de salud cuenta con un comité o instancia que orienta y promueve la política de seguridad del paciente",
"TSPP-019": "6. El prestador de servicios de salud cuenta con información documentada de las actividades y procedimientos que se realizan en el servicio",
"TSPP-021": "8. Las guías de práctica clínica y protocolos a adoptar son en primera medida los que disponga el Ministerio de Salud y Protección Social",
"TSPP-044": "14. Cuando un prestador de servicios de salud contrate el proceso de esterilización con un tercero",
"TSPP-046": "16. Hasta tanto el Ministerio de Salud y Protección Social regule la materia, el prestador de servicios de salud podrá reusar dispositivos médicos",
"TSPP-048": "Acciones de seguimiento a través de los comités de infecciones, de seguridad del paciente y del programa de tecnovigilancia, que garanticen que el dispositivo",
"TSPP-080": "21. El Profesional Independiente de Salud y las Entidades con Objeto Social Diferente que oferten y presten servicios de salud de los grupos de consulta externa",
"TSPP-082": "23. Los prestadores de servicios de salud cuentan con información documentada de las condiciones de almacenamiento",
"TSPP-083": "24. Las Instituciones Prestadoras de Servicios de  Salud con servicios de hospitalización",
"TSPP-088": "25. Las Instituciones Prestadoras de Servicios de Salud, con servicios de cuidado intensivo pediátrico y adulto que cuenten con servicios quirúrgicos de neurocirugía",
"TSPP-104": "El método de comunicación que se utiliza (sincrónico o asincrónico) para la atención y los criterios para la identificación de los casos",
"TSPP-109": "32. Adicional a los criterios solicitados para el prestador remisor, cuenta con información documentada de las actividades y procedimientos",
"TSTH-001": "1. El talento humano en salud y otros profesionales que se relacionan con la atención o resultados en salud de los usuarios, cuentan con los titulos",
"TSTH-003": "3. El prestador de servicios de salud determina la cantidad necesaria de talento humano requerido",
"TSTH-007": "4.3. Estudio de capacidad instalada en el cual se determine el número máximo de estudiantes que simultáneamente",
"TSTH-008": "5. En los servicios de salud diferentes al servicio de consulta externa especializada de dolor y cuidado paliativo",
"TSTH-010": "7. En los servicios de salud donde se realicen imágenes diagnósticas por ultrasonido, cuenta con médico especialista en radiología",
"TSTH-011": "8. Los profesionales de la medicina de los servicios de hospitalización de baja, mediana y alta complejidad",
"TSTH-013": "10. El talento humano en salud de los servicios de salud de los grupos de consulta externa, internación y el servicio de urgencias, cuentan con constancia",
"TSTH-014": "11. El talento humano en salud de los servicios de transporte asistencial, atención prehospitalaria y urgencias, cuentan con constancia",
"TSTH-015": "12. Cuando en un servicio de salud se realicen \"pruebas en el punto de atención del paciente",
"TSTH-018": "13.1.1. Profesional de la medicina especialista en anestesiología, o profesional de la medicina o profesional de la odontología",
"TSTH-021": "13.2. Cuando fuera de salas de cirugía, se realicen procedimientos bajo sedación Grado III",
"TSTH-022": "13.3. Cuando fuera de salas de cirugía, se realicen procedimientos bajo sedación Grado IV",
"TSTH-023": "13.4. Cuenta con profesional de la medicina especialista en anestesiología cuando la atención se trate de pacientes con características particulares",
"TSTH-025": "14. Adicional a los criterios del estándar de talento humano enunciados que le aplique, el talento humano en salud que preste directamente un servicio",
}

def normalize(text):
    """Elimina acentos y pasa a minúsculas para comparación fuzzy."""
    nfkd = unicodedata.normalize('NFKD', text)
    return ''.join(c for c in nfkd if not unicodedata.combining(c)).lower()

def find_full_text(pdf_text, snippet, window=2000):
    """
    Busca snippet (normalizado) en pdf_text y devuelve el bloque de texto
    completo del criterio (hasta el próximo número de criterio o sección).
    """
    norm_pdf = normalize(pdf_text)
    norm_snip = normalize(snippet[:60])

    pos = norm_pdf.find(norm_snip)
    if pos == -1:
        # Intento con primeros 40 chars
        norm_snip = normalize(snippet[:40])
        pos = norm_pdf.find(norm_snip)
    if pos == -1:
        return None

    # Extraer ventana a partir del match
    chunk = pdf_text[pos:pos + window]

    # Eliminar ruido de encabezados de página
    chunk = re.sub(r'RESOLUCIÓN NÚMERO\s+DE 2019\s+Página \d+ de 230\s+Continuación de la resolución:[^\n]+\n[^\n]+\n', ' ', chunk)
    chunk = re.sub(r'\n+', ' ', chunk)
    chunk = re.sub(r'\s+', ' ', chunk).strip()

    # Cortar al inicio del SIGUIENTE criterio principal (n. Texto o n.n. Texto)
    # Patron: un número solo o n.n seguido de punto y espacio + mayúscula/letra
    next_crit = re.search(r'\s+\d+(?:\.\d+)*\.\s+[A-ZÁÉÍÓÚÑ]', chunk[10:])
    if next_crit:
        chunk = chunk[:10 + next_crit.start()].strip()

    return chunk

def main():
    with open(TXT_FILE, encoding="utf-8", errors="replace") as f:
        pdf_text = f.read()

    # Limpiar ruido de página del texto completo
    pdf_clean = re.sub(
        r'RESOLUCIÓN NÚMERO\s+DE 2019\s+Página \d+ de 230\s+Continuación de la resolución:.*?Habilitación de Servicios de Salud"\s*',
        ' ', pdf_text, flags=re.DOTALL
    )

    sql_lines = [
        "-- Corrección de nombres de criterios truncados (Norma 3100)",
        "-- Generado desde RESOLUCION_3100_EDITABLE.pdf",
        "",
    ]

    found = 0
    not_found = []

    for code, snippet in sorted(TRUNCATED.items()):
        full = find_full_text(pdf_clean, snippet)
        if full:
            # Limpiar y escapar para SQL
            full = re.sub(r'\s+', ' ', full).strip()
            escaped = full.replace("'", "''")
            sql_lines.append(f"UPDATE evaluation_criteria SET name = '{escaped}' WHERE code = '{code}';")
            found += 1
        else:
            sql_lines.append(f"-- NO ENCONTRADO: {code} -- snippet: {snippet[:60]}")
            not_found.append(code)

    sql_lines.append(f"\n-- Resultado: {found} actualizados, {len(not_found)} no encontrados")
    if not_found:
        sql_lines.append(f"-- No encontrados: {', '.join(not_found)}")

    with open(OUT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))

    print(f"Listo: {found}/{len(TRUNCATED)} encontrados")
    if not_found:
        print(f"No encontrados: {not_found}")

if __name__ == "__main__":
    main()
