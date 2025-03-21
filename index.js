/**
 * Travis Heavener
 */

/************** START CONF **************/

const CONF = {
    "frametimeMS": 1e3/90,
    "animMS": 65, // how long an animation takes visually & locks user input
    "endScreenDelayMS": 150 // how long to wait after a loss before displaying the end screen
};
Object.freeze(CONF);

const canvas = $("canvas")[0];
const ctx = canvas.getContext("2d");

/**************  END CONF  **************/
/************** START GAME FUNCTION **************/

let __gameInterval;
let __animStart = null;

let score = 0;
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
    // Initial viewport adjustment
    adjustViewport();

    // Bind keyboard evts
    bindKeyEvts();

    // Initialize game
    init();

    // Bind viewport change events
    $(window).on("resize", () => adjustViewport());
});

function interceptMove(direction) {
    if (__animStart) return; // skip concurrent inputs

    // Verify the direction has space to move
    if (!isDirectionAvailable(direction)) return;

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
                        score += prevValue; // Update user score
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
                        score += prevValue; // Update user score
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
                        score += prevValue; // Update user score
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
                        score += prevValue; // Update user score
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

// Returns true if there are adjacent tiles in the given direction that would combine or move
function isDirectionAvailable(direction) {
    switch (direction) {
        case LEFT: {
            // If there's a merge, push blank Tile
            for (let r = 0; r < 4; ++r) {
                let nextFreeCol = 0, prevValue = EMPTY;
                for (let c = 0; c < 4; ++c) {
                    // Skip empty tiles
                    const value = grid[r][c].value;
                    if (value === EMPTY) continue;

                    // Check for space to move
                    if (prevValue === value || c !== nextFreeCol) return true;
                    ++nextFreeCol; // Otherwise, increment the free column
                    prevValue = value;
                }
            }
            break;
        }
        case RIGHT: {
            // If there's a merge, push blank Tile
            for (let r = 0; r < 4; ++r) {
                let nextFreeCol = 3, prevValue = EMPTY;
                for (let c = 3; c >= 0; --c) {
                    // Skip empty tiles
                    const value = grid[r][c].value;
                    if (value === EMPTY) continue;

                    // Check for space to move
                    if (prevValue === value || c !== nextFreeCol) return true;
                    --nextFreeCol; // Otherwise, increment the free column
                    prevValue = value;
                }
            }
            break;
        }
        case UP: {
            // If there's a merge, push blank Tile
            for (let c = 0; c < 4; ++c) {
                let nextFreeRow = 0, prevValue = EMPTY;
                for (let r = 0; r < 4; ++r) {
                    // Skip empty tiles
                    const value = grid[r][c].value;
                    if (value === EMPTY) continue;

                    // Check for space to move
                    if (prevValue === value || r !== nextFreeRow) return true;
                    ++nextFreeRow; // Otherwise, increment the free column
                    prevValue = value;
                }
            }
            break;
        }
        case DOWN: {
            // If there's a merge, push blank Tile
            for (let c = 0; c < 4; ++c) {
                let nextFreeRow = 3, prevValue = EMPTY;
                for (let r = 3; r >= 0; --r) {
                    // Skip empty tiles
                    const value = grid[r][c].value;
                    if (value === EMPTY) continue;

                    // Check for space to move
                    if (prevValue === value || r !== nextFreeRow) return true;
                    --nextFreeRow; // Otherwise, increment the free column
                    prevValue = value;
                }
            }
            break;
        }
    }

    // Base case
    return false;
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

    // Update best score display
    $("#best-score-readout").html(localStorage.getItem("best-score") ?? 0);
}

function restartGame() {
    // Hide overlays
    $(".end-overlay").remove();

    // Reset keybinds
    bindKeyEvts();

    // Reset grid
    grid.clear();
    for (let r = 0; r < 4; ++r) {
        grid.push([
            new Tile(r, 0, EMPTY), new Tile(r, 1, EMPTY), new Tile(r, 2, EMPTY), new Tile(r, 3, EMPTY)
        ]);
    }

    // Reset user score
    score = 0;

    // Invoke init function
    init();
}

function endGame(isSuccess) {
    // Unbind key listeners
    unbindKeyEvts();

    // Update best score
    const currentBest = localStorage.getItem("best-score") ?? 0;
    if (score > currentBest) {
        localStorage.setItem("best-score", score);

        // Update best score display
        $("#best-score-readout").html(score);
    }

    // Reveal win/loss screen after delay
    setTimeout(() => {
        $("body").append(`
            <div class="end-overlay ${isSuccess ? 'win-overlay' : ''}">
                <h1>${isSuccess ? 'You win!' : 'Game over'}</h1>
                <button onclick="restartGame()">Try again</button>
            </div>
        `);

        $(".end-overlay").css({
            "top": canvas.offsetTop, "left": canvas.offsetLeft,
            "width": dims.canvas, "height": dims.canvas,
            "borderRadius": dims.canvas * dims.borderRadius
        });
    }, CONF.endScreenDelayMS);
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
        checkEndCondition();
    }
}

function checkEndCondition() {
    // Check for a win condition
    for (const row of grid) {
        for (const tile of row) {
            if (tile.value === 2048) {
                endGame(true);
                return;
            }
        }
    }

    // Check for loss condition (grid full & adjacents cannot merge)
    if (!isDirectionAvailable(LEFT) && !isDirectionAvailable(RIGHT) &&
        !isDirectionAvailable(UP) && !isDirectionAvailable(DOWN))
        endGame(false);
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

    // Update stats display
    $("#score-readout").html(score);
}

/**************  END RENDERER  **************/