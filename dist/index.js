#! /usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const http = require("http");
const https = require("https");
const program = new commander_1.Command();
program
    .option('-u, --url <url>', 'URL a ser testada')
    .option('-n, --requests <number>', 'Número de requisições', parseInt)
    .option('-c, --concurrency <number>', 'Número de requisições concorrentes', parseInt);
program.parse(process.argv);
const options = program.opts();
const targetUrl = options.url || program.args[0];
if (!targetUrl) {
    console.error('Error: URL não informada');
    process.exit(1);
}
const numRequests = parseInt(options.requests, 10);
const concurrency = parseInt(options.concurrency, 10);
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const urlObject = new URL(url);
        const lib = urlObject.protocol === 'https: ' ? https : http;
        let firstByteTime = null;
        const req = lib.get(urlObject, (res) => {
            res.on('data', () => {
                if (firstByteTime === null) {
                    firstByteTime = Date.now();
                }
            });
            res.on('end', () => {
                const endTime = Date.now();
                const totalTime = endTime - startTime;
                const stat = {
                    statusCode: res.statusCode || 0,
                    totalTime,
                    timeToFirstByte: firstByteTime ? firstByteTime - startTime : undefined,
                    timeToLastByte: endTime - startTime
                };
                resolve(stat);
            });
            res.on('error', (error) => {
                const endTime = Date.now();
                const stat = {
                    error: error.message,
                    totalTime: endTime - startTime,
                };
                resolve(stat);
            });
        });
    });
}
function runLoadTest() {
    return __awaiter(this, void 0, void 0, function* () {
        const stats = [];
        const statusCounts = {};
        let requestsSent = 0;
        function worker() {
            return __awaiter(this, void 0, void 0, function* () {
                while (true) {
                    if (requestsSent >= numRequests)
                        break;
                    requestsSent++;
                    const stat = yield makeRequest(targetUrl);
                    stats.push(stat);
                    if (stat.statusCode !== undefined) {
                        statusCounts[stat.statusCode] = (statusCounts[stat.statusCode] || 0) + 1;
                    }
                    else {
                        statusCounts["error"] = (statusCounts["error"] || 0) + 1;
                    }
                }
            });
        }
        const workers = [];
        for (let i = 0; i < concurrency; i++) {
            workers.push(worker());
        }
        yield Promise.all(workers);
        console.log("Estatísticas de cada requisição:");
        stats.forEach((s, index) => {
            console.log(`\nRequisição ${index + 1}:`);
            if (s.error) {
                console.log(`  Erro: ${s.error}`);
            }
            else {
                console.log(`  Código de resposta: ${s.statusCode}`);
                console.log(`  Tempo total: ${s.totalTime}ms`);
                console.log(`  Tempo até o primeiro byte: ${s.timeToFirstByte}ms`);
                console.log(`  Tempo do primeiro ao último byte: ${s.timeToLastByte}ms`);
            }
        });
    });
}
if (numRequests === 1 && concurrency === 1) {
    makeRequest(targetUrl)
        .then((stat) => {
        console.log("Estatísticas da requisição:");
        if (stat.error) {
            console.log(`Erro: ${stat.error}`);
        }
        else {
            console.log(`Código de resposta: ${stat.statusCode}`);
            console.log(`Tempo total: ${stat.totalTime}ms`);
            console.log(`Tempo até o primeiro byte: ${stat.timeToFirstByte}ms`);
            console.log(`Tempo do primeiro ao último byte: ${stat.timeToLastByte}ms`);
        }
    }).catch((err) => {
        console.error('Falha na requisição:', err);
    });
}
else {
    runLoadTest();
}
//# sourceMappingURL=index.js.map