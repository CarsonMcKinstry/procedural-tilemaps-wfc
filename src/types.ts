export interface TileReference {
    connectors: {
        north: string,
        east: string,
        south: string,
        west: string
    }
}

export interface Tile extends TileReference {
    index: number,
    possibleConnections: {
        north: number,
        east: number,
        south: number,
        west: number
    }
}

export type Tileset = {
    ref: {
        name: string,
        tileConfig: {
            size: number,
            height: number,
            width: number
        }
    },
    tiles: TileReference[];
}

export interface TilemapConfig {
    height: number,
    width: number
}