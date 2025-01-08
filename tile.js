class Tile {
    #x;
    #y;
    #animDX; // distance traveled by each animation frame
    #animDY; // distance traveled by each animation frame
    #framesRemaining = 0;

    constructor(row, col, value) {
        this.row = row;
        this.col = col;
        this.value = value;
        this.#recalcPos();
    }

    #recalcPos() {
        // Calculate coordinates
        this.#x = dims.padding + (dims.tile + dims.padding) * this.col;
        this.#y = dims.padding + (dims.tile + dims.padding) * this.row;
    }

    draw(ctx) {
        if (!this.value) return;

        // Fill the tile
        ctx.fillStyle = getColor(this.value);
        ctx.beginPath();
        ctx.roundRect(this.#x, this.#y, dims.tile, dims.tile, dims.tileRadius);
        ctx.fill();

        // Draw number
        ctx.fillStyle = getTextColor(this.value);
        ctx.font = "650 " + getTextSize(this.value) + "px 'Open Sans'";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.value, this.#x + dims.tile / 2, this.#y + dims.tile * 0.525);
    }

    setAnimation(rf, cf, frames) {
        let xf = dims.padding + (dims.tile + dims.padding) * cf;
        let yf = dims.padding + (dims.tile + dims.padding) * rf;

        this.#animDX = Math.round((xf - this.#x) * 1e3) / 1e3 / frames;
        this.#animDY = Math.round((yf - this.#y) * 1e3) / 1e3 / frames;
        this.#framesRemaining = frames;
    }

    // Returns true after the last frame of the animation
    animTick() {
        if (this.value !== EMPTY) {
            this.#x += this.#animDX;
            this.#y += this.#animDY;
        }
        return !(--this.#framesRemaining);
    }
}