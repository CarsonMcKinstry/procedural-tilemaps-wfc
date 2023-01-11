import { None, Option, Some } from "iron-oxide";
import { Tile } from "./types";

interface GridNodeNeighbors {
    north: Option<GridNode>;
    east: Option<GridNode>;
    south: Option<GridNode>;
    west: Option<GridNode>;
}

export class GridNode {
    value: Option<Tile> = None();

    neighbors: GridNodeNeighbors = {
        north: None(),
        east: None(),
        south: None(),
        west: None()
    }

    possibleTiles: number;
    collapsed: boolean = false;
    entropy: number = 0;

    constructor(numTiles: number) {
        this.possibleTiles = parseInt(
            "1".repeat(numTiles),
            2
        );
        this.calculateEntropy();
    }

    updatePossibleTiles() {
        if (!this.collapsed && this.entropy !== 1) {
            const original = this.possibleTiles;
            const { north, east, south, west } = this.neighbors;

            if (north.isSome() && north.unwrap().value.isSome()) {
                this.possibleTiles = this.possibleTiles & north.unwrap().value.unwrap().possibleConnections.south;
            }
            if (east.isSome() && east.unwrap().value.isSome()) {
                this.possibleTiles = this.possibleTiles & east.unwrap().value.unwrap().possibleConnections.west;
            }
            if (south.isSome() && south.unwrap().value.isSome()) {
                this.possibleTiles = this.possibleTiles & south.unwrap().value.unwrap().possibleConnections.north;
            }
            if (west.isSome() && west.unwrap().value.isSome()) {
                this.possibleTiles = this.possibleTiles & west.unwrap().value.unwrap().possibleConnections.east;
            }

            if (original !== this.possibleTiles) {
                this.calculateEntropy();
            }
        }
    }

    affectNeighbors() {
        const { north, east, south, west } = this.neighbors;
        if (north.isSome()) {
            north.unwrap().updatePossibleTiles();
        }
        if (east.isSome()) {
            east.unwrap().updatePossibleTiles();
        }
        if (south.isSome()) {
            south.unwrap().updatePossibleTiles();
        }
        if (west.isSome()) {
            west.unwrap().updatePossibleTiles();
        }
    }

    calculateEntropy() {
        this.entropy = this.possibleTiles
            .toString(2)
            .split('')
            .filter(val => val === '1')
            .length;
    }

    collapse(tiles: Tile[]) {
        if (this.collapsed) {
            return;
        }

        this.collapsed = true;

        const possibleTiles = this.possibleTiles
            .toString(2)
            .split('')
            .reverse()
            .flatMap((val, i) => val === '1' ? [i] : []);

        const i = Math.floor(Math.random() * possibleTiles.length);

        const randomTile = possibleTiles[
            i
        ];

        this.value = Some(
            tiles[randomTile]
        );

        this.possibleTiles = Math.pow(2, randomTile);

        this.affectNeighbors();
    }
}