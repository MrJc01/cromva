const CanvasNavigator = {
    historyStack: [],
    currentFileHandle: null,

    init() {
        // Initialize with null or current loaded board
        this.historyStack = [];
    },

    /**
     * Navigate to a new board file
     * @param {FileSystemFileHandle} fileHandle 
     */
    async navigateTo(fileHandle) {
        if (!fileHandle) return;

        // 1. Save current board if exists
        if (this.currentFileHandle) {
            await BoardPersistence.saveBoard(); // Force save
            this.historyStack.push(this.currentFileHandle);
        }

        // 2. Load new board
        this.currentFileHandle = fileHandle;
        await BoardPersistence.loadBoard(fileHandle);

        // 3. Update UI (Back button)
        this.updateBackButton();
    },

    /**
     * Go back to previous board
     */
    async goBack() {
        if (this.historyStack.length === 0) {
            // If stack is empty, go back to Dashboard
            if (this.currentFileHandle) {
                await BoardPersistence.saveBoard();
                this.currentFileHandle = null; // Clear current
            }
            if (window.CanvasList) window.CanvasList.show();
            this.updateBackButton();
            return;
        }

        // 1. Save current
        if (this.currentFileHandle) {
            await BoardPersistence.saveBoard();
        }

        // 2. Pop previous
        const prevHandle = this.historyStack.pop();
        this.currentFileHandle = prevHandle;

        // 3. Load
        await BoardPersistence.loadBoard(prevHandle);

        // 4. Update UI
        this.updateBackButton();
    },

    updateBackButton() {
        // Check if we need to create the button container
        let navContainer = document.getElementById('canvas-nav-controls');
        if (!navContainer) {
            this.createNavControls();
            navContainer = document.getElementById('canvas-nav-controls');
        }

        const backBtn = document.getElementById('canvas-back-btn');
        if (backBtn) {
            // If we have history OR we are currently editing a board (dashboard hidden), show back button
            // Actually, if we are in Editor (handle != null), Back button should take us to Dashboard or Prev Board.
            // So if currentHandle is set, show button.
            if (this.currentFileHandle) {
                backBtn.classList.remove('hidden');
            } else {
                backBtn.classList.add('hidden');
            }
        }
    },

    createNavControls() {
        const wrapper = document.getElementById('canvas-wrapper');
        if (!wrapper) return;

        const container = document.createElement('div');
        container.id = 'canvas-nav-controls';
        container.className = 'absolute top-4 left-4 z-10 flex gap-2';

        const backBtn = document.createElement('button');
        backBtn.id = 'canvas-back-btn';
        backBtn.className = 'hidden bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-2 rounded-lg shadow-lg border border-zinc-700 flex items-center gap-2 transition-all';
        backBtn.innerHTML = '<i data-lucide="arrow-left" class="w-4 h-4"></i> Voltar';
        backBtn.onclick = () => this.goBack();

        container.appendChild(backBtn);
        wrapper.appendChild(container); // Append to wrapper so it sits on top of canvas

        if (window.lucide) lucide.createIcons();
    }
};

window.CanvasNavigator = CanvasNavigator;
