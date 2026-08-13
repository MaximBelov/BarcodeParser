/**
 * Element strings are printed underneath the barcode with their AIs in
 * parentheses, e.g. "(01)04012345678901(17)261230(10)ABC123". Scanners
 * hand that form over and people type it in, so the parser takes it as
 * well: the parentheses are rewritten into FNC1 separators and the
 * result goes through the same AI switch as any other barcode.
 */
const { parseBarcode } = require("../src/BarcodeParser");

describe("A parsed parenthesised element string", () => {
    let result;

    beforeEach(() => {
        result = parseBarcode("(01)04012345678901(17)261230(10)ABC123");
    });

    it("is named after the human readable form", () => {
        expect(result.codeName).toBe("GS1 Element String (HRI)");
    });

    it("has 3 elements", () => {
        expect(result.parsedCodeItems.length).toBe(3);
    });

    it("has the GTIN element", () => {
        expect(result.parsedCodeItems).toEqual(jasmine.arrayContaining([jasmine.objectContaining({
            ai: "01",
            dataTitle: "GTIN",
            data: "04012345678901"
        })]));
    });

    it("has the EXPIRY element", () => {
        expect(result.parsedCodeItems).toEqual(jasmine.arrayContaining([jasmine.objectContaining({
            ai: "17",
            dataTitle: "USE BY OR EXPIRY",
            data: new Date(2026, 11, 30, 0, 0, 0, 0)
        })]));
    });

    it("has the BATCH/LOT element", () => {
        expect(result.parsedCodeItems).toEqual(jasmine.arrayContaining([jasmine.objectContaining({
            ai: "10",
            dataTitle: "BATCH/LOT",
            data: "ABC123"
        })]));
    });
});

describe("A parenthesised element of variable length", () => {
    let result;

    beforeEach(() => {
        result = parseBarcode("(10)ABC123(21)9876");
    });

    it("has 2 elements", () => {
        expect(result.parsedCodeItems.length).toBe(2);
    });

    it("ends where the next AI begins", () => {
        expect(result.parsedCodeItems).toEqual(jasmine.arrayContaining([jasmine.objectContaining({
            ai: "10",
            dataTitle: "BATCH/LOT",
            data: "ABC123"
        })]));
    });

    it("is followed by the next element", () => {
        expect(result.parsedCodeItems).toEqual(jasmine.arrayContaining([jasmine.objectContaining({
            ai: "21",
            dataTitle: "SERIAL",
            data: "9876"
        })]));
    });
});

describe("A parenthesised element of fixed length", () => {
    it("takes exactly its own characters", () => {
        const result = parseBarcode("(00)123456789012345678(21)9876");

        expect(result.parsedCodeItems.length).toBe(2);
        expect(result.parsedCodeItems).toEqual(jasmine.arrayContaining([jasmine.objectContaining({
            ai: "00",
            dataTitle: "SSCC",
            data: "123456789012345678"
        })]));
        expect(result.parsedCodeItems).toEqual(jasmine.arrayContaining([jasmine.objectContaining({
            ai: "21",
            dataTitle: "SERIAL",
            data: "9876"
        })]));
    });

    it("works as the only element of the barcode", () => {
        const result = parseBarcode("(01)04012345678901");

        expect(result.parsedCodeItems.length).toBe(1);
        expect(result.parsedCodeItems[0].ai).toBe("01");
        expect(result.parsedCodeItems[0].data).toBe("04012345678901");
    });
});

describe("A parenthesis which doesn't enclose an AI", () => {
    it("stays in the data", () => {
        const result = parseBarcode("(10)AB(C)D");

        expect(result.parsedCodeItems.length).toBe(1);
        expect(result.parsedCodeItems[0].ai).toBe("10");
        expect(result.parsedCodeItems[0].data).toBe("AB(C)D");
    });
});

/**
 * The parentheses say where the AI ends, the AI switch works it out from the
 * digits and takes the shortest match. Where the two disagree the writer meant
 * something the parser cannot deliver, and saying so beats silently parsing
 * the surplus digits as data.
 *
 * These use elements of variable length on purpose. Give a fixed length AI a
 * surplus digit and its data is a character short as well, so a parser which
 * also checks fixed lengths rejects the code before it ever reaches the
 * comparison these specs are about.
 */
describe("A parenthesised barcode whose AI does not survive parsing", () => {
    const mismatchError = "bracketed AI does not match the parsed element";

    it("is rejected when the AI carries a surplus digit", () => {
        expect(() => parseBarcode("(107)ABC")).toThrow(mismatchError);
    });

    it("is rejected when the AI carries two surplus digits", () => {
        expect(() => parseBarcode("(1023)ABC")).toThrow(mismatchError);
    });

    it("is rejected when only one of several AIs is wrong", () => {
        expect(() => parseBarcode("(01)04012345678901(213)XYZ")).toThrow(mismatchError);
    });
});

describe("A parenthesised barcode which isn't an element string at all", () => {
    it("is rejected when the parentheses hold too few digits", () => {
        expect(() => parseBarcode("(1)23")).toThrow("no valid AI");
    });

    it("is rejected when the parentheses hold too many digits", () => {
        expect(() => parseBarcode("(01234)5")).toThrow("no valid AI");
    });

    it("is rejected when the parentheses are empty", () => {
        expect(() => parseBarcode("()123")).toThrow("no valid AI");
    });
});

describe("A parenthesised barcode carrying a composed AI", () => {
    it("parses a measure, whose AI ends in its decimal indicator", () => {
        const result = parseBarcode("(3103)000525");

        expect(result.parsedCodeItems).toEqual([jasmine.objectContaining({
            ai: "3103",
            dataTitle: "NET WEIGHT (kg)",
            data: 0.525,
            unit: "KGM"
        })]);
    });

    it("parses an amount payable, whose AI is followed by a currency", () => {
        const result = parseBarcode("(3932)978004711");

        expect(result.parsedCodeItems).toEqual([jasmine.objectContaining({
            ai: "3932",
            dataTitle: "PRICE",
            unit: "978"
        })]);
    });
});

describe("A parenthesised element string with a symbology identifier", () => {
    let result;

    beforeEach(() => {
        result = parseBarcode("]C1(01)04012345678901(10)ABC123");
    });

    it("keeps the name of the symbology", () => {
        expect(result.codeName).toBe("GS1-128");
    });

    it("still parses its elements", () => {
        expect(result.parsedCodeItems.length).toBe(2);
        expect(result.parsedCodeItems).toEqual(jasmine.arrayContaining([jasmine.objectContaining({
            ai: "10",
            dataTitle: "BATCH/LOT",
            data: "ABC123"
        })]));
    });
});

describe("A barcode which isn't parenthesised", () => {
    it("is parsed as before", () => {
        const fncChar = String.fromCharCode(29); // the ASCII "group separator"
        const result = parseBarcode(`]C101040123456789011715122910ABC123${fncChar}21XYZ987`);

        expect(result.codeName).toBe("GS1-128");
        expect(result.parsedCodeItems.length).toBe(4);
        expect(result.parsedCodeItems).toEqual(jasmine.arrayContaining([jasmine.objectContaining({
            ai: "10",
            dataTitle: "BATCH/LOT",
            data: "ABC123"
        })]));
        expect(result.parsedCodeItems).toEqual(jasmine.arrayContaining([jasmine.objectContaining({
            ai: "21",
            dataTitle: "SERIAL",
            data: "XYZ987"
        })]));
    });

    it("may carry a parenthesis in its data", () => {
        const result = parseBarcode("]C110(01)ABC");

        expect(result.codeName).toBe("GS1-128");
        expect(result.parsedCodeItems.length).toBe(1);
        expect(result.parsedCodeItems[0].ai).toBe("10");
        expect(result.parsedCodeItems[0].data).toBe("(01)ABC");
    });
});
