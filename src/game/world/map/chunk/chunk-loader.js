import path from 'path';
import Promise from 'bluebird';
import { VoxLoader } from "../vox";
import { Chunk } from "./chunk";

export const chunksRelativeDir = '../static-chunks';
export const chunksBaseDir = path.join( __dirname, chunksRelativeDir );
export const chunkExtension = 'vox';

export class ChunkLoader {

  /**
   * @param {number} x
   * @param {number} z
   * @returns {Promise<Chunk>}
   */
  load (x, z) {
    x %= 8;
    z %= 8;

    const chunkName = this._getChunkName( x, z );
    const fullPath = this._getChunkPath( chunkName );
    const loader = new VoxLoader();

    return Promise.try(_ => {
      return loader.load( fullPath );
    }).then(model => {
      const chunk = new Chunk( model, { x, z } );
      return chunk.init();
    });
  }

  /**
   * @param {number} x
   * @param {number} z
   * @returns {string}
   * @private
   */
  _getChunkName (x, z) {
    return `chunk-${x}-${z}.${chunkExtension}`;
  }

  /**
   * @param {string} chunkName
   * @returns {string}
   * @private
   */
  _getChunkPath (chunkName) {
    return `${chunksBaseDir}/${chunkName}`;
  }
}