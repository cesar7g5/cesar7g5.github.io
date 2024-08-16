function BlocksSketch(p) {
    const CANVAS_WIDTH = 1024;
    const CANVAS_HEIGHT = 1024;
    const COLOR_SATURATION = 54;
    const COLOR_BRIGHTNESS = 90;
    const BASE_HUE_RANGE = 300;
    const HUE_RANGE = 170;
    const MIN_BLOCKS_PER_ROW = 4;
    const MAX_BLOCKS_PER_ROW = 18;


    const MIN_BLOCK_SIZE = CANVAS_WIDTH / MAX_BLOCKS_PER_ROW;
    const MAX_BLOCK_SIZE = CANVAS_WIDTH / MIN_BLOCKS_PER_ROW;


    const PROBABILITY_ADJACENT_X = 0.8;
    const PROBABILITY_ADJACENT_Y = 0.6;

    let colorPalette = [];
    let grid = [];
    let blockSize;
    let seedNum;
    let gradientStartColor;
    let gradientEndColor;

    p.setup = function () {

        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT).parent('p5Canvas');
        p.colorMode(p.HSB, 360, 100, 100);
        initializeSketch();

    };



    function initializeSketch() {


        let seed = stringToSeed($fx.hash);
        p.randomSeed(seed);


        let baseHue = p.floor(p.random() * BASE_HUE_RANGE);
        colorPalette = generateColorPalette(baseHue, HUE_RANGE, 10);


        let validSizes = findValidBlockSizes(CANVAS_WIDTH, CANVAS_HEIGHT, MIN_BLOCKS_PER_ROW, MAX_BLOCKS_PER_ROW);
        blockSize = selectBlockSizeWithBias(validSizes);

        generateGrid();
        processGrid();


        gradientStartColor = p.color(50, 60, 100, 1);
        gradientEndColor = p.color(50, 60, 100, 0);

        applyGradientOverlay();

        let applyGrayscale = p.random() < 0.025;

        if (applyGrayscale) {
            applyGrayscaleFilter();
        }
        let colorFeatureValue = applyGrayscale ? "Grayscale" : "Colorful";

        $fx.features({                      // Define features inside setup or another function
            "Color Palette": colorFeatureValue,  // Use the ternary operator for conditional logic
            "Grid Size": CANVAS_HEIGHT / blockSize  // Ensure proper object notation with commas
        });

    }

    function stringToSeed(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    function findValidBlockSizes(w, h, minBlocks, maxBlocks) {
        let sizes = [];
        for (let i = 1; i <= w; i++) {
            if (w % i === 0 && h % i === 0) {
                let blocksPerRow = w / i;
                if (blocksPerRow >= minBlocks && blocksPerRow <= maxBlocks) {
                    sizes.push(i);
                }
            }
        }
        return sizes;
    }

    function generateColorPalette(baseHue, range, count) {
        let palette = [];
        for (let i = 0; i < count; i++) {
            let currentHue = (baseHue + i * (range / count)) % 360;
            palette.push(p.color(currentHue, COLOR_SATURATION, COLOR_BRIGHTNESS));
        }
        return palette;
    }
    function selectBlockSizeWithBias(validSizes) {
        let weightedSizes = [];
        validSizes.forEach(size => {
            let weight = CANVAS_WIDTH / size; // Larger weight for smaller block sizes
            for (let i = 0; i < weight; i++) {
                weightedSizes.push(size);
            }
        });

        // Select a block size from the weighted array
        return weightedSizes[Math.floor(p.random(weightedSizes.length))];
    }

    function applyGrayscaleFilter() {
        p.filter(p.GRAY);
    }

    function generateGrid() {
        let numBlocksX = p.width / blockSize;
        let numBlocksY = p.height / blockSize;

        for (let x = 0; x < numBlocksX; x++) {
            grid[x] = [];
            for (let y = 0; y < numBlocksY; y++) {
                grid[x][y] = chooseColorForBlock(x, y);
                drawBlock(x, y);
            }
        }
    }

    function chooseColorForBlock(x, y) {
        if (x > 0 && p.random() < PROBABILITY_ADJACENT_X) {
            return grid[x - 1][y];
        } else if (y > 0 && p.random() < PROBABILITY_ADJACENT_Y) {
            return grid[x][y - 1];
        }
        return colorPalette[Math.floor(p.random() * colorPalette.length)];
    }

    function drawBlock(x, y) {
        p.noStroke();
        p.fill(grid[x][y]);
        p.rect(x * blockSize, y * blockSize, blockSize, blockSize);
    }

    function processGrid() {
        for (let x = 0; x < grid.length; x++) {
            for (let y = 0; y < grid[x].length; y++) {
                let currentColor = grid[x][y];
                p.stroke(0);
                p.strokeWeight(0);

                if (x === 0 || grid[x - 1][y] !== currentColor) {
                    p.line(x * blockSize, y * blockSize, x * blockSize, (y + 1) * blockSize);
                }

                if (y === 0 || grid[x][y - 1] !== currentColor) {
                    p.line(x * blockSize, y * blockSize, (x + 1) * blockSize, y * blockSize);
                }
            }
        }
    }

    function applyGradientOverlay() {
        p.blendMode(p.OVERLAY);
        drawGradientOverlay();
        p.blendMode(p.BLEND);
    }

    function drawGradientOverlay() {
        p.noFill();
        for (let i = 0; i <= p.height; i++) {
            let inter = p.map(i, 0, p.height, 0.25, 1);
            let c = p.lerpColor(gradientStartColor, gradientEndColor, inter);
            p.strokeWeight(1);
            p.stroke(c);
            p.line(0, i, p.width, i);
        }
    }
}


// This creates an instance of the sketch
let myp5 = new p5(BlocksSketch);
