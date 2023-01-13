import { PathLike, promises as fs, existsSync } from 'fs';
import { createCanvas, loadImage } from 'canvas';
import { Grid } from './Grid';
import { GridNode } from './GridNode';
import { Tile, TilemapConfig, Tileset } from './types';
import { enhanceTileReference } from './utils/enhanceTileReference';
import readline from 'readline/promises';

import { program } from 'commander';
import { Console } from 'console';

const getJson = async <T>(path: PathLike): Promise<T> => {
    const file = await fs.readFile(path, 'utf-8');

    return JSON.parse(file);
};

function createTileMap(tileset: Tileset, tileMapConfig: TilemapConfig): Grid {
    const { width, height } = tileMapConfig;
    const { tiles } = tileset;

    const tilesWithPossibleConnections: Tile[] = tiles.map(enhanceTileReference);

    const g = new Grid(width, height, tilesWithPossibleConnections.length);

    const queue: GridNode[] = [];

    queue.push(g.root);

    while (queue.length > 0) {
        const curr = queue.shift();

        if (curr) {
            curr.collapse(tilesWithPossibleConnections);

            const neighbors: GridNode[] = Object.values(curr.neighbors).flatMap((n) =>
                n.isSome() ? [n.unwrap()] : []
            );

            for (const neighbor of neighbors) {
                if (!neighbor.collapsed && !queue.includes(neighbor)) {
                    queue.push(neighbor);
                }
            }
            queue.sort((a, b) => {
                if (a.entropy < b.entropy) {
                    return -1;
                }

                if (a.entropy > b.entropy) {
                    return 1;
                }

                return 0;
            });
        }
    }

    return g;
}

async function createImage(grid: Grid, tileset: Tileset, tileMapConfig?: { showGridLines?: boolean }): Promise<Buffer> {
    const { ref } = tileset;

    const { height, width } = grid;
    const { showGridLines = false } = tileMapConfig ?? {};
    const tileSize = ref.tileConfig.size;

    const tileCanvas = createCanvas(tileSize * ref.tileConfig.width, tileSize * ref.tileConfig.height);
    const tileCtx = tileCanvas.getContext('2d');

    const tileImage = await loadImage(ref.image);
    tileCtx.drawImage(tileImage, 0, 0);

    const canvas = createCanvas(width * tileSize, height * tileSize);
    const ctx = canvas.getContext('2d');

    let index = 0;
    for (const node of grid.nodes) {
        const tileIndex = node.value.unwrap().index;

        // position
        const s_x = tileIndex % ref.tileConfig.width;
        const s_y = Math.floor(tileIndex / ref.tileConfig.width);

        const d_x = index % width;
        const d_y = Math.floor(index / width);

        ctx.drawImage(
            tileImage,
            s_x * tileSize,
            s_y * tileSize,
            tileSize,
            tileSize,
            d_x * tileSize,
            d_y * tileSize,
            tileSize,
            tileSize
        );

        if (showGridLines) {
            ctx.strokeRect(d_x * tileSize + 0.5, d_y * tileSize + 0.5, tileSize, tileSize);
        }

        index++;
    }

    return canvas.toBuffer();
}

program
    .requiredOption('-t, --tileset <string>.json', 'You must provide a tileset')
    .requiredOption('-h, --height <number>', 'You must provide a tile height for the output png')
    .requiredOption('-w, --width <number>', 'You must provide a tile width for the output png')
    .requiredOption('-o, --out <string>.png', 'You must provide an output target')
    .option('-f, --force', 'Overwrite the current output file, if it already exists')
    .option('-d, --debug', 'Adds gridlines to the output png');

(async function main() {
    program.parse(process.argv);

    const {
        tileset: tilesetPath,
        height,
        width,
        debug,
        out,
        force,
    } = program.opts<{
        tileset: string;
        height: string;
        width: string;
        debug?: boolean;
        out: string;
        force?: boolean;
    }>();

    const tileset = await getJson<Tileset>(tilesetPath);

    const start = process.hrtime();
    const tileMap = createTileMap(tileset, {
        width: Number(width),
        height: Number(height),
    });
    let elapsed = process.hrtime(start)[1] / 1_000_000;
    let elapsedTimeReadable = [
        process.hrtime(start)[0] === 0 ? false : `${process.hrtime(start)[0]}s`,
        `${elapsed.toFixed(3)}ms`,
    ]
        .filter(Boolean)
        .join('');

    const map = await createImage(tileMap, tileset, { showGridLines: !!debug });

    const outExists = existsSync(out);

    if (outExists && !force) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        let answer = await rl.question(`A file with the name ${out} already exists. Overwrite? Y/N `);

        if (!['yes', 'no', 'y', 'n'].includes(answer.toLowerCase())) {
            answer = await rl.question('Please enter only Y(es)/N(o). ');
        }

        if (answer.toLowerCase().startsWith('n')) {
            console.log(
                'A file with the name',
                out,
                'already exists. \nChoose a new name or use -f to overwrite the existing file'
            );
            process.exit(0);
        } else {
            rl.close();
        }
    }

    await fs.writeFile(out, map);
    console.log('New map created at', out, '.');
    console.log('===== Details =====');
    console.log('Time to produce:', elapsedTimeReadable);
    console.log('Tilset:', tilesetPath);
    console.log('Tile size:', `${tileset.ref.tileConfig.size}px X ${tileset.ref.tileConfig.size}px`);
    console.log('Tile width:', width);
    console.log('Tile height:', height);
    if (debug) {
        console.log('*Grid Lines Included*');
    }
})();
