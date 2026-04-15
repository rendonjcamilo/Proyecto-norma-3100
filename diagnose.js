#!/usr/bin/env node
/**
 * Diagnostic script for Norma 3100 Assessment Generator
 * Run: node diagnose.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n=== DIAGNÓSTICO DE EVALUACIONES NORMA 3100 ===\n');

// 1. Verificar JSON
console.log('1️⃣  Verificando archivo JSON...');
const jsonPath = path.join(__dirname, 'docs', 'norma3100-model.json');
try {
  if (!fs.existsSync(jsonPath)) {
    console.error('   ❌ Archivo no encontrado:', jsonPath);
    process.exit(1);
  }

  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log('   ✅ JSON válido');
  console.log(`   - Estándares transversales: ${json.standards?.length || 0}`);
  console.log(`   - Grupos de servicios: ${json.service_groups?.length || 0}`);

  const totalServices = json.service_groups?.reduce((sum, g) => sum + g.services.length, 0) || 0;
  console.log(`   - Servicios totales: ${totalServices}`);

  // Validar estructura
  if (!json.standards || json.standards.length === 0) {
    throw new Error('No hay estándares en el JSON');
  }
  if (!json.service_groups || json.service_groups.length === 0) {
    throw new Error('No hay grupos de servicios en el JSON');
  }

  // Mostrar primeros estándares
  console.log('\n   Estándares encontrados:');
  json.standards.slice(0, 3).forEach((s) => {
    console.log(`     - ${s.code}: ${s.name} (${s.criteria?.length || 0} criterios)`);
  });

  // Mostrar primeros servicios
  console.log('\n   Servicios encontrados:');
  json.service_groups.slice(0, 2).forEach((g) => {
    console.log(`     ${g.group_name}:`);
    g.services.slice(0, 2).forEach((s) => {
      const totalCriteria = s.specific_standards?.reduce((sum, ss) => sum + ss.criteria?.length || 0, 0) || 0;
      console.log(`       - ${s.code}: ${s.name} (${totalCriteria} criterios específicos)`);
    });
  });
} catch (err) {
  console.error('   ❌ Error con JSON:', err.message);
  process.exit(1);
}

// 2. Verificar estructura del backend
console.log('\n2️⃣  Verificando estructura del backend...');
const backendFiles = [
  'backend/src/services/Norma3100Service.ts',
  'backend/src/routes/norma3100.routes.ts',
];

backendFiles.forEach((file) => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.error(`   ❌ ${file} - NO ENCONTRADO`);
  }
});

// 3. Verificar estructura del frontend
console.log('\n3️⃣  Verificando estructura del frontend...');
const frontendFiles = [
  'frontend/src/pages/AssessmentGeneratorPage.tsx',
  'frontend/src/pages/AssessmentResultPage.tsx',
];

frontendFiles.forEach((file) => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.error(`   ❌ ${file} - NO ENCONTRADO`);
  }
});

console.log('\n✅ DIAGNÓSTICO COMPLETADO');
console.log('\n📝 Próximos pasos:');
console.log('   1. Asegúrate de que el backend está en ejecución:');
console.log('      $ cd backend && npm run dev');
console.log('   2. En otra terminal, inicia el frontend:');
console.log('      $ cd frontend && npm run dev');
console.log('   3. Abre http://localhost:5173 en tu navegador');
console.log('   4. Si ves un error, revisa la consola del navegador (F12)');
console.log('   5. Si aún hay problemas, revisa los logs del backend\n');
