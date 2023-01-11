import { TileReference, Tile } from "../types";

type Direction = keyof TileReference['connectors'];

const complementDirections: Record<Direction, Direction> = {
    north: "south",
    east: "west",
    south: "north",
    west: "east"
}

const calculateConnection = (
    tile: TileReference,
    direction: Direction,
    allTiles: TileReference[]
) => {
    const complementDirection = complementDirections[direction];
    return allTiles
        .reduce((acc, otherTile, index) => {
            if (tile.connectors[direction] === otherTile.connectors[complementDirection]) {
                return acc + Math.pow(2, index);
            }

            return acc;
        }, 0);
};

export function enhanceTileReference(tile: TileReference, index: number, allTiles: TileReference[]): Tile {
    const north = calculateConnection(tile, 'north', allTiles);
    const east = calculateConnection(tile, 'east', allTiles);
    const south = calculateConnection(tile, 'south', allTiles);
    const west = calculateConnection(tile, 'west', allTiles);

    return {
        ...tile,
        index,
        possibleConnections: {
            north,
            east,
            south,
            west
        }
    }
}