import { readFile } from 'fs';
import { promisify } from 'util';
import { VoxModel } from "./vox-model";
import { parseVoxData } from "./vox-parser";

const readFileAsync = promisify( readFile );

export class VoxLoader {

  /**
   * @param filePath
   * @returns {Promise<VoxModel>}
   */
  load (filePath) {
    return readFileAsync( filePath ).then(buffer => {
      return parseVoxData( buffer );
    }).then(voxelData => {
      return new VoxModel( voxelData );
    });
  }
}