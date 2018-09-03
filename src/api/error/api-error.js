import { errorTypes } from "./error-types";

export class ApiError {

  /**
   * @type {string}
   * @private
   */
  errorCode = '';

  /**
   * @type {string}
   * @private
   */
  errorMessage = '';

  /**
   * @type {number}
   * @private
   */
  httpCode = 400;

  /**
   * @type {*}
   * @private
   */
  params = {};

  /**
   * @param {string} errorCode
   * @param {number} httpCode
   * @param {*} params
   * @param {string|*} errorMessage
   */
  constructor (errorCode = 'unknown_error', httpCode = 400, params = {}, errorMessage = null) {
    this.errorCode = errorCode;
    this.errorMessage = errorMessage || errorTypes.get( this.errorCode ) || 'Unknown error';
    this.httpCode = httpCode;
    this.params = params;
  }

  /**
   * @return {{message: string, httpCode: number, params: *}}
   */
  get plainError () {
    return {
      code: this.errorCode,
      message: this.errorMessage,
      httpCode: this.httpCode,
      ...(
        Object.keys( this.params ).length
          ? { params: this.params }
          : {}
      )
    }
  }
}