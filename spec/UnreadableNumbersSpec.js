/**
 * Dates and measures are read with parseInt and parseFloat, neither of which
 * throws on rubbish: they return NaN. The parser wrapped both in a try which
 * could therefore never fire, and a barcode carrying letters where it should
 * carry digits came back as a successful parse holding an Invalid Date or a
 * null weight, leaving every caller to notice for itself.
 */
const { parseBarcode } = require("../src/BarcodeParser");

describe("A date which is not made of digits", () => {
    it("is refused rather than returned as an Invalid Date", () => {
        expect(() => parseBarcode("]C117ABCDEF")).toThrow("invalid year in date");
    });

    it("is refused when only the month is unreadable", () => {
        expect(() => parseBarcode("]C11725AB30")).toThrow("invalid month in date");
    });

    it("is refused when only the day is unreadable", () => {
        expect(() => parseBarcode("]C1172506AB")).toThrow("invalid day in date");
    });

    it("is refused on a production date as well as an expiry", () => {
        expect(() => parseBarcode("]C111XXXXXX")).toThrow("invalid year in date");
    });
});

describe("A measure which is not made of digits", () => {
    it("is refused rather than returned as null", () => {
        expect(() => parseBarcode("]C13103ABCDEF")).toThrow("invalid number");
    });

    it("is refused for an amount payable too", () => {
        expect(() => parseBarcode("]C13922ABCDEF")).toThrow("invalid number");
    });
});

describe("A date which is made of digits", () => {
    it("still parses", () => {
        const result = parseBarcode("]C117250630");

        expect(result.parsedCodeItems[0].data.getFullYear()).toBe(2025);
        expect(result.parsedCodeItems[0].data.getDate()).toBe(30);
    });

    it("still turns a day of 00 into the last day of the month", () => {
        const result = parseBarcode("]C117250600");

        expect(result.parsedCodeItems[0].data.getMonth()).toBe(5);
        expect(result.parsedCodeItems[0].data.getDate()).toBe(30);
    });
});

describe("A measure which is made of digits", () => {
    it("still parses, decimals and all", () => {
        const result = parseBarcode("]C13103000525");

        expect(result.parsedCodeItems[0].data).toBe(0.525);
    });
});
