#! /usr/bin/env node

import { Command } from "commander";
import * as http from 'http';
import * as https from 'https';


const program = new Command();

program
    .option('-u, --url <url>', 'URL a ser testada')
    .option('-n, --requests <number>', 'Número de requisições', parseInt)
    .option('-c, --concurrency <number>', 'Número de requisições concorrentes', parseInt);

program.parse(process.argv);

const options = program.opts();

// Permite que a URL seja passada como arguemento posicional se não for informada como -u 
const targetUrl = options.url || program.args[0];
if(!targetUrl) {
    console.error('Error: URL não informada');
    process.exit(1);
}

const numRequests = parseInt(options.requests, 10);
const concurrency = parseInt(options.concurrency, 10);

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
 * Realiza uma requisição GET para a URL informada e retorna uma Promise
 * que resolve com o código de status HTTP da resposta
 * e coleta as seguintes estatísticas:
 * - Tempo total da requisição
 * - Tempo até o primeiro byte
 * - Tempo até o último byte
 * Em caso de erro, a estatística conterá a propriedade error
 */

function makeRequest(url: string): Promise<RequestStat> {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const urlObject = new URL(url);
        const lib = urlObject.protocol === 'https: '? https : http;
        let firstByteTime: number | null = null;

        const req = lib.get(urlObject, (res) => {
            res.on('data', () => {
                if (firstByteTime === null) {
                    firstByteTime = Date.now();
                }
            });
            res.on('end', () => {
                const endTime = Date.now();
                const totalTime = endTime - startTime;
                const stat: RequestStat = {
                    statusCode: res.statusCode || 0,
                    totalTime,
                    timeToFirstByte: firstByteTime ? firstByteTime - startTime : undefined,
                    timeToLastByte: endTime - startTime
                }
                resolve(stat);
            });

            res.on('error', (error) => {
                const endTime = Date.now();
                const stat: RequestStat = {
                error: error.message,
                totalTime: endTime - startTime,
            };
            resolve(stat);
            });
        });
    });
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
 * Executa o teste de carga:
 * - Se for apenas uma requisição (n=1, c=1) exibe o código de resposta
 * - Caso o contrário, executa as requisições entre workers concorrentes e exibe o tempo total
 * - Ao final, exibe um resumo com a quantidade de requisições bem sucedidas e falhas
 */

async function runLoadTest() {
    const stats: RequestStat[] = []
    const statusCounts: { [key: string]: number } = {};
    const testStartTime = Date.now();
    let requestsSent = 0;

    async function worker() {
        while (true) {
            // Verifica se atingimos o número total de requisições
            if (requestsSent >= numRequests) break;
            requestsSent++;
      
            const stat = await makeRequest(targetUrl);
            stats.push(stat);
      
            // Conta o status (se houver erro, usamos a chave "error")
            if (stat.statusCode !== undefined) {
              statusCounts[stat.statusCode] = (statusCounts[stat.statusCode] || 0) + 1;
            } else {
              statusCounts["error"] = (statusCounts["error"] || 0) + 1;
            }
        }
    }

    const workers: Promise<void>[] = [];
    for (let i = 0; i < concurrency; i++) {
         workers.push(worker());
    }
    await Promise.all(workers);
    const totalEndTime = Date.now();
    // Calculo do tempo total do teste e das requisições por segundo
    const totalTestTimeSeconds = (testStartTime - totalEndTime) / 1000;
    const requestsPerSecond = (numRequests / totalTestTimeSeconds);

    // Contabiliza as requisições bem sucedidas e as que falharam
    const successCount = stats.filter((s) => s.statusCode !== undefined && s.statusCode >= 200 && s.statusCode < 300).length;
    const failedCount = stats.length - successCount;

    // Contabiliza as requisições bem sucedidas (status: 2XX) e as que falharam
    const totalTimes = stats.map((s) => s.totalTime/1000);
    const ttfbTimes = stats.filter((s) => s.timeToFirstByte !== undefined).map((s) => (s.timeToFirstByte as number) / 1000);
    const ttlbTimes = stats.filter((s) => s.timeToLastByte !== undefined).map((s) => (s.timeToLastByte as number)/1000);

    const totalTimeStats = calcStats(totalTimes);
    const ttfbStats = calcStats(ttfbTimes);
    const ttlbStats = calcStats(ttlbTimes);

    // Exibe o resumo no formato solicitado
    console.log("\nResults:");
    console.log(` Total Requests (2XX).......................: ${successCount}`);
    console.log(` Failed Requests (5XX)......................: ${failedCount}`);
    console.log(` Request/second.............................: ${requestsPerSecond.toFixed(2)}`);
    console.log("");
    console.log(`Total Request Time (s) (Min, Max, Mean).....: ${totalTimeStats.min.toFixed(2)}, ${totalTimeStats.max.toFixed(2)}, ${totalTimeStats.avg.toFixed(2)}`);
    console.log(`Time to First Byte (s) (Min, Max, Mean).....: ${ttfbStats.min.toFixed(2)}, ${ttfbStats.max.toFixed(2)}, ${ttfbStats.avg.toFixed(2)}`);
    console.log(`Time to Last Byte (s) (Min, Max, Mean)......: ${ttlbStats.min.toFixed(2)}, ${ttlbStats.max.toFixed(2)}, ${ttlbStats.avg.toFixed(2)}`);
}
// Se for apenas uma requisição (n=1, c=1) exibe o código de resposta
// Caso contrário, executa as requisições entre workers concorrentes
if (numRequests === 1 && concurrency === 1) {
    makeRequest(targetUrl)
      .then((stat) => {
        console.log("Estatísticas da requisição:");
        if (stat.error) {
          console.log(`Erro: ${stat.error}`);
        } else {
          console.log(` Código de resposta: ${stat.statusCode}`);
          console.log(` Tempo total: ${(stat.totalTime / 1000).toFixed(2)}s`);
          console.log(` Tempo até o primeiro byte: ${stat.timeToFirstByte ? (stat.timeToFirstByte / 1000).toFixed(2) : "N/A"}s`);
          console.log(` Tempo do primeiro ao último byte: ${stat.timeToLastByte ? (stat.timeToLastByte / 1000).toFixed(2) : "N/A"}s`);
        }
    }).catch((err) => {
        console.error('Falha na requisição:', err);
    });
} else {
  runLoadTest();
}
