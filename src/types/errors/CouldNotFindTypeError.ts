export default class CouldNotFindTypeInFileError extends Error {
    /**
     * The type which could not be found.
     */
    public expectedType: string

    /**
     * The name of the file in which the type could not be found.
     */
    public fileName: string

    /**
     * Creates a new could not find type in file error.
     * @param expectedType The type which could not be found.
     * @param fileName The name of the file in which the type could not be found.
     */
    constructor(expectedType: string, fileName: string) {
        super(`Could not find type "${expectedType}" in file "${fileName}".`)
        this.expectedType = expectedType
        this.fileName = fileName
    }
}