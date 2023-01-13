import { Some, Result, Ok, Err } from 'iron-oxide';
import { GridNode } from './GridNode';
import { Tile } from './types';

export class Grid {
    width: number;
    height: number;

    nodes: GridNode[];

    numTiles: number;

    constructor(width: number, height: number, numTiles: number) {
        this.width = width;
        this.height = height;

        this.nodes = Array(width * height);
        this.numTiles = numTiles;

        this.fill();
    }

    private addNode(x: number, y: number) {
        const index = y * this.width + x;
        const node = new GridNode(this.numTiles);

        this.nodes[index] = node;

        const northNeighbor = this.getNode(x, y - 1);
        const eastNeighbor = this.getNode(x + 1, y);
        const southNeighbor = this.getNode(x, y + 1);
        const westNeighbor = this.getNode(x - 1, y);

        if (northNeighbor.isOk()) {
            const neighbor = northNeighbor.unwrap();

            node.neighbors.north = Some(neighbor);
            neighbor.neighbors.south = Some(node);
        }

        if (eastNeighbor.isOk()) {
            const neighbor = eastNeighbor.unwrap();

            node.neighbors.east = Some(neighbor);
            neighbor.neighbors.west = Some(node);
        }

        if (southNeighbor.isOk()) {
            const neighbor = southNeighbor.unwrap();

            node.neighbors.south = Some(neighbor);
            neighbor.neighbors.north = Some(node);
        }

        if (westNeighbor.isOk()) {
            const neighbor = westNeighbor.unwrap();

            node.neighbors.west = Some(neighbor);
            neighbor.neighbors.east = Some(node);
        }
    }

    private getNode(x: number, y: number): Result<GridNode, string> {
        if (x < 0 || x >= this.width) {
            return Err(`x out of bounds, got '${x}'`);
        }

        if (y < 0 || y >= this.height) {
            return Err(`y is out of bounds, got '${y}'`);
        }

        const index = y * this.width + x;
        const node = this.nodes[index];

        if (node) {
            return Ok(node);
        }

        return Err('Unable to find node at (${x}, ${y})');
    }

    get root() {
        return this.nodes[0];
    }

    private fill() {
        for (let j = 0; j < this.height; j++) {
            for (let i = 0; i < this.width; i++) {
                this.addNode(i, j);
            }
        }
    }
}
