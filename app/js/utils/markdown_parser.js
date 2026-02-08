/**
 * Cromva Markdown Parser
 * Parser de markdown separado e otimizado
 */

const MarkdownParser = {
    // Cache de regex compilados
    patterns: {
        // Headers
        h1: /^# (.+)$/gm,
        h2: /^## (.+)$/gm,
        h3: /^### (.+)$/gm,
        h4: /^#### (.+)$/gm,
        h5: /^##### (.+)$/gm,
        h6: /^###### (.+)$/gm,

        // Formatação
        boldItalic: /\*\*\*(.+?)\*\*\*/g,
        bold: /\*\*(.+?)\*\*/g,
        italic: /\*(.+?)\*/g,
        underlineItalic: /_(.+?)_/g,
        strikethrough: /~~(.+?)~~/g,
        highlight: /==(.+?)==/g,

        // Código
        codeBlock: /```(\w*)\n([\s\S]*?)```/g,
        inlineCode: /`([^`]+)`/g,

        // Links e imagens
        image: /!\[([^\]]*)\]\(([^)]+)\)/g,
        link: /\[([^\]]+)\]\(([^)]+)\)/g,

        // Blocos
        blockquote: /^> (.+)$/gm,
        hr: /^---$/gm,

        // Listas
        taskChecked: /^- \[x\] (.+)$/gm,
        taskUnchecked: /^- \[ \] (.+)$/gm,
        unorderedList: /^- (.+)$/gm,
        orderedList: /^\d+\. (.+)$/gm,

        // Tabelas
        table: /^\|(.+)\|$/gm,
        tableSeparator: /^\|[-:| ]+\|$/gm
    },

    /**
     * Converte markdown para HTML
     */
    parse(markdown) {
        if (!markdown) {
            return '<p class="text-zinc-500 italic">Sem conteúdo</p>';
        }

        let html = this.escapeHtml(markdown);

        // Processar em ordem de prioridade
        html = this.parseCodeBlocks(html);
        html = this.parseHeaders(html);
        html = this.parseFormatting(html);
        html = this.parseLinks(html);
        html = this.parseLists(html);
        html = this.parseBlocks(html);
        html = this.parseParagraphs(html);

        return html;
    },

    /**
     * Escape HTML para evitar XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Processa blocos de código
     */
    parseCodeBlocks(html) {
        // Blocos de código
        html = html.replace(this.patterns.codeBlock, (_, lang, code) => {
            return `<pre class="bg-zinc-900 border border-zinc-700 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-emerald-400 text-sm font-mono" data-lang="${lang}">${code.trim()}</code></pre>`;
        });

        // Código inline
        html = html.replace(this.patterns.inlineCode,
            '<code class="bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-400 text-sm font-mono">$1</code>');

        return html;
    },

    /**
     * Processa headers
     */
    parseHeaders(html) {
        html = html.replace(this.patterns.h6, '<h6 class="text-sm font-semibold text-zinc-300 mt-3 mb-1">$1</h6>');
        html = html.replace(this.patterns.h5, '<h5 class="text-sm font-semibold text-zinc-200 mt-3 mb-1">$1</h5>');
        html = html.replace(this.patterns.h4, '<h4 class="text-base font-semibold text-zinc-200 mt-4 mb-2">$1</h4>');
        html = html.replace(this.patterns.h3, '<h3 class="text-lg font-semibold text-zinc-200 mt-4 mb-2">$1</h3>');
        html = html.replace(this.patterns.h2, '<h2 class="text-xl font-bold text-zinc-100 mt-6 mb-3">$1</h2>');
        html = html.replace(this.patterns.h1, '<h1 class="text-2xl font-bold text-white mt-6 mb-4">$1</h1>');
        return html;
    },

    /**
     * Processa formatação de texto
     */
    parseFormatting(html) {
        html = html.replace(this.patterns.boldItalic, '<strong class="font-bold"><em>$1</em></strong>');
        html = html.replace(this.patterns.bold, '<strong class="font-bold text-white">$1</strong>');
        html = html.replace(this.patterns.italic, '<em class="italic">$1</em>');
        html = html.replace(this.patterns.underlineItalic, '<em class="italic">$1</em>');
        html = html.replace(this.patterns.strikethrough, '<del class="line-through text-zinc-500">$1</del>');
        html = html.replace(this.patterns.highlight, '<mark class="bg-yellow-500/30 px-1 rounded">$1</mark>');
        return html;
    },

    /**
     * Processa links e imagens
     */
    parseLinks(html) {
        // Imagens primeiro (para evitar conflito com links)
        html = html.replace(this.patterns.image,
            '<img src="$2" alt="$1" class="max-w-full rounded-lg my-4 shadow-lg">');

        // Links
        html = html.replace(this.patterns.link,
            '<a href="$2" class="text-blue-400 hover:underline" target="_blank" rel="noopener">$1</a>');

        return html;
    },

    /**
     * Processa listas
     */
    parseLists(html) {
        // Task lists
        html = html.replace(this.patterns.taskChecked,
            '<div class="flex items-center gap-2 my-1"><span class="text-emerald-400">✓</span><span class="line-through text-zinc-500">$1</span></div>');
        html = html.replace(this.patterns.taskUnchecked,
            '<div class="flex items-center gap-2 my-1"><span class="text-zinc-500">○</span><span>$1</span></div>');

        // Listas normais
        html = html.replace(this.patterns.unorderedList, '<li class="ml-4 list-disc text-zinc-300">$1</li>');
        html = html.replace(this.patterns.orderedList, '<li class="ml-4 list-decimal text-zinc-300">$1</li>');

        return html;
    },

    /**
     * Processa blocos (blockquotes, hr)
     */
    parseBlocks(html) {
        html = html.replace(this.patterns.blockquote,
            '<blockquote class="border-l-4 border-zinc-600 pl-4 my-4 text-zinc-400 italic">$1</blockquote>');
        html = html.replace(this.patterns.hr, '<hr class="border-zinc-700 my-6">');
        return html;
    },

    /**
     * Processa parágrafos
     */
    parseParagraphs(html) {
        // Quebras duplas = novo parágrafo
        html = html.replace(/\n\n/g, '</p><p class="my-3 text-zinc-300">');
        // Quebra simples = <br>
        html = html.replace(/\n/g, '<br>');

        // Wrap em parágrafo se não começar com elemento de bloco
        if (!html.match(/^<(h[1-6]|pre|blockquote|ul|ol|li|div|hr)/)) {
            html = '<p class="my-3 text-zinc-300">' + html + '</p>';
        }

        return html;
    },

    /**
     * Extrai texto puro (sem formatação)
     */
    toPlainText(markdown) {
        if (!markdown) return '';

        let text = markdown;

        // Remover formatação markdown
        text = text.replace(/#{1,6}\s*/g, '');
        text = text.replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1');
        text = text.replace(/_{1,2}([^_]+)_{1,2}/g, '$1');
        text = text.replace(/~~([^~]+)~~/g, '$1');
        text = text.replace(/`([^`]+)`/g, '$1');
        text = text.replace(/```[\s\S]*?```/g, '');
        text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        text = text.replace(/!\[[^\]]*\]\([^)]+\)/g, '');
        text = text.replace(/^>\s*/gm, '');
        text = text.replace(/^[-*+]\s*/gm, '');
        text = text.replace(/^\d+\.\s*/gm, '');

        return text.trim();
    },

    /**
     * Conta palavras
     */
    countWords(markdown) {
        const text = this.toPlainText(markdown);
        return text.split(/\s+/).filter(Boolean).length;
    },

    /**
     * Conta caracteres
     */
    countCharacters(markdown) {
        const text = this.toPlainText(markdown);
        return text.length;
    },

    /**
     * Extrai headings
     */
    extractHeadings(markdown) {
        const headings = [];
        const regex = /^(#{1,6})\s+(.+)$/gm;
        let match;

        while ((match = regex.exec(markdown)) !== null) {
            headings.push({
                level: match[1].length,
                text: match[2],
                id: match[2].toLowerCase().replace(/\s+/g, '-')
            });
        }

        return headings;
    },

    /**
     * Gera Table of Contents
     */
    generateTOC(markdown) {
        const headings = this.extractHeadings(markdown);
        if (headings.length === 0) return '';

        let toc = '<nav class="toc p-4 bg-zinc-800/50 rounded-lg mb-6"><h4 class="font-bold mb-2 text-zinc-200">Índice</h4><ul class="space-y-1">';

        for (const h of headings) {
            const indent = (h.level - 1) * 1;
            toc += `<li style="margin-left: ${indent}rem"><a href="#${h.id}" class="text-blue-400 hover:underline text-sm">${h.text}</a></li>`;
        }

        toc += '</ul></nav>';
        return toc;
    }
};

// Export global
window.MarkdownParser = MarkdownParser;
