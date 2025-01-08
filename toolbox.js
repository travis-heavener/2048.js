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

Array.prototype.clear = function() {
    while (this.length) this.shift();
}

function bindKeyEvts() {
    $(window).on("keydown", (e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            interceptMove(e.key[5] === "L" ? LEFT : e.key[5] === "D" ? DOWN : e.key[5] === "R" ? RIGHT : UP);
        }
    });
}

function unbindKeyEvts() {
    $(window).off("keydown");
}

function adjustViewport() {
    // Calculate canvas dimensions
    const vw = window.innerWidth / 100;
    const vh = window.innerHeight / 100;

    dims.canvas = ~~Math.min(75 * vw, 65 * vh);
    dims.padding = 0.032 * dims.canvas;
    dims.tile = 0.21 * dims.canvas;
    dims.tileRadius = (dims.canvas - dims.padding) * dims.borderRadius;

    // Update canvas dimensions
    const oldCanvasWidth = canvas.width;
    canvas.width = canvas.height = dims.canvas;
    $(canvas).css({"width": canvas.width, "height": canvas.height, "borderRadius": dims.borderRadius * 100 + "%"});

    // Update each tile's position
    const scale = canvas.width / oldCanvasWidth;
    for (let row of grid) {
        for (let tile of row) {
            tile.rescale(scale);
        }
    }

    // Rerender the frame
    renderFrame();
}