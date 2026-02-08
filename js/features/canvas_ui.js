const CanvasUI = {
    activeObject: null,

    init() {
        this.setupContextMenu();
        this.setupDragAndDrop();
        this.setupInspectorListeners();

        // Listen for context menu event from Fabric (fireRightClick: true)
        if (CanvasManager.canvas) {
            CanvasManager.canvas.on('mouse:down', (e) => {
                if (e.button === 3) {
                    // handled by native listener on wrapper usually
                }

                // Handle 3-dots click
                if (e.target && e.target.type === 'group' && e.target.customType === 'reference') {
                    const pointer = CanvasManager.canvas.getPointer(e.e);
                    // Check if click is on the "options" area (right side)
                    // We enabled subTargetCheck: true, so we can check e.subTargets if available in this version of fabric
                    // Or just check pointer relative to object

                    // For simplicity, double click is handled in 'mouse:dblclick'
                    // Single click on 3-dots? 
                    // Fabric v5 doesn't always expose subTargets easily in mouse:down event object props unless specific setup.
                    // We'll trust the Context Menu for "Settings" or Double Click for "Open"
                }
            });

            // Double click to open reference OR edit Note text
            CanvasManager.canvas.on('mouse:dblclick', (e) => {
                const target = e.target;
                if (!target) return;

                if (target.customType === 'reference') {
                    this.openReference(target);
                } else if (target.customType === 'note') {
                    // It's a group. We need to find the Textbox inside and enter editing.
                    // Usually item[1] is the text based on createNote
                    const items = target.getObjects();
                    const textBox = items.find(i => i.type === 'textbox');

                    if (textBox) {
                        // We need to ungroup temporarily or simpler: provide a way to edit text.
                        // Fabric Group editing is tricky. 
                        // Strategy: 
                        // 1. Hide the group text
                        // 2. Create a temporary IText on top, let user edit
                        // 3. On update, save back to group

                        // BETTER STRATEGY for simple "Post-it":
                        // Just let the user edit the group? No, Group doesn't have enterEditing.

                        // Standard Fabric approach:
                        // We can use 'subTargetCheck' (which we enabled).
                        // But double click event e.subTargets might help.

                        // Let's try the "SetActiveObject" approach if Fabric supports it, 
                        // but for Groups usually we need to access the child.

                        // Since we want a simple experience:
                        // Let's prompt for new text or use a temporary editor.
                        // Or, we can use the "Editing" mode of the Textbox if we extract it.

                        this.enterGroupTextEditing(target, textBox);
                    }
                }
            });

            // Listen to canvas selection events
            CanvasManager.canvas.on('selection:created', (e) => this.onSelectionCreated(e));
            CanvasManager.canvas.on('selection:updated', (e) => this.onSelectionCreated(e));
            CanvasManager.canvas.on('selection:cleared', () => this.onSelectionCleared());
        }
    },

    enterGroupTextEditing(group, textBox) {
        const canvas = CanvasManager.canvas;

        // Use Fabric's matrix transform to find absolute coordinates
        // textBox.left/top are relative to group center
        // We need to transform (textBox.left, textBox.top) by group.calcTransformMatrix()

        const groupMatrix = group.calcTransformMatrix();
        const textPoint = new fabric.Point(textBox.left, textBox.top);
        const absolutePoint = fabric.util.transformPoint(textPoint, groupMatrix);

        // Also need to account for text offset if origin is different
        // Textbox default origin is Top/Left. Group default origin is Center (when in group).
        // Wait, objects in group are relative to group center.

        const textValue = textBox.text;

        // Calculate effective scale
        const scaleX = group.scaleX;
        const scaleY = group.scaleY;

        const editable = new fabric.IText(textValue, {
            left: absolutePoint.x,
            top: absolutePoint.y,
            width: textBox.width, // Groups don't scale width/height, they scale scaleX/Y
            fontSize: textBox.fontSize * scaleX, // Approximate scale
            fontFamily: textBox.fontFamily,
            fill: textBox.fill,
            lineHeight: textBox.lineHeight,
            originX: 'left', // Match typical text origin
            originY: 'top',
            hasControls: false,
            scaleX: 1, // Reset scale since we baked it into fontSize or width? 
            // Better: inherit scale
            // scaleX: scaleX, 
            // scaleY: scaleY,
            // If we use scale, then fontSize should be original.
        });

        // Better approach for IText overlay:
        // Use the exact same properties but transformed.
        editable.set({
            scaleX: scaleX,
            scaleY: scaleY,
            fontSize: textBox.fontSize,
            angle: group.angle
        });

        // Hide original text
        const originalOpacity = textBox.opacity;
        textBox.set('opacity', 0);
        group.addWithUpdate(); // trigger refresh
        canvas.renderAll();

        canvas.add(editable);
        canvas.setActiveObject(editable);
        editable.enterEditing();
        editable.selectAll();

        // On finish
        editable.on('editing:exited', () => {
            // Update original
            const newText = editable.text;
            textBox.set('text', newText);
            textBox.set('opacity', originalOpacity);

            // Remove temp
            canvas.remove(editable);

            // Update Group
            // We need to check if group size needs adjustment? 
            // For now, fixed size note.
            group.addWithUpdate();
            canvas.setActiveObject(group);
            group.set('content', newText); // Sync custom prop
            canvas.renderAll();

            if (typeof BoardPersistence !== 'undefined') BoardPersistence.autoSave();
        });
    },

    setupContextMenu() {
        // Native context menu override
        const canvasWrapper = document.getElementById('canvas-wrapper');
        if (canvasWrapper) {
            canvasWrapper.addEventListener('contextmenu', (e) => this.showContextMenu(e));
        }

        // Global click to hide context menu
        window.addEventListener('click', () => {
            const menu = document.getElementById('canvas-context-menu');
            if (menu) menu.classList.add('hidden');
        });

        // Disable default context menu on canvas
        if (CanvasManager.canvas) {
            CanvasManager.canvas.on('mouse:down', (e) => {
                if (e.button === 3) {
                    // handled by native listener on wrapper usually
                }
            });
        }
    },

    setupInspectorListeners() {
        // Listeners for inspector actions if needed
        // Currently handled by direct onclick events in renderInspector
    },

    async openReference(target) {
        const type = target.refType;
        const name = target.refName;
        // Try to find handle in WorkspaceManager
        let handle = target.fileHandle;

        if (!handle) {
            // Try to resolve by name from current workspace
            // This is a naive lookup, assuming unique names or flat structure match
            // Ideally we store relative path

            if (typeof window.getWorkspaceFiles === 'function' && window.currentWorkspaceId) {
                const files = window.getWorkspaceFiles(window.currentWorkspaceId);
                const match = files.find(f => f.name === name);
                if (match) handle = match.handle;
            }
        }

        if (!handle) {
            // Error handling
            if (name === 'LocalStorage' || name === 'Virtual') {
                showToast('Não é possível abrir uma pasta diretamente.', 'info');
                return;
            }
            console.error('File handle not found for reference:', name);
            showToast(`Arquivo "${name}" não encontrado.`, 'error');
            return;
        }

        if (type === 'board') {
            if (CanvasNavigator) await CanvasNavigator.navigateTo(handle);
        } else if (type === 'note') {
            // Open in preview/editor
            // Assuming we have a global function or event to open note
            if (window.openNoteByHandle) window.openNoteByHandle(handle);
            else if (window.loadNote) window.loadNote(handle); // Fallback
        }
    },

    /**
     * Handle Right Click
     */
    showContextMenu(e) {
        e.preventDefault();
        const menu = document.getElementById('canvas-context-menu');
        const canvas = CanvasManager.canvas;
        const pointer = canvas.getPointer(e);
        const activeObj = canvas.findTarget(e, false);

        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;
        menu.classList.remove('hidden');

        let items = [];

        if (activeObj) {
            canvas.setActiveObject(activeObj);
            canvas.renderAll();

            if (activeObj.customType === 'reference') {
                items = [
                    { label: 'Abrir', icon: 'external-link', action: () => this.openReference(activeObj) },
                    { type: 'separator' },
                    { label: 'Duplicar', icon: 'copy', action: () => this.duplicateObject(activeObj) },
                    { label: 'Trazer para Frente', icon: 'arrow-up', action: () => activeObj.bringToFront() },
                    { label: 'Enviar para Trás', icon: 'arrow-down', action: () => activeObj.sendToBack() },
                    { type: 'separator' },
                    { label: 'Excluir', icon: 'trash', action: () => this.deleteObject(activeObj), color: 'text-red-400' }
                ];
            } else {
                items = [
                    { label: 'Duplicar', icon: 'copy', action: () => this.duplicateObject(activeObj) },
                    { label: 'Trazer para Frente', icon: 'arrow-up', action: () => activeObj.bringToFront() },
                    { label: 'Enviar para Trás', icon: 'arrow-down', action: () => activeObj.sendToBack() },
                    { type: 'separator' },
                    { label: 'Excluir', icon: 'trash', action: () => this.deleteObject(activeObj), color: 'text-red-400' }
                ];
            }
        } else {
            // Empty Space Menu
            items = [
                { label: 'Nova Nota', icon: 'sticky-note', action: () => this.addObject('note', pointer.x, pointer.y) },
                { label: 'Texto', icon: 'type', action: () => this.addObject('text', pointer.x, pointer.y) },
                { label: 'Referenciar Arquivo', icon: 'link', action: () => this.addReference(pointer.x, pointer.y) },
                { type: 'separator' },
                { label: 'Colar', icon: 'clipboard', action: () => this.pasteFromClipboard(pointer) }
            ];
        }

        this.renderMenu(menu, items);
    },

    async addReference(x, y) {
        if (!window.PickerUnified) {
            console.error('PickerUnified not found');
            return;
        }

        try {
            const file = await window.PickerUnified.openFile({ multiple: false });
            if (file) {
                // Determine type
                const isBoard = file.name.endsWith('.board');
                const type = isBoard ? 'board' : 'note';

                const refObj = CanvasObjects.createReferenceNode(file.handle || { name: file.name }, type, x, y);
                if (file.handle) refObj.set('fileHandle', file.handle);

                CanvasManager.canvas.add(refObj);
                CanvasManager.canvas.setActiveObject(refObj);
                if (typeof BoardPersistence !== 'undefined') BoardPersistence.autoSave();
            }
        } catch (err) {
            console.error('Error adding reference:', err);
        }
    },

    renderMenu(container, items) {
        container.innerHTML = '';
        items.forEach(item => {
            if (item.type === 'separator') {
                const hr = document.createElement('div');
                hr.className = 'h-px bg-zinc-700 my-1 mx-2';
                container.appendChild(hr);
                return;
            }

            const btn = document.createElement('button');
            btn.className = 'w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-zinc-800 text-xs text-zinc-300 transition-colors';
            if (item.color) btn.classList.add(item.color);

            btn.innerHTML = `<i data-lucide="${item.icon}" class="w-3.5 h-3.5"></i> ${item.label}`;
            btn.onclick = () => {
                item.action();
                container.classList.add('hidden');
                if (window.lucide) lucide.createIcons();
            };
            container.appendChild(btn);
        });
        if (window.lucide) lucide.createIcons();
    },

    handleImageUploadFromButton(x, y) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) this.handleFileUpload(file, x, y);
        };
        input.click();
    },

    setupDragAndDrop() {
        const dropZone = document.getElementById('canvas-wrapper');

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();

            // Calculate Drop Position in Canvas Config
            // wrapper offset
            const rect = dropZone.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Transform to Canvas Coordinates
            const pointer = CanvasManager.canvas.restorePointerVpt({ x, y });

            // 1. Check for Dragged Toolbar Item
            const type = e.dataTransfer.getData('type'); // Set in dragstart
            if (type) {
                this.addObject(type, pointer.x, pointer.y);
                return;
            }

            // 2. Check for External Files (Images)
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                this.handleFileUpload(e.dataTransfer.files[0], pointer.x, pointer.y);
            }
        });

        // Setup Toolbar Draggables
        document.querySelectorAll('.draggable-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('type', item.dataset.type);
            });
        });
    },

    async addObject(type, x, y, content = null) {
        // If coords missing, use Viewport Center
        if (x === undefined || y === undefined) {
            if (CanvasManager && CanvasManager.canvas) {
                const center = CanvasManager.canvas.getVpCenter();
                x = center.x - 100; // Offset to center object approx
                y = center.y - 100;
            } else {
                x = 100;
                y = 100;
            }
        }

        let obj;
        if (type === 'note') {
            obj = CanvasObjects.createNote(content || 'Nova Nota', x, y);
        } else if (type === 'text') {
            obj = CanvasObjects.createText('Texto', x, y);
        } else if (type === 'image') {
            // ... (rest same) -> NO, need to copy logic
            if (content) {
                // ...
            } else {
                this.handleImageUploadFromButton(x, y);
                return;
            }
        } else if (type === 'square') {
            obj = CanvasObjects.createSquare(x, y);
        }

        if (obj) {
            CanvasManager.canvas.add(obj);
            CanvasManager.canvas.setActiveObject(obj);
            CanvasManager.canvas.renderAll();

            if (typeof BoardPersistence !== 'undefined') BoardPersistence.autoSave();
        }
    },

    async handleFileUpload(file, x, y) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const img = await CanvasObjects.createImage(e.target.result, x, y);

                // Save logic: Store original file in ./assets
                if (typeof BoardPersistence !== 'undefined') {
                    // Logic to save file to disk (TODO)
                }

                CanvasManager.canvas.add(img);
                if (typeof BoardPersistence !== 'undefined') BoardPersistence.autoSave();
            };
            reader.readAsDataURL(file);
        }
    },

    deleteObject(obj) {
        CanvasManager.canvas.remove(obj);
        if (typeof BoardPersistence !== 'undefined') BoardPersistence.autoSave();
    },

    duplicateObject(obj) {
        obj.clone((cloned) => {
            CanvasManager.canvas.discardActiveObject();
            cloned.set({
                left: cloned.left + 20,
                top: cloned.top + 20,
                evented: true
            });
            if (cloned.type === 'activeSelection') {
                cloned.canvas = CanvasManager.canvas;
                cloned.forEachObject((o) => {
                    CanvasManager.canvas.add(o);
                });
                cloned.setCoords();
            } else {
                CanvasManager.canvas.add(cloned);
            }
            CanvasManager.canvas.setActiveObject(cloned);
            CanvasManager.canvas.requestRenderAll();
        });
    },

    // --- Property Inspector ---

    onSelectionCreated(e) {
        const selected = e.selected[0];
        if (!selected) return;
        this.renderInspector(selected);
    },

    onSelectionCleared() {
        document.getElementById('canvas-inspector').classList.add('hidden');
        document.getElementById('canvas-tools-panel').classList.remove('hidden');
    },

    renderInspector(obj) {
        const container = document.getElementById('canvas-inspector');
        const content = document.getElementById('inspector-content');
        const title = document.getElementById('inspector-title');

        document.getElementById('canvas-tools-panel').classList.add('hidden');
        container.classList.remove('hidden');
        content.innerHTML = '';

        // Determine type description
        let typeDesc = 'Elemento';
        if (obj.customType === 'note') typeDesc = 'Nota';
        else if (obj.type === 'i-text' || obj.type === 'textbox') typeDesc = 'Texto';
        else if (obj.type === 'image') typeDesc = 'Imagem';
        else if (obj.type === 'path') typeDesc = 'Desenho';

        title.innerText = typeDesc;

        // --- Color Property (if valid) ---
        if (obj.customType === 'note') {
            // For note group, we assume item[0] is Rect (bg) and item[1] is Text
            const rect = obj.getObjects()[0];
            const currentColor = rect.fill;

            this.addLabel(content, 'Cor de Fundo');
            const colors = ['#fef3c7', '#dbeafe', '#d1fae5', '#fce7f3', '#f4f4f5'];
            const palette = document.createElement('div');
            palette.className = 'flex gap-2';

            colors.forEach(c => {
                const dot = document.createElement('div');
                dot.className = `w-6 h-6 rounded-full cursor-pointer border border-zinc-600 ${c === currentColor ? 'ring-2 ring-white' : ''}`;
                dot.style.backgroundColor = c;
                dot.onclick = () => {
                    rect.set('fill', c);
                    CanvasManager.canvas.requestRenderAll();
                    if (typeof BoardPersistence !== 'undefined') BoardPersistence.autoSave();
                    this.renderInspector(obj); // Re-render to update ring
                };
                palette.appendChild(dot);
            });
            content.appendChild(palette);
        }

        if (obj.type === 'i-text' || obj.type === 'textbox' || (obj.customType === 'note' && obj.getObjects)) {
            // Font Size
            this.addLabel(content, 'Tamanho da Fonte');
            const sizeInput = document.createElement('input');
            sizeInput.type = 'range';
            sizeInput.min = 10;
            sizeInput.max = 72;

            let targetObj = obj;
            if (obj.customType === 'note') targetObj = obj.getObjects()[1];

            sizeInput.value = targetObj.fontSize;
            sizeInput.className = 'w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer';
            sizeInput.oninput = (e) => {
                targetObj.set('fontSize', parseInt(e.target.value));
                CanvasManager.canvas.requestRenderAll();
            };
            sizeInput.onchange = () => {
                if (typeof BoardPersistence !== 'undefined') BoardPersistence.autoSave();
            };
            content.appendChild(sizeInput);
        }

        // Delete Button
        const delBtn = document.createElement('button');
        delBtn.className = 'w-full mt-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded text-xs font-bold border border-red-900/30';
        delBtn.innerText = 'Excluir Elemento';
        delBtn.onclick = () => this.deleteObject(obj);
        content.appendChild(delBtn);
    },

    addLabel(container, text) {
        const l = document.createElement('div');
        l.className = 'text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2';
        l.innerText = text;
        container.appendChild(l);
    }
};

// Toggle Sidebar function called from HTML
window.toggleCanvasSidebar = function () {
    const sidebar = document.getElementById('canvas-sidebar');
    sidebar.classList.toggle('w-0');
    sidebar.classList.toggle('overflow-hidden');
    sidebar.classList.toggle('p-0');
    sidebar.classList.toggle('border-none');
};

window.CanvasUI = CanvasUI;
