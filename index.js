/**
 * Travis Heavener
 */

/************** START CONF **************/

const CONF = {
    "frametimeMS": 1e3/60,
    "animMS": 100 // how long an animation takes visually & locks user input
};
Object.freeze(CONF);

const canvas = $("canvas")[0];
const ctx = canvas.getContext("2d");

/**************  END CONF  **************/
/************** START GAME FUNCTION **************/

let __gameInterval;
let __animStart = null;

const EMPTY = 0;
const LEFT = 0, DOWN = 1, RIGHT = 2, UP = 3;
const grid = [[], [], [], []];
const gridBuf = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];

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

    // Bind keyboard evts
    $(window).on("keydown", (e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            interceptMove(e.key[5] === "L" ? LEFT : e.key[5] === "D" ? DOWN : e.key[5] === "R" ? RIGHT : UP);
        }
    });

    // Initialize game
    init();
});

function interceptMove(direction) {
    if (__animStart) return; // skip concurrent inputs

    // Update animation start
    __animStart = Date.now();

    // Update each Tile
    const numFrames = Math.ceil(CONF.animMS / CONF.frametimeMS);
    switch (direction) {
        case LEFT: {
            // If there's a merge, push blank Tile
            for (let r = 0; r < 4; ++r) {
                let nextFreeCol = 0, prevValue = EMPTY, hasCombined = false;

                for (let c = 0; c < 4; ++c) {
                    gridBuf[r][c] = EMPTY; // Reset the buffer

                    // Determine destination position
                    const tile = grid[r][c];
                    if (tile.value === EMPTY) continue; // Skip empty tiles

                    // Set the tile's animation
                    const willCombine = prevValue === tile.value && !hasCombined;
                    let cf = nextFreeCol;
                    if (willCombine) {
                        --cf;
                        gridBuf[r][cf] = prevValue = tile.value * 2; // Update buffer
                        hasCombined = true; // Update the stored previous value
                    } else {
                        gridBuf[r][cf] = prevValue = tile.value; // Update buffer
                        ++nextFreeCol; // Move the next free tile forward
                    }

                    tile.setAnimation(r, cf, numFrames);
                }
            }
            break;
        }
        case RIGHT: {
            // If there's a merge, push blank Tile
            for (let r = 0; r < 4; ++r) {
                let nextFreeCol = 3, prevValue = EMPTY, hasCombined = false;

                for (let c = 3; c >= 0; --c) {
                    gridBuf[r][c] = EMPTY; // Reset the buffer

                    // Determine destination position
                    const tile = grid[r][c];
                    if (tile.value === EMPTY) continue; // Skip empty tiles

                    // Set the tile's animation
                    const willCombine = prevValue === tile.value && !hasCombined;
                    let cf = nextFreeCol;
                    if (willCombine) {
                        ++cf;
                        gridBuf[r][cf] = prevValue = tile.value * 2; // Update buffer
                        hasCombined = true; // Update the stored previous value
                    } else {
                        gridBuf[r][cf] = prevValue = tile.value; // Update buffer
                        --nextFreeCol; // Move the next free tile forward
                    }

                    tile.setAnimation(r, cf, numFrames);
                }
            }
            break;
        }
        case UP: {
            // If there's a merge, push blank Tile
            for (let c = 0; c < 4; ++c) {
                let nextFreeRow = 0, prevValue = EMPTY, hasCombined = false;

                for (let r = 0; r < 4; ++r) {
                    gridBuf[r][c] = EMPTY; // Reset the buffer

                    // Determine destination position
                    const tile = grid[r][c];
                    if (tile.value === EMPTY) continue; // Skip empty tiles

                    // Set the tile's animation
                    const willCombine = prevValue === tile.value && !hasCombined;
                    let rf = nextFreeRow;
                    if (willCombine) {
                        --rf;
                        gridBuf[rf][c] = prevValue = tile.value * 2; // Update buffer
                        hasCombined = true; // Update the stored previous value
                    } else {
                        gridBuf[rf][c] = prevValue = tile.value; // Update buffer
                        ++nextFreeRow; // Move the next free tile forward
                    }

                    tile.setAnimation(rf, c, numFrames);
                }
            }
            break;
        }
        case DOWN: {
            // If there's a merge, push blank Tile
            for (let c = 0; c < 4; ++c) {
                let nextFreeRow = 3, prevValue = EMPTY, hasCombined = false;

                for (let r = 3; r >= 0; --r) {
                    gridBuf[r][c] = EMPTY; // Reset the buffer

                    // Determine destination position
                    const tile = grid[r][c];
                    if (tile.value === EMPTY) continue; // Skip empty tiles

                    // Set the tile's animation
                    const willCombine = prevValue === tile.value && !hasCombined;
                    let rf = nextFreeRow;
                    if (willCombine) {
                        ++rf;
                        gridBuf[rf][c] = prevValue = tile.value * 2; // Update buffer
                        hasCombined = true; // Update the stored previous value
                    } else {
                        gridBuf[rf][c] = prevValue = tile.value; // Update buffer
                        --nextFreeRow; // Move the next free tile forward
                    }

                    tile.setAnimation(rf, c, numFrames);
                }
            }
            break;
        }
    }
}

function init() {
    // Fill template grid
    for (let r = 0; r < 4; ++r)
        for (let c = 0; c < 4; ++c)
            grid[r].push(new Tile(r, c, EMPTY));

    // Place two initial tiles
    genTile(); genTile();

    // Start interval
    __gameInterval = setInterval(() => tick(), CONF.frametimeMS);
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
    let R = ~~(Math.random() * validRows.length);

    while (validRows.length && grid[R][0].value && grid[R][1].value && grid[R][2].value && grid[R][3].value) {
        validRows.splice(validRows.indexOf(R), 1); // Pop invalid row
        R = ~~(Math.random() * validRows.length);
    }

    if (!validRows.length)
        throw Error("Grid full.");
    
    // Select column
    const validCols = [0, 1, 2, 3];
    let C;
    do {
        C = ~~(Math.random() * validCols.length);
    } while (grid[R][C].value);

    // Place new tile
    grid[R][C].value = (Math.random() > 0.9) ? 4 : 2;
}

function tick() {
    // Handle animation mode
    if (__animStart !== null) {
        // Process animation tick
        let hasFinishedAnim = false;
        for (let row of grid)
            for (let tile of row)
                hasFinishedAnim |= tile.animTick();

        // Handle end of animation
        if (hasFinishedAnim) {
            // Reset animation timestamp
            __animStart = null;

            // Regenerate grid
            grid.clear();
            for (let r = 0; r < 4; ++r) {
                grid.push([
                    new Tile(r, 0, gridBuf[r][0]), new Tile(r, 1, gridBuf[r][1]),
                    new Tile(r, 2, gridBuf[r][2]), new Tile(r, 3, gridBuf[r][3])
                ]);
            }

            // Place new tile
            try {
                genTile();
            } catch (e) {
                // End failure
                console.warn("Game over (failure)");
                endGame(false);
            }
        }
    }

    // Update frame
    renderFrame();
}

/**************  END GAME FUNCTION  **************/
/************** START RENDERER **************/

function renderFrame() {
    // Clear the canvas
    ctx.clearRect(0, 0, dims.canvas, dims.canvas);

    // Draw the tile background
    for (let r = 0; r < 4; ++r) {
        const y = dims.padding + (dims.tile + dims.padding) * r;
        for (let c = 0; c < 4; ++c) {
            const x = dims.padding + (dims.tile + dims.padding) * c;
            ctx.fillStyle = getColor(EMPTY);
            ctx.beginPath();
            ctx.roundRect(x, y, dims.tile, dims.tile, dims.tileRadius);
            ctx.fill();
        }
    }

    // Render all the tiles
    for (let row of grid)
        for (let tile of row)
            tile.draw(ctx);
}

/**************  END RENDERER  **************/