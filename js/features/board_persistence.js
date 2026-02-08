const BoardPersistence = {
    currentFileHandle: null,
    debounceTimer: null,
    isDirty: false,

    async init(fileHandle) {
        console.log('[BoardPersistence] init called with handle:', fileHandle ? fileHandle.name : 'null');
        this.currentFileHandle = fileHandle;

        if (fileHandle) {
            await this.loadBoard(fileHandle);
        } else {
            // No file handle provided on startup -> Show Dashboard
            if (window.CanvasList) {
                window.CanvasList.show();
            } else {
                // Fallback if list module missing
                CanvasManager.canvas.clear();
                this.loadWelcomeTemplate();
            }
        }
    },

    async loadBoard(fileHandle) {
        this.currentFileHandle = fileHandle; // Critical: Update internal handle for auto-save
        try {
            const file = await fileHandle.getFile();
            const content = await file.text();

            if (!content) {
                this.loadWelcomeTemplate();
                return;
            }

            // DEBUG: Check raw content for key
            if (content.indexOf('alphabetical') !== -1) {
                console.warn('[BoardPersistence] DEBUG: Found "alphabetical" in raw JSON! Sanitization MUST fix this.');
            } else {
                console.log('[BoardPersistence] DEBUG: "alphabetical" NOT found in raw JSON.');
            }

            const data = JSON.parse(content);

            // Sanitization: Fix legacy 'alphabetical' typo
            this.sanitizeData(data);

            CanvasManager.canvas.loadFromJSON(data, () => {
                CanvasManager.canvas.renderAll();
                console.log('[BoardPersistence] Board loaded.');
            });
        } catch (e) {
            console.error('[BoardPersistence] Error loading board:', e);
            showToast('Erro ao carregar quadro.', 'error');
        }
    },

    // Recursive sanitization for any depth
    sanitizeData(data) {
        let fixedCount = 0;

        const traverse = (objects) => {
            if (!objects || !Array.isArray(objects)) return;

            objects.forEach(obj => {
                // Fix textBaseline
                if (obj.textBaseline === 'alphabetical') {
                    obj.textBaseline = 'alphabetic';
                    fixedCount++;
                }

                // Recurse into groups (standard objects array)
                if (obj.objects) {
                    traverse(obj.objects);
                }

                // Recurse into path groups or other structures
                if (obj.paths) {
                    // specific to some fabric versions or custom SVG imports
                }
            });
        };

        if (data.objects) traverse(data.objects);
        if (data.background && data.background.objects) traverse(data.background.objects);
        if (data.overlay && data.overlay.objects) traverse(data.overlay.objects);

        if (fixedCount > 0) {
            console.warn(`[BoardPersistence] FIXED: Sanitized ${fixedCount} 'alphabetical' errors in JSON data.`);
        } else {
            // Optional: Log that we checked but found nothing, to confirm it ran
            // console.log('[BoardPersistence] Sanitization check pass: No errors found.');
        }
    },

    autoSave() {
        this.isDirty = true;

        if (this.debounceTimer) clearTimeout(this.debounceTimer);

        this.debounceTimer = setTimeout(async () => {
            await this.saveBoard();
        }, 1000);
    },

    async saveBoard() {
        if (!this.currentFileHandle) {
            console.warn('[BoardPersistence] Cannot save: No file handle.');
            return;
        }

        try {
            // Serialize with all necessary custom properties
            const json = CanvasManager.canvas.toJSON([
                'customType',
                'layout',
                'lockMovementX',
                'lockMovementY',
                'content',
                'refType',
                'refName',
                'id',
                'selectable',
                'hasControls'
            ]);

            const content = JSON.stringify(json);

            // Use FSHandler to write
            if (typeof FSHandler !== 'undefined') {
                console.log('[BoardPersistence] Saving to file:', this.currentFileHandle.name);
                await FSHandler.saveFile(this.currentFileHandle, content);
                console.log('[BoardPersistence] Board saved successfully.');
            }

            this.isDirty = false;
        } catch (e) {
            console.error('[BoardPersistence] Save failed:', e);
            showToast('Erro ao salvar quadro.', 'error');
        }
    },

    loadWelcomeTemplate() {
        console.log('[BoardPersistence] Loading Template...');

        // Welcome Note
        const note = CanvasObjects.createNote('Bem-vindo ao Cromva Board!\n\nEste é um espaço infinito. Use:\n- Espaço + Drag para mover\n- Scroll para Zoom\n- Botão Direito para menu', 100, 100, '#ffeb3b');

        // Drawing Example
        const path = new fabric.Path('M 350 150 Q 400 100 450 150 T 550 150', {
            stroke: '#ef4444',
            strokeWidth: 5,
            fill: false,
            left: 350,
            top: 150
        });

        CanvasManager.canvas.add(note);
        CanvasManager.canvas.add(path);

        // Ensure objects are clean
        this.sanitizeObjects();

        CanvasManager.canvas.renderAll();
    },

    sanitizeObjects() {
        if (!CanvasManager || !CanvasManager.canvas) return;

        let fixedCount = 0;
        const traverse = (objects) => {
            if (!objects || !Array.isArray(objects)) return;

            objects.forEach(obj => {
                // Fix textBaseline using set() for runtime objects
                if (obj.textBaseline === 'alphabetical') {
                    obj.set('textBaseline', 'alphabetic');
                    fixedCount++;
                }

                // Recurse into groups
                // Note: getObjects() returns a copy or reference depending on version, 
                // but usually iterates children.
                if (obj.type === 'group' && typeof obj.getObjects === 'function') {
                    traverse(obj.getObjects());
                } else if (obj._objects && Array.isArray(obj._objects)) {
                    // Dig into internal objects if getObjects isn't available/sufficient
                    traverse(obj._objects);
                }
            });
        };

        traverse(CanvasManager.canvas.getObjects());

        if (fixedCount > 0) {
            console.warn(`[BoardPersistence] FIXED: Runtime sanitized ${fixedCount} 'alphabetical' errors.`);
            CanvasManager.canvas.requestRenderAll();
        }
    }
};

window.BoardPersistence = BoardPersistence;
