/**
 * Cromva Data Compression
 * Compressão de dados para localStorage
 */

const DataCompression = {
    /**
     * Comprime string usando LZ-string (implementação simplificada)
     */
    compress(data) {
        if (!data) return '';

        const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);

        // Usar compressão nativa se disponível
        if (typeof CompressionStream !== 'undefined') {
            return this._compressNative(jsonStr);
        }

        // Fallback: compressão simples por run-length encoding + base64
        return this._compressSimple(jsonStr);
    },

    /**
     * Descomprime string
     */
    decompress(compressed) {
        if (!compressed) return '';

        // Detectar tipo de compressão
        if (compressed.startsWith('LZ:')) {
            return this._decompressSimple(compressed.slice(3));
        }

        // Dados não comprimidos
        return compressed;
    },

    /**
     * Compressão nativa (browser moderno)
     */
    async _compressNative(str) {
        try {
            const blob = new Blob([str]);
            const stream = blob.stream().pipeThrough(new CompressionStream('gzip'));
            const compressedBlob = await new Response(stream).blob();
            const buffer = await compressedBlob.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
            return 'GZ:' + base64;
        } catch (e) {
            console.warn('[DataCompression] Native compression failed:', e);
            return 'LZ:' + this._compressSimple(str);
        }
    },

    /**
     * Descompressão nativa
     */
    async _decompressNative(base64) {
        try {
            const binaryStr = atob(base64);
            const bytes = new Uint8Array([...binaryStr].map(c => c.charCodeAt(0)));
            const blob = new Blob([bytes]);
            const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
            const decompressedBlob = await new Response(stream).blob();
            return await decompressedBlob.text();
        } catch (e) {
            console.error('[DataCompression] Native decompression failed:', e);
            return '';
        }
    },

    /**
     * Compressão simples (fallback)
     * Usa dictionary-based compression
     */
    _compressSimple(str) {
        // Dicionário de termos comuns
        const dictionary = {
            'createdAt': '§1',
            'updatedAt': '§2',
            'content': '§3',
            'title': '§4',
            'workspace': '§5',
            'id': '§6',
            'name': '§7',
            'type': '§8',
            'path': '§9',
            'files': '§A',
            'notes': '§B',
            'settings': '§C',
            'true': '§T',
            'false': '§F',
            'null': '§N'
        };

        let compressed = str;

        for (const [term, code] of Object.entries(dictionary)) {
            compressed = compressed.split(`"${term}"`).join(code);
        }

        // Run-length encoding para caracteres repetidos
        compressed = compressed.replace(/(.)\1{3,}/g, (match, char) => {
            return `§R${match.length}${char}`;
        });

        return compressed;
    },

    /**
     * Descompressão simples
     */
    _decompressSimple(str) {
        const dictionary = {
            '§1': '"createdAt"',
            '§2': '"updatedAt"',
            '§3': '"content"',
            '§4': '"title"',
            '§5': '"workspace"',
            '§6': '"id"',
            '§7': '"name"',
            '§8': '"type"',
            '§9': '"path"',
            '§A': '"files"',
            '§B': '"notes"',
            '§C': '"settings"',
            '§T': 'true',
            '§F': 'false',
            '§N': 'null'
        };

        let decompressed = str;

        // Decodificar run-length
        decompressed = decompressed.replace(/§R(\d+)(.)/g, (_, count, char) => {
            return char.repeat(parseInt(count));
        });

        // Restaurar dicionário
        for (const [code, term] of Object.entries(dictionary)) {
            decompressed = decompressed.split(code).join(term);
        }

        return decompressed;
    },

    /**
     * Calcula taxa de compressão
     */
    getCompressionRatio(original, compressed) {
        if (!original || !compressed) return 0;
        return ((1 - (compressed.length / original.length)) * 100).toFixed(1);
    },

    /**
     * Testa compressão
     */
    test(data) {
        const original = typeof data === 'string' ? data : JSON.stringify(data);
        const compressed = this.compress(data);
        const decompressed = this.decompress(compressed);
        const ratio = this.getCompressionRatio(original, compressed);

        return {
            originalSize: original.length,
            compressedSize: compressed.length,
            ratio: `${ratio}%`,
            valid: original === decompressed
        };
    }
};

// Export global
window.DataCompression = DataCompression;
