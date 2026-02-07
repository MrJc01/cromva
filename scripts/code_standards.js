/**
 * Cromva Code Standards
 * Script para verificar e aplicar padrões de código
 */

const CodeStandards = {
    /**
     * Verifica padrões de nomenclatura
     * @param {string} code - Código fonte para verificar
     * @returns {object} Resultado da verificação
     */
    checkNaming(code) {
        const issues = [];

        // Verificar funções (devem ser camelCase)
        const funcPattern = /function\s+([A-Z][a-zA-Z]*)\s*\(/g;
        let match;
        while ((match = funcPattern.exec(code)) !== null) {
            if (match[1][0] === match[1][0].toUpperCase() && !match[1].match(/^[A-Z][a-z]+[A-Z]/)) {
                issues.push({
                    type: 'naming',
                    message: `Função '${match[1]}' deve ser camelCase`,
                    line: code.substring(0, match.index).split('\n').length
                });
            }
        }

        // Verificar constantes (devem ser UPPER_SNAKE_CASE ou camelCase)
        const constPattern = /const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g;
        while ((match = constPattern.exec(code)) !== null) {
            const name = match[1];
            const isUpperSnake = /^[A-Z][A-Z0-9_]*$/.test(name);
            const isCamelCase = /^[a-z][a-zA-Z0-9]*$/.test(name);
            const isPascalCase = /^[A-Z][a-zA-Z0-9]*$/.test(name);

            if (!isUpperSnake && !isCamelCase && !isPascalCase) {
                issues.push({
                    type: 'naming',
                    message: `Constante '${name}' deve ser camelCase, PascalCase ou UPPER_SNAKE_CASE`,
                    line: code.substring(0, match.index).split('\n').length
                });
            }
        }

        return { valid: issues.length === 0, issues };
    },

    /**
     * Encontra console.log soltos
     * @param {string} code - Código fonte
     * @returns {array} Lista de console.log encontrados
     */
    findConsoleLogs(code) {
        const logs = [];
        const lines = code.split('\n');

        lines.forEach((line, index) => {
            if (line.includes('console.log') && !line.trim().startsWith('//')) {
                logs.push({
                    line: index + 1,
                    content: line.trim()
                });
            }
        });

        return logs;
    },

    /**
     * Remove console.log de código
     * @param {string} code - Código fonte
     * @returns {string} Código sem console.log
     */
    removeConsoleLogs(code) {
        const lines = code.split('\n');

        return lines.filter(line => {
            const trimmed = line.trim();
            // Manter se for comentário ou não for console.log
            return !trimmed.startsWith('console.log') || trimmed.startsWith('//');
        }).join('\n');
    },

    /**
     * Verifica indentação
     * @param {string} code - Código fonte
     * @param {number} spaces - Número de espaços esperado (default 4)
     * @returns {object} Resultado da verificação
     */
    checkIndentation(code, spaces = 4) {
        const issues = [];
        const lines = code.split('\n');

        lines.forEach((line, index) => {
            if (line.trim() === '') return;

            const leadingSpaces = line.match(/^(\s*)/)[1];

            // Verificar tabs
            if (leadingSpaces.includes('\t')) {
                issues.push({
                    line: index + 1,
                    message: 'Usar espaços ao invés de tabs'
                });
            }

            // Verificar múltiplo do esperado
            if (leadingSpaces.length % spaces !== 0 && leadingSpaces.length > 0) {
                issues.push({
                    line: index + 1,
                    message: `Indentação deve ser múltiplo de ${spaces} espaços`
                });
            }
        });

        return { valid: issues.length === 0, issues };
    },

    /**
     * Verifica variáveis não utilizadas (análise básica)
     * @param {string} code - Código fonte
     * @returns {array} Lista de variáveis potencialmente não utilizadas
     */
    findUnusedVariables(code) {
        const unused = [];

        // Encontrar declarações
        const declPattern = /(?:const|let|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g;
        let match;
        const variables = [];

        while ((match = declPattern.exec(code)) !== null) {
            variables.push({
                name: match[1],
                line: code.substring(0, match.index).split('\n').length
            });
        }

        // Verificar uso (análise simples)
        for (const v of variables) {
            // Contar ocorrências além da declaração
            const regex = new RegExp(`\\b${v.name}\\b`, 'g');
            const matches = code.match(regex) || [];

            if (matches.length <= 1) {
                unused.push(v);
            }
        }

        return unused;
    },

    /**
     * Verifica código morto (funções não chamadas)
     * @param {string} code - Código fonte
     * @returns {array} Lista de funções potencialmente não utilizadas
     */
    findDeadCode(code) {
        const deadCode = [];

        // Encontrar funções
        const funcPattern = /function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
        let match;
        const functions = [];

        while ((match = funcPattern.exec(code)) !== null) {
            functions.push({
                name: match[1],
                line: code.substring(0, match.index).split('\n').length
            });
        }

        // Verificar chamadas
        for (const f of functions) {
            const callPattern = new RegExp(`\\b${f.name}\\s*\\(`, 'g');
            const matches = code.match(callPattern) || [];

            // Se só tem a declaração (1 match)
            if (matches.length <= 1) {
                deadCode.push(f);
            }
        }

        return deadCode;
    },

    /**
     * Unifica estilo async/await
     * @param {string} code - Código fonte
     * @returns {object} Estatísticas e sugestões
     */
    analyzeAsyncStyle(code) {
        const thenCount = (code.match(/\.then\s*\(/g) || []).length;
        const awaitCount = (code.match(/\bawait\s+/g) || []).length;
        const asyncCount = (code.match(/\basync\s+/g) || []).length;

        return {
            then: thenCount,
            await: awaitCount,
            async: asyncCount,
            recommendation: thenCount > awaitCount
                ? 'Considere converter .then() para async/await para consistência'
                : 'O código já usa predominantemente async/await ✓'
        };
    },

    /**
     * Gera relatório completo
     * @param {string} code - Código fonte
     * @returns {object} Relatório completo
     */
    generateReport(code) {
        return {
            timestamp: new Date().toISOString(),
            naming: this.checkNaming(code),
            consoleLogs: this.findConsoleLogs(code),
            indentation: this.checkIndentation(code),
            unusedVars: this.findUnusedVariables(code),
            deadCode: this.findDeadCode(code),
            asyncStyle: this.analyzeAsyncStyle(code),
            lineCount: code.split('\n').length,
            charCount: code.length
        };
    },

    /**
     * Exibe relatório no console
     * @param {object} report - Relatório gerado
     */
    printReport(report) {
        console.group('📋 Relatório de Padrões de Código');

        console.log(`📁 ${report.lineCount} linhas, ${report.charCount} caracteres`);

        if (report.naming.issues.length > 0) {
            console.warn('⚠️ Problemas de nomenclatura:', report.naming.issues);
        }

        if (report.consoleLogs.length > 0) {
            console.warn(`⚠️ ${report.consoleLogs.length} console.log encontrados`);
        }

        if (!report.indentation.valid) {
            console.warn('⚠️ Problemas de indentação:', report.indentation.issues.length);
        }

        console.log('📊 Estilo async:', report.asyncStyle.recommendation);

        console.groupEnd();
    }
};

// Export global
window.CodeStandards = CodeStandards;
