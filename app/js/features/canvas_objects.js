const CanvasObjects = {

    addCommonProps(obj, type) {
        obj.set('customType', type);
        obj.set('cornerStyle', 'circle');
        obj.set('cornerColor', '#ffffff');
        obj.set('transparentCorners', false);
        obj.set('borderColor', '#3b82f6');
        obj.set('cornerStrokeColor', '#3b82f6');

        // Shadow for better depth
        obj.set('shadow', new fabric.Shadow({
            color: 'rgba(0,0,0,0.1)',
            blur: 10,
            offsetX: 5,
            offsetY: 5
        }));
    },

    /**
     * Create a Note (Text Box similar to Milanote)
     */
    createNote(text = 'Nova Nota', left = 100, top = 100, color = '#fef3c7') {

        // Background
        const rect = new fabric.Rect({
            width: 200,
            height: 200,
            fill: color,
            rx: 5,
            ry: 5,
            stroke: '#00000020',
            strokeWidth: 1,
            shadow: '0px 4px 10px rgba(0,0,0,0.2)',
            originX: 'left',
            originY: 'top'
        });

        // Text
        const textBox = new fabric.Textbox(text, {
            fontSize: 14,
            width: 180,
            left: 10,
            top: 10,
            fontFamily: 'Inter, sans-serif',
            fill: '#1f2937', // zinc-800
            splitByGrapheme: true,
            lockMovementX: true,
            lockMovementY: true,
            originX: 'left',
            originY: 'top',
            textBaseline: 'alphabetic'
        });

        const group = new fabric.Group([rect, textBox], {
            left: left,
            top: top,
            width: 200,
            height: 200,
            subTargetCheck: true,
            layout: 'note',
            lockScalingFlip: true,
            lockUniScaling: false,
            uniformScaling: false
        });

        // Store reference to type
        group.set('customType', 'note');
        // group.set('content', text); // moved to setter if needed, or just keep pure

        return group;
    },

    /**
     * Create generic text
     */
    createText(text = 'Texto simples', left, top) {
        return new fabric.IText(text, {
            left: left,
            top: top,
            fontFamily: 'Inter, sans-serif',
            fontSize: 16,
            fill: '#e4e4e7', // zinc-200
            textBaseline: 'alphabetic'
        });
    },

    /**
     * Create Image Object
     */
    async createImage(url, left, top) {
        return new Promise((resolve) => {
            fabric.Image.fromURL(url, (img) => {
                img.set({
                    left: left,
                    top: top,
                    scaleX: 0.5,
                    scaleY: 0.5,
                    cornerStyle: 'circle',
                    cornerColor: 'white',
                    transparentCorners: false
                });
                resolve(img);
            });
        });
    },

    /**
     * Create a Square
     */
    createSquare(x, y) {
        const rect = new fabric.Rect({
            left: x,
            top: y,
            width: 100,
            height: 100,
            fill: '#ef4444',
            rx: 10,
            ry: 10,
            stroke: '#b91c1c',
            strokeWidth: 2,
            hasControls: true,
            hasBorders: true
        });

        this.addCommonProps(rect, 'shape');
        return rect;
    },

    createCircle(x, y) {
        const circle = new fabric.Circle({
            left: x,
            top: y,
            radius: 50,
            fill: '#3b82f6', // blue-500
            stroke: '#1d4ed8',
            strokeWidth: 2
        });
        this.addCommonProps(circle, 'shape');
        return circle;
    },

    createTriangle(x, y) {
        const triangle = new fabric.Triangle({
            left: x,
            top: y,
            width: 100,
            height: 100,
            fill: '#10b981', // emerald-500
            stroke: '#047857',
            strokeWidth: 2
        });
        this.addCommonProps(triangle, 'shape');
        return triangle;
    },

    createDiamond(x, y) {
        // Rotated square or polygon
        const rect = new fabric.Rect({
            left: x,
            top: y,
            width: 70,
            height: 70,
            fill: '#f59e0b', // amber-500
            stroke: '#b45309',
            strokeWidth: 2,
            angle: 45
        });
        this.addCommonProps(rect, 'shape');
        return rect;
    },

    createLine(x, y) {
        const line = new fabric.Line([x, y, x + 100, y], {
            stroke: '#71717a', // zinc-500
            strokeWidth: 4,
            strokeLineCap: 'round'
        });
        this.addCommonProps(line, 'shape');
        line.set('customType', 'line'); // Override to avoid confusing with generic shape
        return line;
    },

    createArrow(x, y) {
        // Simple path arrow
        const arrow = new fabric.Path('M 0 0 L 100 0 L 90 -10 M 100 0 L 90 10', {
            left: x,
            top: y,
            stroke: '#a855f7', // purple-500
            strokeWidth: 4,
            fill: null,
            strokeLineCap: 'round',
            strokeLineJoin: 'round'
        });
        this.addCommonProps(arrow, 'shape');
        return arrow;
    },

    createStar(x, y) {
        // 5 points star
        // Points for a star... let's approximate or find standard points
        // Outer radius 50, inner 25
        const points = [
            { x: 50, y: 0 },
            { x: 61, y: 35 },
            { x: 98, y: 35 },
            { x: 68, y: 57 },
            { x: 79, y: 91 },
            { x: 50, y: 70 },
            { x: 21, y: 91 },
            { x: 32, y: 57 },
            { x: 2, y: 35 },
            { x: 39, y: 35 }
        ];

        // Normalize center? Fabric polygon handles origin.
        const star = new fabric.Polygon(points, {
            left: x,
            top: y,
            fill: '#ec4899', // pink-500
            stroke: '#be185d',
            strokeWidth: 2
        });
        this.addCommonProps(star, 'shape');
        return star;
    },

    createHexagon(x, y) {
        const points = [
            { x: 25, y: 0 },
            { x: 75, y: 0 },
            { x: 100, y: 43 },
            { x: 75, y: 86 },
            { x: 25, y: 86 },
            { x: 0, y: 43 }
        ];
        const hex = new fabric.Polygon(points, {
            left: x,
            top: y,
            fill: '#06b6d4', // cyan-500
            stroke: '#0e7490',
            strokeWidth: 2
        });
        this.addCommonProps(hex, 'shape');
        return hex;
    },

    /**
     * Create a Reference Node (Link to Board or File)
     */
    createReferenceNode(fileHandle, type = 'board', left, top) {
        const filename = fileHandle.name;

        const group = new fabric.Group([], {
            left: left,
            top: top,
            width: 260,
            height: 60,
            subTargetCheck: true,
            lockScalingX: true,
            lockScalingY: true
        });

        // Background
        const rect = new fabric.Rect({
            width: 260,
            height: 60,
            fill: '#27272a', // zinc-800
            rx: 8,
            ry: 8,
            stroke: '#3f3f46',
            strokeWidth: 1,
            shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        });

        // Icon based on type
        let iconColor = '#3b82f6'; // blue (board)
        if (type === 'note') iconColor = '#f59e0b'; // amber (note)

        const iconBg = new fabric.Circle({
            radius: 16,
            fill: iconColor,
            left: 14,
            top: 14
        });

        // Filename text
        const text = new fabric.Text(filename, {
            fontSize: 14,
            left: 55,
            top: 22,
            fontFamily: 'Inter, sans-serif',
            fill: '#ffffff',
            width: 160,
            textBaseline: 'alphabetic'
        });

        // 3 Dots Menu Icon (Visual only, click handled by mouse:down logic)
        // We simulate it with 3 small circles or a text "..."
        const optionsBtn = new fabric.Text('...', {
            fontSize: 24,
            left: 230,
            top: 10,
            fontFamily: 'Inter, sans-serif',
            fill: '#a1a1aa',
            selectable: false,
            hoverCursor: 'pointer',
            data: { isOptionsBtn: true } // Marker for event handler
        });

        group.addWithUpdate(rect);
        group.addWithUpdate(iconBg);
        group.addWithUpdate(text);
        group.addWithUpdate(optionsBtn);

        group.set('customType', 'reference');
        group.set('refType', type);
        group.set('fileHandle', fileHandle); // content is not serializable usually? 
        // Warning: LocalFileSystemHandle is serializable in IndexedDB but not via JSON.stringify directly for file saving?
        // We need a way to persist the reference. 
        // Ideally we store the path if possible, but web doesn't give path.
        // We rely on filename matching in current workspace or handle serialization if supported.
        // For now, we store name and try to resolve it from WorkspaceManager on load.
        group.set('refName', filename);

        return group;
    }
};

window.CanvasObjects = CanvasObjects;
