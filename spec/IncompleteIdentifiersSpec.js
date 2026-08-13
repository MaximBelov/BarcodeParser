/**
 * A barcode can stop part way through an application identifier — a half read
 * scan, or a code cut short. Several of the inner switches carry no default arm,
 * so the digit they were about to read simply is not there, nothing matches,
 * nothing parses, and the element the parser was building is left as the empty
 * string it started as.
 *
 * That used to be pushed onto the answer: parseBarcode("]C1430") came back as a
 * successful parse whose one element was "". These are the 26 three digit
 * prefixes it happened for. Some are a real family with the last digit missing,
 * 430x being one; others name nothing the standard defines, 230x being one.
 */
const { parseBarcode } = require("../src/BarcodeParser");

const incompletePrefixes = [
    "230", "231", "232", "233", "234", "236", "237", "238", "239",
    "430", "431", "432", "433",
    "701", "702", "704",
    "720", "721", "722", "724", "725", "726", "727", "728", "729",
    "803"
];

describe("A barcode which stops part way through an identifier", () => {
    incompletePrefixes.forEach((prefix) => {
        it(`refuses ]C1${prefix}`, () => {
            expect(() => parseBarcode(`]C1${prefix}`)).toThrow("unrecognised AI");
        });
    });

    it("never returns an element which is not a parsed element", () => {
        incompletePrefixes.forEach((prefix) => {
            let items = null;

            try {
                items = parseBarcode(`]C1${prefix}`).parsedCodeItems;
            } catch (refused) {
                items = null;
            }

            expect(items).toBeNull();
        });
    });

    it("refuses the same prefix without a symbology identifier", () => {
        expect(() => parseBarcode("430")).toThrow("unrecognised AI");
    });

    it("refuses it in the parenthesised form too", () => {
        expect(() => parseBarcode("(430)")).toThrow("unrecognised AI");
    });
});

describe("The identifiers which do exist, given their missing digit", () => {
    it("parse as they always did", () => {
        expect(parseBarcode("]C14300ABC").parsedCodeItems[0].ai).toBe("4300");
        expect(parseBarcode("]C14309" + "1".repeat(20)).parsedCodeItems[0].ai).toBe("4309");
        expect(parseBarcode("]C17010ABC").parsedCodeItems[0].ai).toBe("7010");
        expect(parseBarcode("]C17011250630").parsedCodeItems[0].ai).toBe("7011");
    });

    it("are still refused where no such identifier exists at all", () => {
        // 235 is the only 23x the standard defines, so no fourth digit helps.
        expect(() => parseBarcode("]C12300ABC")).toThrow("unrecognised AI");
        expect(parseBarcode("]C1235ABC").parsedCodeItems[0].ai).toBe("235");
    });

    it("still parse when the barcode carries more elements after them", () => {
        const fncChar = String.fromCharCode(29); // the ASCII "group separator"
        const result = parseBarcode(`]C14300ABC${fncChar}10BATCH42`);

        expect(result.parsedCodeItems.map((item) => item.ai)).toEqual(["4300", "10"]);
    });
});

/**
 * Two identifiers are built by putting the fourth digit onto a stem rather than
 * by matching it, so there is no switch arm to fall through: a barcode stopping
 * before that digit came back with an ai of "703" or "723", neither of which the
 * standard defines, and a title trailing off after the "#".
 */
describe("An identifier whose fourth digit makes up its number", () => {
    it("refuses a processor number with no fourth digit", () => {
        expect(() => parseBarcode("]C1703")).toThrow("unrecognised AI");
    });

    it("refuses a certification reference with no fourth digit", () => {
        expect(() => parseBarcode("]C1723")).toThrow("unrecognised AI");
    });

    it("reads them once the fourth digit is there", () => {
        expect(parseBarcode("]C17030056ABC").parsedCodeItems[0]).toEqual(jasmine.objectContaining({
            ai: "7030",
            dataTitle: "PROCESSOR # 0",
            data: "ABC",
            unit: "056"
        }));
        expect(parseBarcode("]C17239ABC123").parsedCodeItems[0]).toEqual(jasmine.objectContaining({
            ai: "7239",
            dataTitle: "CERT # 9",
            data: "ABC123"
        }));
    });

    it("leaves a real three digit identifier alone", () => {
        // 421 is three digits by definition, not a stem waiting for a fourth.
        expect(parseBarcode("]C1421056ABC").parsedCodeItems[0].ai).toBe("421");
    });
});
