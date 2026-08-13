/**
 * Elements of fixed length are spliced out of the barcode by position. A
 * barcode which was cut short used to yield a shorter slice instead of an
 * error, so a partial scan came back looking like a valid code.
 *
 * These specs pin down that a fixed length element which isn't fully there
 * is rejected, while everything else keeps parsing as before.
 */
const { parseBarcode } = require("../src/BarcodeParser");

const fncChar = String.fromCharCode(29); // the ASCII "group separator"
const truncationError = "truncated fixed length element";

describe("A barcode with a truncated fixed length element", () => {
    it("is rejected when the GTIN is too short", () => {
        expect(() => parseBarcode("]C10104")).toThrow(truncationError);
    });

    it("is rejected when the GTIN has no data at all", () => {
        expect(() => parseBarcode("]C101")).toThrow(truncationError);
    });

    it("is rejected when the truncated element ends a longer barcode", () => {
        const barcode = `]C110ABC123${fncChar}0104012345`;

        expect(() => parseBarcode(barcode)).toThrow(truncationError);
    });

    it("is rejected when a measure element is too short", () => {
        expect(() => parseBarcode("]C131030052")).toThrow(truncationError);
    });

    it("is rejected without a symbology identifier as well", () => {
        expect(() => parseBarcode("0104")).toThrow(truncationError);
    });

    it("is rejected when a date is a character short", () => {
        expect(() => parseBarcode("]C11725063")).toThrow(truncationError);
    });

    it("is rejected when a date has no data at all", () => {
        expect(() => parseBarcode("]C117")).toThrow(truncationError);
    });
});

/**
 * Counting the characters left in the barcode is not enough on its own. A
 * separator inside the element's own window means the element ended early and
 * the rest belongs to the element after it, so the data would otherwise be
 * returned with a control character embedded in it.
 */
describe("A barcode where a separator cuts a fixed length element short", () => {
    it("is rejected when a separator follows a short GTIN", () => {
        expect(() => parseBarcode(`]C1010401234567890${fncChar}`)).toThrow(truncationError);
    });

    it("is rejected when a separator follows a short measure", () => {
        expect(() => parseBarcode(`]C1310300052${fncChar}`)).toThrow(truncationError);
    });

    it("is rejected when a separator follows a short date", () => {
        expect(() => parseBarcode(`]C11725063${fncChar}`)).toThrow(truncationError);
    });

    it("is rejected when the short element sits in the middle of the barcode", () => {
        const barcode = `]C10104${fncChar}10ABCDEFGHI`;

        expect(() => parseBarcode(barcode)).toThrow(truncationError);
    });
});

describe("A barcode with a complete fixed length element", () => {
    it("still parses the GTIN", () => {
        const result = parseBarcode("]C10104012345678901");

        expect(result.parsedCodeItems).toEqual([jasmine.objectContaining({
            ai: "01",
            dataTitle: "GTIN",
            data: "04012345678901"
        })]);
    });

    it("still parses a fixed length element followed by more data", () => {
        const barcode = `]C10104012345678901${fncChar}10ABC123`;
        const result = parseBarcode(barcode);

        expect(result.parsedCodeItems).toEqual([
            jasmine.objectContaining({ ai: "01", data: "04012345678901" }),
            jasmine.objectContaining({ ai: "10", data: "ABC123" })
        ]);
    });

    it("still parses a measure element", () => {
        const result = parseBarcode("]C13103000525");

        expect(result.parsedCodeItems).toEqual([jasmine.objectContaining({
            ai: "3103",
            dataTitle: "NET WEIGHT (kg)",
            data: 0.525,
            unit: "KGM"
        })]);
    });

    it("still parses a date which is followed by a separator", () => {
        const barcode = `]C117250630${fncChar}10ABC`;
        const result = parseBarcode(barcode);

        expect(result.parsedCodeItems).toEqual([
            jasmine.objectContaining({ ai: "17", dataTitle: "USE BY OR EXPIRY" }),
            jasmine.objectContaining({ ai: "10", data: "ABC" })
        ]);
    });
});

describe("A barcode with a short element of variable length", () => {
    it("is accepted, as variable length elements have no minimum", () => {
        const result = parseBarcode("]C110A");

        expect(result.parsedCodeItems).toEqual([jasmine.objectContaining({
            ai: "10",
            dataTitle: "BATCH/LOT",
            data: "A"
        })]);
    });
});
