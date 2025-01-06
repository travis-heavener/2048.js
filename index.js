/**
 * Travis Heavener
 */

/************** START CONF **************/

const CONF = {
    "frametimeMS": 1e3/30
};
Object.freeze(CONF);

const canvas = $("canvas")[0];
const ctx = canvas.getContext("2d");

/**************  END CONF  **************/
/************** START GAME FUNCTION **************/

let __gameInterval;

const EMPTY = 0;
const grid = [
    [EMPTY, EMPTY, EMPTY, EMPTY],
    [EMPTY, EMPTY, EMPTY, EMPTY],
    [EMPTY, EMPTY, EMPTY, EMPTY],
    [EMPTY, EMPTY, EMPTY, EMPTY]
];

const dims = {
    "canvas":       null,
    "padding":      null, // padding between rows, 16% total width/height
    "tile":         null, // size of tile, 84% total width/height
    "borderRadius": 0.015,
    "tileRadius":   null // borderRadius for tiles
};

$(document).ready(() => {
    // Calculate canvas dimensions
    const vw = window.innerWidth / 100;
    const vh = window.innerHeight / 100;

    dims.canvas = ~~Math.min(75 * vw, 65 * vh);
    dims.padding = 0.032 * dims.canvas;
    dims.tile = 0.21 * dims.canvas;
    dims.tileRadius = (dims.canvas - dims.padding) * dims.borderRadius;
    Object.freeze(dims);

    // Update canvas dimensions
    canvas.width = canvas.height = dims.canvas;
    $(canvas).css({"width": canvas.width, "height": canvas.height, "borderRadius": dims.borderRadius * 100 + "%"});

    // Initialize game
    init();
});

function init() {
    // Place two initial tiles
    genTile(); genTile();

    // Start interval
    __gameInterval = setInterval(() => renderFrame(), CONF.frametimeMS);
}

function endGame(isSuccess) {
    // TODO: Reveal win/loss screen

    // Clear game interval
    clearInterval(__gameInterval);
}

// Create a new tile in an open space, throws an Error when full
function genTile() {
    // Select row
    const validRows = [0, 1, 2, 3];
    let R;
    do {
        R = ~~(Math.random() * validRows.length);
    } while (validRows.length && grid[R][0] && grid[R][1] && grid[R][2] && grid[R][3]);

    if (!validRows.length)
        throw Error("Grid full.");

    // Select column
    const validCols = [0, 1, 2, 3];
    let C;
    do {
        C = ~~(Math.random() * validCols.length);
    } while (grid[R][C]);

    // Place new tile
    grid[R][C] = (Math.random() > 0.9) ? 4 : 2;
}

/**************  END GAME FUNCTION  **************/
/************** START RENDERER **************/

function renderFrame() {
    // Clear the canvas
    ctx.clearRect(0, 0, dims.canvas, dims.canvas);

    // Render all the tiles
    for (let r = 0, y = dims.padding; r < 4; ++r, y += dims.tile + dims.padding) {
        for (let c = 0, x = dims.padding; c < 4; ++c, x += dims.tile + dims.padding) {
            const value = grid[r][c];

            // Fill the tile
            ctx.fillStyle = getColor(value);
            ctx.beginPath();
            ctx.roundRect(x, y, dims.tile, dims.tile, dims.tileRadius);
            ctx.fill();

            if (!value) continue;

            // Draw number
            ctx.fillStyle = getTextColor(value);
            ctx.font = "650 " + getTextSize(value) + "px 'Open Sans'";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(value, x + dims.tile / 2, y + dims.tile * 0.525);
        }
    }
}

/**************  END RENDERER  **************/
/************** START TOOLS **************/

function getColor(n) {
    switch (n) {
        case EMPTY: return "#cac0b4";
        case 2:     return "#ece5db";
        case 4:     return "#ebe0ca";
        case 8:     return "#e8b482";
        case 16:    return "#e89a6c";
        case 32:    return "#e68266";
        case 64:    return "#e46747";
        case 128:   return "#ead17f";
        case 256:   return "#e8cd6f";
        case 512:   return "#e7c966";
        case 1024:  return "#edc53f";
        case 2048:  return "#edc22d";
        default:    return "#3e3933"; // 4096+
    }
}

function getTextColor(n) {
    return (n === 2 || n === 4) ? "#716b61" : "#f5f9f0";
}

function getTextSize(n) {
    return (n < 1e3) ? (~~(dims.tile * 0.45)) : (~~(dims.tile * 0.33));
}

/**************  END TOOLS  **************/