#! /usr/bin/env node
import { http, https} from 'follow-redirects'
import * as readline from 'readline';
import { URL } from 'url';
import * as minimist from 'minimist';


/**
 * Interface para analise de estatísticas
 */

interface RequestStat {
    statusCode? : number;
    error?: string;
    totalTime: number;
    timeToFirstByte?: number;
    timeToLastByte?: number;
}

/**
 * Realiza a requisição, GET como padrão, porém com a possibilidade de outros métodos HTTP, 
 * e suporte para corpo de requisição.
 * Calcula o tempo de cada requisição feita
 */

function makeRequest (url: string, method: string = 'GET', body?: string): Promise<RequestStat> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const urlObj = new URL(url);

    const lib = urlObj.protocol === 'https:'? https : http;
    let firstByteTime: number | null = null;

    // Confuigurar  headers se houver corpo na requisição

    const headers: Record<string, string> = {}
    if (body) {
      try {
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = Buffer.byteLength(body).toString();
      } catch (error) {
        console.error("Erro: corpo inválido. Detalhes:", error.message);
        process.exit(1);
      }
    }

    // Cria o objeto de requisição
    const options = { method, headers};

    const req = lib.request(urlObj, options, (res) => {
      res.on('data', () => {
        if (firstByteTime === null) {
          firstByteTime = Date.now();
        }
      });
      res.on('end', () => {
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        resolve({
          statusCode: res.statusCode || 0,
          totalTime,
          timeToFirstByte: firstByteTime ? firstByteTime - startTime : undefined,
          timeToLastByte: firstByteTime ? endTime - firstByteTime : undefined,
        });
      });
      res.on('error', (error) => {
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        resolve({
          statusCode: res.statusCode || 0,
          totalTime,
          error: error.message
        });
      });
  
    })
    req.on('error', (error) => {
      const endTime = Date.now();
      reject(error); // ← Rejeita a Promise
    })
    if (body) {
      req.write(body);
    }
    req.end();
  })
}

/**
 * Função para auxiliar o mínimo, máximo e a média de um array de números
 */

function calcStats(values: number[]): {min: number, max: number, avg: number} {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sum = values.reduce((acc, v) => acc + v, 0);

  return {
    min, 
    max,
    avg: sum / values.length
  };
}

/**
 * Interface do resumo dos resultados dos testes
 */

interface Summary {
  successCount: number;
  failedCount: number;
  requestsPerSecond: number;
  totalTime: {min: number, max: number, avg: number};
  timeToFirstByte: {min: number, max: number, avg: number}
  timeToLastByte: {min: number, max: number, avg: number}
}

/**
 * Executa o teste de carga com os parâmetros informados e retorna um resumo
 */

async function runLoadTest(targetUrl: string, numRequests: number, concurrency: number, method: string = 'GET', body?: string): Promise<Summary> {
  const stats: RequestStat[] = [];
  let requestSent = 0;
  const testStartTime = Date.now();

  async function worker() {
    while (requestSent < numRequests) {
      requestSent ++;
      const stat = await makeRequest(targetUrl, method, body);
      stats.push(stat);
    }
  }

  const workers: Promise<void> [] = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  const testEndTime = Date.now();

  const totalTestTimeSeconds = (testEndTime - testStartTime) / 1000;
  const requestsPerSecond = numRequests / totalTestTimeSeconds;

  const successCount = stats.filter(s => s.statusCode !== undefined && s.statusCode >= 200 && s.statusCode < 300).length;
  const failedCount = stats.length - successCount;

  const totalTimes = stats.map(s => s.totalTime / 1000);
  const ttfbTimes = stats.filter(s => s.timeToFirstByte !== undefined).map(s => (s.timeToFirstByte as number) / 1000);
  const ttlbTimes = stats.filter(s => s.timeToLastByte !== undefined).map(s => (s.timeToLastByte as number) / 1000);

  return {
    successCount,
    failedCount,
    requestsPerSecond,
    totalTime: calcStats(totalTimes),
    timeToFirstByte: calcStats(ttfbTimes),
    timeToLastByte: calcStats(ttlbTimes)
  };
  
}

/**
 * Exibir o resumo dos resultados
*/
function printSummary(summary: Summary): void {
  console.log("\nResults:");
  console.log(` Total Requests (2XX).......................: ${summary.successCount}`);
  console.log(` Failed Requests (5XX)......................: ${summary.failedCount}`);
  console.log(` Request/second.............................: ${summary.requestsPerSecond.toFixed(2)}`);
  console.log("");
  console.log(`Total Request Time (s) (Min, Max, Mean).....: ${summary.totalTime.min.toFixed(2)}, ${summary.totalTime.max.toFixed(2)}, ${summary.totalTime.avg.toFixed(2)}`);
  console.log(`Time to First Byte (s) (Min, Max, Mean).....: ${summary.timeToFirstByte.min.toFixed(2)}, ${summary.timeToFirstByte.max.toFixed(2)}, ${summary.timeToFirstByte.avg.toFixed(2)}`);
  console.log(`Time to Last Byte (s) (Min, Max, Mean)......: ${summary.timeToLastByte.min.toFixed(2)}, ${summary.timeToLastByte.max.toFixed(2)}, ${summary.timeToLastByte.avg.toFixed(2)}`);
}

function printHelp(): void {
  console.log("\nOpções disponíveis:");
  console.log("  -u, --url           URL a ser testada (obrigatório)");
  console.log("  -n, --requests      Número de requisições a fazer (padrão: 10)");
  console.log("  -c, --concurrency   Número de requisições concorrentes (padrão: 1)");
  console.log("  -m, --method        Método HTTP (padrão: GET)");
  console.log("  -b, --body          Corpo da requisição (opcional)");
  console.log("  help                Exibe este menu de ajuda");
  console.log("  exit ou quit        Encerra o programa\n");
}

function startREPL() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'ccload$ '
  });
  console.log("Digite os comandos (exemplo: -u http://localhost:8000 -n 100 -c 10 -m GET). Para sair, digite 'exit'.");
  rl.prompt();

  rl.on('line', async (line: string) => {
    const input = line.trim();
    if(input.toLowerCase() === "help"){
      printHelp();
      rl.prompt();
      return;
    }
    if (input === '' || input === 'exit'.toLowerCase() || input === 'quit'.toLowerCase()) {
      rl.close();
      return;
    }

    // Usa minimist para converter string em argumentos
    const tokens = input.match(/(".*?"|'.*?'|\S+)/g) || [];
    const args = minimist(
      tokens.map((token) => token.replace(/^['"]|['"]$/g, '')), // Remove as aspas externas
      { 
        alias: { 
          u: 'url', 
          n: 'requests', 
          c: 'concurrency',
          m: 'method',
          b: 'body'
        },
        default: { 
          requests: '10', 
          concurrency: '1',
          method: 'GET'
        },
        string: ['body'] // Garante que o body seja tratado como string
      }
    );

    const targetUrl = args.url;
    if (!targetUrl) {
      console.log("Erro: é necessário informar a opção -u ou --url");
      rl.prompt();
      return;
    }

    const numRequests = parseInt(args.requests, 10);
    const concurrency = parseInt(args.concurrency, 10);
    const method = args.method.toUpperCase();
    const body = args.body;

    console.log(`\nExecutando teste em ${targetUrl} com ${numRequests} requisições e ${concurrency} concorrentes...`);

    try {
      const summary = await runLoadTest(targetUrl, numRequests, concurrency, method, body);
      printSummary(summary);
    } catch (error) {
      console.error("Erro ao executar o teste:", error.message);
    }
    console.log(""); // Pula uma linha para separar os resultados;
    rl.prompt();
  });

  rl.on('close', () => {
    console.log("Encerrando o ccload. Até a próxima!");
    process.exit(0);
  })
}

startREPL();