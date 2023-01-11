import { PathLike, promises as fs } from 'fs';
import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import { Grid } from './Grid';
import { GridNode } from './GridNode';
import { Tile, Tileset } from './types';
import { enhanceTileReference } from './utils/enhanceTileReference';

const tilesetJsonPath = path.resolve('./tileset.json');

const getJson = async <T>(path: PathLike): Promise<T> => {
    const file = await fs.readFile(path, "utf-8");

    return JSON.parse(file);
}

(async function main() {
    const { tiles, ref } = await getJson<Tileset>(tilesetJsonPath);

    const tilesWithPossibleConnections: Tile[] = tiles.map(enhanceTileReference);

    const width = 40;
    const height = 30;
    const g = new Grid(width, height, tilesWithPossibleConnections.length);

    const queue: GridNode[] = [];

    queue.push(g.root);

    while (queue.length > 0) {

        const curr = queue.shift();

        if (curr) {
            curr.collapse(tilesWithPossibleConnections);

            const neighbors: GridNode[] = Object.values(curr.neighbors).flatMap((n) => n.isSome() ? [n.unwrap()] : []);

            for (const neighbor of neighbors) {
                if (!neighbor.collapsed && !queue.includes(neighbor)) {
                    queue.push(neighbor);
                }
            }
            queue.sort((a, b) => {
                if (a.entropy < b.entropy) {
                    return - 1;
                }

                if (a.entropy > b.entropy) {
                    return 1;
                }

                return 0;
            });
        }
    }

    const tileSize = ref.tileConfig.size;

    const tileCanvas = createCanvas(tileSize * ref.tileConfig.width, tileSize * ref.tileConfig.height);
    const tileCtx = tileCanvas.getContext('2d');

    const tileImage = await loadImage('./tileset.png');
    tileCtx.drawImage(tileImage, 0, 0);

    const canvas = createCanvas(width * tileSize, height * tileSize);
    const ctx = canvas.getContext('2d');

    let index = 0;
    for (const node of g.nodes) {
        const tileIndex = node.value.unwrap().index;

        // position
        const s_x = tileIndex % ref.tileConfig.width;
        const s_y = Math.floor(tileIndex / ref.tileConfig.width);

        const d_x = index % width;
        const d_y = Math.floor(index / width);

        ctx.drawImage(
            tileImage,
            s_x * tileSize, s_y * tileSize, tileSize, tileSize,
            d_x * tileSize, d_y * tileSize, tileSize, tileSize
        )
        // ctx.strokeRect(
        //     d_x * tileSize + 0.5,
        //     d_y * tileSize + 0.5,
        //     tileSize, tileSize
        // )

        index++;
    }

    await fs.writeFile("out.png", canvas.toBuffer());

})();