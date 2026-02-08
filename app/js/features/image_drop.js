/**
 * Cromva Image Drag Drop
 * Suporte a arrastar e soltar imagens no editor
 */

const ImageDragDrop = {
    textarea: null,
    dropZone: null,
    isActive: false,

    /**
     * Inicializa o drag-drop
     */
    init(textareaId = 'modal-textarea') {
        this.textarea = typeof textareaId === 'string'
            ? document.getElementById(textareaId)
            : textareaId;

        if (!this.textarea) {
            console.warn('[ImageDragDrop] Textarea not found');
            return;
        }

        this.setupDropZone();
        this.attachListeners();

        console.log('[ImageDragDrop] Initialized');
    },

    /**
     * Configura zona de drop
     */
    setupDropZone() {
        // Usar o próprio textarea como drop zone
        this.dropZone = this.textarea;
    },

    /**
     * Anexa event listeners
     */
    attachListeners() {
        if (!this.dropZone) return;

        // Prevenir comportamento padrão em toda a janela
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
            this.dropZone.addEventListener(event, this.preventDefaults.bind(this));
        });

        // Highlight ao arrastar
        ['dragenter', 'dragover'].forEach(event => {
            this.dropZone.addEventListener(event, this.highlight.bind(this));
        });

        ['dragleave', 'drop'].forEach(event => {
            this.dropZone.addEventListener(event, this.unhighlight.bind(this));
        });

        // Handle drop
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this));

        // Também aceitar paste de imagens
        this.dropZone.addEventListener('paste', this.handlePaste.bind(this));
    },

    /**
     * Previne comportamento padrão
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    },

    /**
     * Destaca drop zone
     */
    highlight() {
        this.isActive = true;
        this.dropZone.classList.add('ring-2', 'ring-emerald-500', 'ring-opacity-50');

        // Mostrar overlay se não existir
        this.showOverlay();
    },

    /**
     * Remove destaque
     */
    unhighlight() {
        this.isActive = false;
        this.dropZone.classList.remove('ring-2', 'ring-emerald-500', 'ring-opacity-50');
        this.hideOverlay();
    },

    /**
     * Mostra overlay de drop
     */
    showOverlay() {
        let overlay = document.getElementById('image-drop-overlay');
        if (overlay) return;

        overlay = document.createElement('div');
        overlay.id = 'image-drop-overlay';
        overlay.className = 'absolute inset-0 bg-emerald-900/20 flex items-center justify-center pointer-events-none z-10 border-2 border-dashed border-emerald-500 rounded-lg';
        overlay.innerHTML = `
            <div class="text-center">
                <div class="text-4xl mb-2">📷</div>
                <div class="text-emerald-400 font-medium">Solte a imagem aqui</div>
            </div>
        `;

        // Posicionar relativamente ao textarea
        const parent = this.dropZone.parentElement;
        if (parent) {
            parent.style.position = 'relative';
            parent.appendChild(overlay);
        }
    },

    /**
     * Esconde overlay
     */
    hideOverlay() {
        const overlay = document.getElementById('image-drop-overlay');
        if (overlay) {
            overlay.remove();
        }
    },

    /**
     * Processa o drop
     */
    async handleDrop(e) {
        const files = e.dataTransfer?.files;
        if (!files || files.length === 0) return;

        for (const file of files) {
            if (file.type.startsWith('image/')) {
                await this.processImage(file);
            }
        }
    },

    /**
     * Processa paste de imagem
     */
    async handlePaste(e) {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    e.preventDefault();
                    await this.processImage(file);
                }
            }
        }
    },

    /**
     * Processa arquivo de imagem
     */
    async processImage(file) {
        showToast('Processando imagem...');

        try {
            // Converter para base64
            const base64 = await this.fileToBase64(file);

            // Inserir markdown da imagem
            const markdown = `![${file.name}](${base64})`;
            this.insertAtCursor(markdown);

            showToast('Imagem inserida! ✓');
            console.log('[ImageDragDrop] Image inserted:', file.name);

        } catch (error) {
            console.error('[ImageDragDrop] Error:', error);
            showToast('Erro ao processar imagem');
        }
    },

    /**
     * Converte arquivo para base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * Insere texto na posição do cursor
     */
    insertAtCursor(text) {
        if (!this.textarea) return;

        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const value = this.textarea.value;

        this.textarea.value = value.substring(0, start) + text + value.substring(end);

        // Mover cursor para depois do texto inserido
        const newPosition = start + text.length;
        this.textarea.setSelectionRange(newPosition, newPosition);

        // Disparar evento input
        this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
};

// Export global
window.ImageDragDrop = ImageDragDrop;
