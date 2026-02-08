const CanvasManager = {
    canvas: null,
    isPanning: false,
    isDrawing: false,
    lastPosX: 0,
    lastPosY: 0,
    zoomLevel: 1,

    // Configurações
    GRID_SIZE: 50,

    async init() {
        console.log('[CanvasManager] Initializing...');

        const canvasEl = document.getElementById('infinite-canvas');
        const container = document.getElementById('canvas-wrapper');

        if (!canvasEl || !container) {
            console.error('[CanvasManager] DOM elements not found.');
            return;
        }

        // Initialize Fabric
        this.canvas = new fabric.Canvas('infinite-canvas', {
            width: container.clientWidth,
            height: container.clientHeight,
            fireRightClick: true,  // Important for context menu
            stopContextMenu: true, // Prevent default browser context menu
            backgroundColor: '#18181b',
            selection: true
        });

        // Initialize Events
        this.setupEvents();
        this.resizeCanvas();

        // Runtime Validation for 'alphabetical' error
        this.canvas.on('object:added', (e) => {
            if (e.target && e.target.textBaseline === 'alphabetical') {
                console.warn('[CanvasManager] AUTO-FIX: Relentless "alphabetical" error detected on object creation!', e.target);
                e.target.set('textBaseline', 'alphabetic');
                this.canvas.requestRenderAll();
            }
        });

        // Expose to window for debugging
        window.canvas = this.canvas;

        console.log('[CanvasManager] Ready.');
    },

    setupEvents() {
        const self = this;

        // Resize
        window.addEventListener('resize', () => this.resizeCanvas());

        // Pan Tool Button
        const panBtn = document.getElementById('btn-pan-tool');
        if (panBtn) {
            panBtn.onclick = () => this.togglePanMode();
        }

        // Mouse Wheel (Zoom & Pan)
        this.canvas.on('mouse:wheel', function (opt) {
            const delta = opt.e.deltaY;
            const pointer = self.canvas.getPointer(opt.e);

            // Zoom (Ctrl + Wheel) or just Wheel depending on preference
            // Standard User Expectation: Wheel = Pan Vertical, Ctrl+Wheel = Zoom
            // But for Infinite Canvas: Wheel often Zoom, Space+Drag = Pan.

            // Let's implement: Wheel = Zoom centered on cursor
            let zoom = self.canvas.getZoom();
            zoom *= 0.999 ** delta;

            if (zoom > 5) zoom = 5;
            if (zoom < 0.1) zoom = 0.1;

            self.canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
            self.zoomLevel = zoom;
            self.updateZoomDisplay();

            opt.e.preventDefault();
            opt.e.stopPropagation();
        });

        // Panning (Spacebar + Drag OR Middle Click OR Right Click)
        this.canvas.on('mouse:down', function (opt) {
            const evt = opt.e;

            // Middle Click (1) or Right Click (2) or Spacebar/Pan Mode
            if (evt.button === 1 || evt.button === 2 || self.isPanningMode) {
                self.isPanning = true;
                self.canvas.selection = false;
                self.lastPosX = evt.clientX;
                self.lastPosY = evt.clientY;
                self.canvas.defaultCursor = 'grabbing';

                // Track start for Right Click to distinguish Click vs Drag
                if (evt.button === 2) {
                    self.rightClickRun = { x: evt.clientX, y: evt.clientY, isDrag: false };
                }
            }
        });

        this.canvas.on('mouse:move', function (opt) {
            if (self.isPanning && opt.e) {
                const e = opt.e;

                // Detect Drag Threshold for Right Click
                if (self.rightClickRun) {
                    const dist = Math.hypot(e.clientX - self.rightClickRun.x, e.clientY - self.rightClickRun.y);
                    if (dist > 5) self.rightClickRun.isDrag = true;
                }

                const vpt = self.canvas.viewportTransform;
                vpt[4] += e.clientX - self.lastPosX;
                vpt[5] += e.clientY - self.lastPosY;
                self.canvas.requestRenderAll();
                self.lastPosX = e.clientX;
                self.lastPosY = e.clientY;
            }
        });

        this.canvas.on('mouse:up', function (opt) {
            // On mouse up we calculate the new center point
            self.isPanning = false;

            // Handle Right Click: If it was a DRAG, suppress Context Menu
            if (opt.e.button === 2 && self.rightClickRun) {
                if (self.rightClickRun.isDrag) {
                    // It was a pan, flag it so context menu listener knows to ignore
                    self.wasRightClickPan = true;
                    setTimeout(() => self.wasRightClickPan = false, 100);
                }
                self.rightClickRun = null;
            }

            // Reset cursor if spacebar is not held (logic handled in keyboard events)
            if (self.isPanningMode) {
                self.canvas.defaultCursor = 'grab';
                self.canvas.selection = false; // Ensure selection stays off in pan mode
            } else {
                self.canvas.defaultCursor = 'default';
                self.canvas.selection = true;
            }

            // Persist State
            if (typeof BoardPersistence !== 'undefined') {
                BoardPersistence.autoSave();
            }
        });

        // Double Click to Open Inspector
        this.canvas.on('mouse:dblclick', (opt) => {
            if (opt.target) {
                if (CanvasUI) CanvasUI.openInspector(opt.target);
            } else {
                if (CanvasUI) CanvasUI.closeInspector();
            }
        });

        this.canvas.on('object:scaling', (e) => {
            const target = e.target;
            if (!target || target.customType !== 'note') return;

            const corner = e.transform.corner;

            // Map drag corner to opposite Anchor point (which stays fixed)
            const anchorMap = {
                'tl': { x: 'right', y: 'bottom' },
                'mt': { x: 'center', y: 'bottom' },
                'tr': { x: 'left', y: 'bottom' },
                'ml': { x: 'right', y: 'top' },
                'mr': { x: 'left', y: 'top' },
                'bl': { x: 'right', y: 'top' },
                'mb': { x: 'center', y: 'top' },
                'br': { x: 'left', y: 'top' }
            };

            const anchor = anchorMap[corner];
            if (!anchor) return;

            // 1. Capture absolute position of the Anchor Point BEFORE modifying dimensions
            const anchorPoint = target.getPointByOrigin(anchor.x, anchor.y);

            // 2. Calculate New Dimensions
            let newW = target.width * target.scaleX;
            let newH = target.height * target.scaleY;

            // 3. Enforce Constraints & Axis Locking
            if (corner === 'ml' || corner === 'mr') {
                newH = target.height;
                newW = Math.max(newW, 200);
            } else if (corner === 'mt' || corner === 'mb') {
                newW = target.width;
                newH = Math.max(newH, 200);
            } else {
                newW = Math.max(newW, 200);
                newH = Math.max(newH, 200);
            }

            // 4. Apply Dimensions to Group
            target.set({
                width: newW,
                height: newH,
                scaleX: 1,
                scaleY: 1
            });

            // 5. Update Children Manually (NO addWithUpdate)
            const items = target.getObjects();
            const bg = items[0];   // Rect
            const text = items[1]; // Textbox

            if (bg) {
                bg.set({
                    width: newW,
                    height: newH,
                    left: -newW / 2,
                    top: -newH / 2
                });
            }

            if (text) {
                text.set({
                    width: newW - 20,
                    left: -newW / 2 + 10,
                    top: -newH / 2 + 10
                });
            }

            // 6. Restore Position (Anchor Locking)
            target.setPositionByOrigin(anchorPoint, anchor.x, anchor.y);

            // 7. Update Controls
            target.setCoords();
        });

        // Keyboard Events (Spacebar for Panning)
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !self.isDrawing && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                // If not already in permanent pan mode
                if (!self.isPermanentPanMode) {
                    self.isPanningMode = true;
                    self.canvas.defaultCursor = 'grab';
                    self.canvas.selection = false; // Disable multi-selection rectangle
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                // Only revert if we are NOT in permanent pan mode (toggled via button)
                if (!self.isPermanentPanMode) {
                    self.isPanningMode = false;
                    self.isPanning = false;
                    self.canvas.defaultCursor = 'default';
                    self.canvas.selection = true;
                }
            }
        });
    },

    setTool(toolName) {
        this.currentTool = toolName;

        // Reset all states
        this.isPanningMode = false;
        this.isPermanentPanMode = false;
        this.isDrawing = false;
        if (this.canvas) {
            this.canvas.isDrawingMode = false;
            this.canvas.selection = true;
            this.canvas.defaultCursor = 'default';
        }
        this.canvas.discardActiveObject();
        this.canvas.requestRenderAll();

        // Update UI
        document.querySelectorAll('.active-tool').forEach(el => el.classList.remove('active-tool'));
        const toolBtn = document.getElementById(`tool-${toolName}`);
        if (toolBtn) toolBtn.classList.add('active-tool');

        // Config Cursor
        if (toolName === 'pan') {
            this.canvas.defaultCursor = 'grab';
            this.canvas.selection = false;
            this.isPanningMode = true;
            this.canvas.forEachObject(o => o.selectable = false);
        } else {
            this.canvas.defaultCursor = 'default';
            this.canvas.selection = true;
            this.isPanningMode = false;
            this.canvas.forEachObject(o => o.selectable = true);
        }

        if (toolName === 'draw') {
            this.canvas.isDrawingMode = true;
            // Configure brush...
        } else {
            this.canvas.isDrawingMode = false;
        }

        if (this.canvas) this.canvas.requestRenderAll();
    },

    togglePanMode() {
        // Legacy support or shortcut toggle
        if (this.currentTool === 'pan') {
            this.setTool('select');
        } else {
            this.setTool('pan');
        }
    },

    resizeCanvas() {
        if (!this.canvas) return;
        const container = document.getElementById('canvas-wrapper');
        if (container) {
            this.canvas.setWidth(container.clientWidth);
            this.canvas.setHeight(container.clientHeight);
            this.canvas.renderAll();
        }
    },

    adjustZoom(delta) {
        let zoom = this.canvas.getZoom();
        zoom += delta;
        if (zoom > 5) zoom = 5;
        if (zoom < 0.1) zoom = 0.1;

        // Center zoom
        this.canvas.setZoom(zoom);
        this.zoomLevel = zoom;
        this.updateZoomDisplay();
    },

    resetZoom() {
        this.canvas.setZoom(1);
        this.canvas.viewportTransform[4] = 0; // x
        this.canvas.viewportTransform[5] = 0; // y
        this.zoomLevel = 1;
        this.updateZoomDisplay();
    },

    updateZoomDisplay() {
        const el = document.getElementById('zoom-level');
        if (el) el.innerText = `${Math.round(this.zoomLevel * 100)}%`;
    },

    toggleDrawingMode() {
        this.isDrawing = !this.isDrawing;
        this.canvas.isDrawingMode = this.isDrawing;

        const btn = document.getElementById('tool-draw');
        if (this.isDrawing) {
            btn.classList.add('bg-emerald-500/20', 'border-emerald-500');

            // Setup Brush
            this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
            this.canvas.freeDrawingBrush.width = 3;
            this.canvas.freeDrawingBrush.color = '#ffffff';
        } else {
            btn.classList.remove('bg-emerald-500/20', 'border-emerald-500');
        }
    }

    // ... Methods for object addition will call CanvasObjects
};

// Make it global
window.CanvasManager = CanvasManager;
