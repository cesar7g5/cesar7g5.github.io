function BlocksSketch(p) {
    const CANVAS_WIDTH = 450;
    const CANVAS_HEIGHT = 600;
    const COLOR_SATURATION = 54;
    const COLOR_BRIGHTNESS = 90;
    const BASE_HUE_RANGE = 300;
    const HUE_RANGE = 160;
    const MIN_DIVISOR = 2;
    const MAX_DIVISOR = 20;
    const PROBABILITY_ADJACENT_X = 0.7;
    const PROBABILITY_ADJACENT_Y = 0.7;
  
    let colorPalette = [];
    let grid = [];
    let blockSize;
    let seedNum;
    let gradientStartColor;
    let gradientEndColor;
  
    p.setup = function () {
      p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT).parent('p5Canvas');
      p.colorMode(p.HSB, 360, 100, 100);
  
      // Initial setup with a default hash
      initializeSketch("0x95e793baa934c29a5f841d55fdab51b52c46d15b6bd604018e854fde3925ef7b");
    };
  
    function initializeSketch(transactionHash) {
      seedNum = convertHashToSeed(transactionHash);
      p.randomSeed(seedNum);
  
      let baseHue = p.floor(p.random() * BASE_HUE_RANGE);
      colorPalette = generateColorPalette(baseHue, HUE_RANGE, 10);
  
      blockSize = randomCommonDivisor(MIN_DIVISOR, MAX_DIVISOR);
      generateGrid();
      processGrid();
  
      gradientStartColor = p.color(50, 60, 100, 1);
      gradientEndColor = p.color(50, 60, 100, 0);
      applyGradientOverlay();
    }
  
    function generateColorPalette(baseHue, range, count) {
      let palette = [];
      for (let i = 0; i < count; i++) {
        let currentHue = (baseHue + i * (range / count)) % 360;
        palette.push(p.color(currentHue, COLOR_SATURATION, COLOR_BRIGHTNESS));
      }
      return palette;
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
          p.strokeWeight(1);
  
          if (x === 0 || grid[x - 1][y] !== currentColor) {
            p.line(x * blockSize, y * blockSize, x * blockSize, (y + 1) * blockSize);
          }
  
          if (y === 0 || grid[x][y - 1] !== currentColor) {
            p.line(x * blockSize, y * blockSize, (x + 1) * blockSize, y * blockSize);
          }
        }
      }
    }
  
    function randomCommonDivisor(minDivisor, maxDivisor) {
      let divisors = findCommonDivisors(p.width, p.height, minDivisor, maxDivisor);
      return divisors[Math.floor(p.random() * divisors.length)];
    }
  
    function findCommonDivisors(w, h, minDivisor, maxDivisor) {
      let divisors = [];
      for (let i = w / maxDivisor; i <= w / minDivisor; i++) {
        if (w % i === 0 && h % i === 0) {
          divisors.push(i);
        }
      }
      return divisors;
    }
  
    function applyGradientOverlay() {
      p.blendMode(p.OVERLAY);
      drawGradientOverlay();
      p.blendMode(p.BLEND);
    }
  
    function drawGradientOverlay() {
      p.noFill();
      for (let i = 0; i <= p.height; i++) {
        let inter = p.map(i, 0, p.height, 0, 1);
        let c = p.lerpColor(gradientStartColor, gradientEndColor, inter);
        p.stroke(c);
        p.line(0, i, p.width, i);
      }
    }
  
    function convertHashToSeed(hash) {
      let hashed = CryptoJS.SHA256(hash).toString(CryptoJS.enc.Hex);
      return parseInt(hashed.slice(0, 16), 16);
    }
  
    p.updateHash = function (newHash) {
      initializeSketch(newHash);
    };
  }
  
  // This creates an instance of the sketch
  let myp5 = new p5(BlocksSketch);
  