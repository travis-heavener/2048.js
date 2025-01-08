/**
 * Travis Heavener
 */

/************** START CONF **************/

const CONF = {
    "frametimeMS": 1e3/75,
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
    bindKeyEvts();

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

    // Invoke tick cycle
    tick();
}

function init() {
    // Fill template grid
    for (let r = 0; r < 4; ++r)
        for (let c = 0; c < 4; ++c)
            grid[r].push(new Tile(r, c, EMPTY));

    // Place two initial tiles
    genTile(); genTile();

    // Initial render
    renderFrame();
}

function endGame(isSuccess) {
    // TODO: Reveal win/loss screen
    console.warn("Game over");

    // Unbind key listeners
    unbindKeyEvts();
}

// Create a new tile in an open space, throws an Error when full
function genTile() {
    // Find all valid rows
    const validRows = [];
    for (let r = 0; r < 4; ++r) {
        for (let c = 0; c < 4; ++c) {
            if (grid[r][c].value === EMPTY) {
                validRows.push(r);
                break;
            }
        }
    }

    // Abort tile generation if the grid is full
    if (!validRows.length) return;

    // Select row
    const R = validRows[~~(Math.random() * validRows.length)];

    // Find all valid cols
    const validCols = [];
    for (let c = 0; c < 4; ++c)
        if (grid[R][c].value === EMPTY)
            validCols.push(c);

    // Select column
    const C = validCols[~~(Math.random() * validCols.length)];

    // Place new tile
    grid[R][C].value = (Math.random() > 0.9) ? 4 : 2;
}

function tick() {
    const startMS = Date.now();

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
            genTile();
        }
    }

    // Update frame
    renderFrame();

    // If still in an animation, queue another tick
    if (__animStart !== null) {
        const elapsedMS = Date.now() - startMS;
        setTimeout(() => tick(), Math.max(CONF.frametimeMS - elapsedMS, 0));
    } else {
        // Otherwise, check for win/loss

        // Check for a win condition
        winCheck:
        for (const row of grid) {
            for (const tile of row) {
                if (tile.value === 2048) {
                    endGame(true);
                    break winCheck;
                }
            }
        }

        // Check for loss condition (grid full & adjacents cannot merge)
        let hasLost = true;
        for (let r = 0; r < 4 && hasLost; ++r) {
            for (let c = 0; c < 4 && hasLost; ++c) {
                // If a tile is still empty, the game is not over
                if (grid[r][c].value === EMPTY) {
                    hasLost = false;
                    break;
                }
            }
        }

        // If the grid is full, check adjacents
        for (let r = 0; r < 4 && hasLost; ++r) {
            for (let c = 0; c < 4 && hasLost; ++c) {
                const value = grid[r][c].value;
                if ((c > 0 && grid[r][c-1].value === value) ||
                    (r > 0 && grid[r-1][c].value === value) ||
                    (c < 3 && grid[r][c+1].value === value) ||
                    (r < 3 && grid[r+1][c].value === value)) {
                        hasLost = false;
                        break;
                    }
            }
        }

        // Handle loss condition
        if (hasLost) endGame(false);
    }
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