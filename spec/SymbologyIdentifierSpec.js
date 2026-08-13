/**
 * A GS1 barcode may start with a three character symbology identifier saying
 * which kind of code the data was read from. The parser chops it off, records
 * it as codeName and parses the rest.
 *
 * Only ]C1 was exercised anywhere before, so the other five arms of that switch
 * were never run, and neither was the path for a barcode arriving without one.
 */
const { parseBarcode } = require("../src/BarcodeParser");

const symbologies = [
    { identifier: "]C1", codeName: "GS1-128" },
    { identifier: "]e0", codeName: "GS1 DataBar" },
    { identifier: "]e1", codeName: "GS1 Composite" },
    { identifier: "]e2", codeName: "GS1 Composite" },
    { identifier: "]d2", codeName: "GS1 DataMatrix" },
    { identifier: "]Q3", codeName: "GS1 QR Code" }
];

describe("The symbology identifier", () => {
    symbologies.forEach((symbology) => {
        it(`names ${symbology.identifier} as "${symbology.codeName}"`, () => {
            const result = parseBarcode(`${symbology.identifier}0104012345678901`);

            expect(result.codeName).toBe(symbology.codeName);
        });

        it(`is not left in the data of a ${symbology.identifier} barcode`, () => {
            const result = parseBarcode(`${symbology.identifier}0104012345678901`);

            expect(result.parsedCodeItems).toEqual([jasmine.objectContaining({
                ai: "01",
                data: "04012345678901"
            })]);
        });
    });
});

describe("A barcode arriving without a symbology identifier", () => {
    it("is parsed all the same", () => {
        const result = parseBarcode("0104012345678901");

        expect(result.parsedCodeItems).toEqual([jasmine.objectContaining({
            ai: "01",
            data: "04012345678901"
        })]);
    });

    it("is left with an empty codeName, there being nothing to name it after", () => {
        const result = parseBarcode("0104012345678901");

        expect(result.codeName).toBe("");
    });

    it("keeps every character, the first three included", () => {
        const result = parseBarcode("10ABC123");

        expect(result.parsedCodeItems[0].data).toBe("ABC123");
    });
});

/**
 * Elements which carry a three character ISO code in front of their data have
 * two ways out: run to the end of the barcode, or stop at a separator. Only the
 * first was ever exercised.
 */
describe("An element carrying an ISO code", () => {
    const fncChar = String.fromCharCode(29); // the ASCII "group separator"

    it("reads an amount payable which ends at a separator", () => {
        const result = parseBarcode(`]C13932978004711${fncChar}10ABC`);

        expect(result.parsedCodeItems).toEqual([
            jasmine.objectContaining({ ai: "3932", dataTitle: "PRICE", data: 47.11, unit: "978" }),
            jasmine.objectContaining({ ai: "10", data: "ABC" })
        ]);
    });

    it("reads an amount payable which runs to the end of the barcode", () => {
        const result = parseBarcode("]C13932978004711");

        expect(result.parsedCodeItems).toEqual([
            jasmine.objectContaining({ ai: "3932", data: 47.11, unit: "978" })
        ]);
    });

    it("reads a processor number which ends at a separator", () => {
        const result = parseBarcode(`]C17030056ABC${fncChar}10XYZ`);

        expect(result.parsedCodeItems).toEqual([
            jasmine.objectContaining({ ai: "7030", dataTitle: "PROCESSOR # 0", data: "ABC", unit: "056" }),
            jasmine.objectContaining({ ai: "10", data: "XYZ" })
        ]);
    });
});
