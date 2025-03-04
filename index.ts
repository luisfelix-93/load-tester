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
 * Executa o teste de carga:
 * - Se for apenas uma requisição (n=1, c=1) exibe o código de resposta
 * - Caso o contrário, executa as requisições entre workers concorrentes e exibe o tempo total
 * - Ao final, exibe um resumo com a quantidade de requisições bem sucedidas e falhas
 */

async function runLoadTest() {
    const stats: RequestStat[] = []
    const statusCounts: { [key: string]: number } = {};
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

    // Exibe as estatísticas detalhadas de cada requisição
    console.log("Estatísticas de cada requisição:");
    stats.forEach((s, index) => {
    console.log(`\nRequisição ${index + 1}:`);
    if (s.error) {
      console.log(`  Erro: ${s.error}`);
    } else {
      console.log(`  Código de resposta: ${s.statusCode}`);
      console.log(`  Tempo total: ${s.totalTime}ms`);
      console.log(`  Tempo até o primeiro byte: ${s.timeToFirstByte}ms`);
      console.log(`  Tempo do primeiro ao último byte: ${s.timeToLastByte}ms`);
    }
  });
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
          console.log(`Código de resposta: ${stat.statusCode}`);
          console.log(`Tempo total: ${stat.totalTime}ms`);
          console.log(`Tempo até o primeiro byte: ${stat.timeToFirstByte}ms`);
          console.log(`Tempo do primeiro ao último byte: ${stat.timeToLastByte}ms`);
        }
    }).catch((err) => {
            console.error('Falha na requisição:', err);
    });
  } else {
    runLoadTest();
  }

