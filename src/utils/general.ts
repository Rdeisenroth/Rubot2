/**
 * Checks if a given Variable is an array[] with at least a length of one or not
 *
 * @param variable the Variable to check
 * @returns
 */
export const isArraywithContent = (variable: any) => Array.isArray(variable) && (!!variable.length) && (variable.length > 0);

/**
 * Gets a random Integer
 *
 * @param min the minimum int
 * @param max the maximum int
 * @returns the random integer
 */
export const getRandomInt = (min: number, max: number) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Counts the Amount of Digits after the Comma of a Number
 *
 * @param {Number} number
 */
export const countDigits = (number: number) => (Math.floor(number) === number) ? 0 : number.toString().split('.')[1].length;

/**
 * Chooses Random Element off an Array
 * @param array The Non-empty Array to choose a random Entry off
 * @returns the Chosen Entry
 */
export const getRandomEntry: <T>(array: T[]) => T = (array) => {
    if (!isArraywithContent(array)) {
        throw new TypeError("The given Argument is not an array or is empty")
    }
    return array[getRandomInt(0, array.length - 1)];
}

/**
 * Chooses Random Element off an Array and considers weights
 * @param array The Weighted Array (Entries are Arrays with The actual entry and a weight > 0)
 * @returns The chosen Entry
 */
export const getRandomEntryWithWeights: <T>(array: [T, number][]) => T = (array) => {
    if (!isArraywithContent(array)) {
        throw new TypeError("The given Argument is not a weighted array or is empty");
    }
    //Gewichte Abspeichern, und dabei
    let maxdigits = Math.max(...array.map(x => countDigits(x[1])));
    let weights = array.map(x => x[1] * Math.pow(10, maxdigits));
    //Maximalgewicht
    let chosenNumber = getRandomInt(1, weights.reduce((x, y) => x + y))
    for (let i = 0, currentWeight = 0; i < weights.length; currentWeight += weights[i], i++) {
        if (chosenNumber > currentWeight && chosenNumber <= currentWeight + weights[i]) {
            return array[i][0];
        }
    }
    return array[0][0];
}