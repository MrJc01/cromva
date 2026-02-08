/**
 * Cromva File Format Handler
 * Suporte a múltiplos formatos de arquivo
 */

const FileFormatHandler = {
    // Formatos suportados
    formats: {
        markdown: {
            extensions: ['.md', '.markdown', '.mdown', '.mkd'],
            mimeType: 'text/markdown',
            icon: '📝'
        },
        text: {
            extensions: ['.txt', '.text'],
            mimeType: 'text/plain',
            icon: '📄'
        },
        json: {
            extensions: ['.json'],
            mimeType: 'application/json',
            icon: '📋'
        },
        yaml: {
            extensions: ['.yml', '.yaml'],
            mimeType: 'text/yaml',
            icon: '⚙️'
        },
        html: {
            extensions: ['.html', '.htm'],
            mimeType: 'text/html',
            icon: '🌐'
        }
    },

    /**
     * Retorna formato pelo nome do arquivo
     */
    getFormat(filename) {
        const ext = this.getExtension(filename);

        for (const [name, format] of Object.entries(this.formats)) {
            if (format.extensions.includes(ext)) {
                return { name, ...format };
            }
        }

        return { name: 'unknown', extensions: [], mimeType: 'text/plain', icon: '❓' };
    },

    /**
     * Extrai extensão
     */
    getExtension(filename) {
        const match = filename.match(/\.[^.]+$/);
        return match ? match[0].toLowerCase() : '';
    },

    /**
     * Verifica se formato é suportado
     */
    isSupported(filename) {
        const ext = this.getExtension(filename);
        return Object.values(this.formats).some(f => f.extensions.includes(ext));
    },

    /**
     * Retorna todas extensões suportadas
     */
    getSupportedExtensions() {
        return Object.values(this.formats).flatMap(f => f.extensions);
    },

    /**
     * Converte entre formatos
     */
    convert(content, fromFormat, toFormat) {
        if (fromFormat === toFormat) return content;

        // Markdown -> HTML
        if (fromFormat === 'markdown' && toFormat === 'html') {
            return this._markdownToHtml(content);
        }

        // HTML -> Markdown
        if (fromFormat === 'html' && toFormat === 'markdown') {
            return this._htmlToMarkdown(content);
        }

        // JSON -> YAML (simplificado)
        if (fromFormat === 'json' && toFormat === 'yaml') {
            return this._jsonToYaml(content);
        }

        // Markdown -> Text
        if (fromFormat === 'markdown' && toFormat === 'text') {
            return this._markdownToPlainText(content);
        }

        return content;
    },

    /**
     * Markdown para HTML
     */
    _markdownToHtml(md) {
        if (typeof MarkdownParser !== 'undefined') {
            return MarkdownParser.parse(md);
        }

        // Fallback básico
        let html = md
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.+?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/gim, '<em>$1</em>')
            .replace(/\n/gim, '<br>');

        return html;
    },

    /**
     * HTML para Markdown
     */
    _htmlToMarkdown(html) {
        return html
            .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
            .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
            .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
            .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<em>(.*?)<\/em>/gi, '*$1*')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '');
    },

    /**
     * JSON para YAML (simplificado)
     */
    _jsonToYaml(json) {
        try {
            const obj = typeof json === 'string' ? JSON.parse(json) : json;
            return this._objectToYaml(obj, 0);
        } catch (e) {
            return json;
        }
    },

    /**
     * Objeto para YAML
     */
    _objectToYaml(obj, indent = 0) {
        const spaces = '  '.repeat(indent);
        let yaml = '';

        for (const [key, value] of Object.entries(obj)) {
            if (Array.isArray(value)) {
                yaml += `${spaces}${key}:\n`;
                for (const item of value) {
                    if (typeof item === 'object') {
                        yaml += `${spaces}- \n${this._objectToYaml(item, indent + 2)}`;
                    } else {
                        yaml += `${spaces}- ${item}\n`;
                    }
                }
            } else if (typeof value === 'object' && value !== null) {
                yaml += `${spaces}${key}:\n${this._objectToYaml(value, indent + 1)}`;
            } else {
                yaml += `${spaces}${key}: ${value}\n`;
            }
        }

        return yaml;
    },

    /**
     * Markdown para texto plano
     */
    _markdownToPlainText(md) {
        return md
            .replace(/^#{1,6}\s*/gm, '')
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/\*(.+?)\*/g, '$1')
            .replace(/`(.+?)`/g, '$1')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[Imagem: $1]');
    },

    /**
     * Valida arquivo
     */
    validate(content, format) {
        switch (format) {
            case 'json':
                try {
                    JSON.parse(content);
                    return { valid: true };
                } catch (e) {
                    return { valid: false, error: e.message };
                }
            case 'yaml':
                // Validação básica de YAML
                if (content.includes('\t')) {
                    return { valid: false, error: 'Tabs not allowed in YAML' };
                }
                return { valid: true };
            default:
                return { valid: true };
        }
    }
};

// Export global
window.FileFormatHandler = FileFormatHandler;
