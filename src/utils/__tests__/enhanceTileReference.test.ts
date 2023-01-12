import { Tile, Tileset } from '../../types';
import { enhanceTileReference } from '../enhanceTileReference';

describe('enhanceTileRefernce', () => {
    const tileset: Tileset = {
        ref: {
            image: '',
            tileConfig: {
                size: 0,
                height: 0,
                width: 0,
            },
        },
        tiles: [
            {
                connectors: {
                    north: '11',
                    east: '10',
                    south: '10',
                    west: '11',
                },
            },
            {
                connectors: {
                    north: '11',
                    east: '11',
                    south: '01',
                    west: '10',
                },
            },
            {
                connectors: {
                    north: '10',
                    east: '01',
                    south: '11',
                    west: '11',
                },
            },
            {
                connectors: {
                    north: '01',
                    east: '11',
                    south: '11',
                    west: '01',
                },
            },
        ],
    };

    it('should correctly enhance each tile', () => {
        const out = tileset.tiles.map(enhanceTileReference);

        const expected: Tile[] = [
            {
                index: 0,
                connectors: {
                    north: '11',
                    east: '10',
                    south: '10',
                    west: '11',
                },
                possibleConnections: {
                    north: 12,
                    east: 2,
                    south: 4,
                    west: 10,
                },
            },
            {
                index: 1,
                connectors: {
                    north: '11',
                    east: '11',
                    south: '01',
                    west: '10',
                },
                possibleConnections: {
                    north: 12,
                    east: 5,
                    south: 8,
                    west: 1,
                },
            },
            {
                index: 2,
                connectors: {
                    north: '10',
                    east: '01',
                    south: '11',
                    west: '11',
                },
                possibleConnections: {
                    north: 1,
                    east: 8,
                    south: 3,
                    west: 10,
                },
            },
            {
                index: 3,
                connectors: {
                    north: '01',
                    east: '11',
                    south: '11',
                    west: '01',
                },
                possibleConnections: {
                    north: 2,
                    east: 5,
                    south: 3,
                    west: 4,
                },
            },
        ];

        expect(out).toEqual(expected);
    });
});
