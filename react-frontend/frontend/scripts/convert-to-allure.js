import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar diretório allure-results se não existir
const allureDir = path.join(__dirname, '../allure-results');
if (!fs.existsSync(allureDir)) {
  fs.mkdirSync(allureDir, { recursive: true });
}

// Ler resultados dos testes Vitest
const testResultsPath = path.join(__dirname, '../test-results/test-results.json');

// Verificar se existem resultados do Cypress também
const cypressResultsDir = path.join(__dirname, '../allure-results');
const hasCypressResults = fs.existsSync(cypressResultsDir) && 
                          fs.readdirSync(cypressResultsDir).some(file => file.endsWith('.json'));

if (!fs.existsSync(testResultsPath) && !hasCypressResults) {
  console.log('⚠️  Nenhum resultado de teste encontrado. Criando resultados vazios.');
  // Criar um resultado vazio para evitar erro no Allure
  const emptyResult = {
    uuid: crypto.randomUUID(),
    historyId: crypto.randomUUID(),
    name: 'No tests executed',
    status: 'skipped',
    stage: 'finished',
    start: Date.now(),
    stop: Date.now(),
    labels: [
      { name: 'suite', value: 'Frontend Tests' },
      { name: 'framework', value: 'N/A' }
    ]
  };
  
  fs.writeFileSync(
    path.join(allureDir, `${crypto.randomUUID()}-result.json`),
    JSON.stringify(emptyResult, null, 2)
  );
  console.log('✅ Resultado vazio criado com sucesso');
  process.exit(0);
}

// Se só existem resultados Cypress, não precisa converter
if (!fs.existsSync(testResultsPath) && hasCypressResults) {
  console.log('ℹ️  Apenas resultados Cypress encontrados. Conversão Vitest não necessária.');
  process.exit(0);
}

const testResults = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));

// Converter cada teste para formato Allure
if (testResults.testResults && testResults.testResults.length > 0) {
  let testCount = 0;
  
  testResults.testResults.forEach((fileResult) => {
    if (fileResult.assertionResults && fileResult.assertionResults.length > 0) {
      fileResult.assertionResults.forEach((test) => {
        const uuid = crypto.randomUUID();
        const suiteName = test.ancestorTitles?.join(' > ') || 'Frontend Unit Tests';
        
        const allureResult = {
          uuid: uuid,
          historyId: crypto.randomUUID(),
          name: test.title || test.fullName,
          fullName: test.fullName || test.title,
          status: test.status === 'passed' ? 'passed' : test.status === 'failed' ? 'failed' : 'skipped',
          stage: 'finished',
          start: fileResult.startTime || Date.now(),
          stop: fileResult.endTime || Date.now(),
          duration: test.duration || 0,
          labels: [
            { name: 'suite', value: suiteName },
            { name: 'framework', value: 'vitest' },
            { name: 'package', value: path.basename(fileResult.name || '') },
            { name: 'testClass', value: suiteName },
            { name: 'testMethod', value: test.title }
          ],
          links: []
        };

        if (test.failureMessages && test.failureMessages.length > 0) {
          allureResult.statusDetails = {
            message: test.failureMessages[0],
            trace: test.failureMessages.join('\n')
          };
        }

        const fileName = `${uuid}-result.json`;
        fs.writeFileSync(
          path.join(allureDir, fileName),
          JSON.stringify(allureResult, null, 2)
        );
        testCount++;
      });
    }
  });
  
  console.log(`✅ Conversão para formato Allure concluída com sucesso! ${testCount} teste(s) convertido(s).`);
} else {
  console.log('⚠️  Nenhum resultado de teste encontrado para converter.');
}
